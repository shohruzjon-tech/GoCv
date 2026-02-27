"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ═══════════════════════════════════════════════
   GoCV — Neuro-Link Background
   ───────────────────────────────────────────────
   Single futuristic neural-network animation.
   • Tiny circular particles (canvas-generated texture)
   • Distance-fading synaptic connections
   • Nodes gravitate toward the mouse cursor
   • Smooth global rotation + depth fog
   ═══════════════════════════════════════════════ */

/* ── Circular particle sprite (no square edges) ── */
function createCircleTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Radial gradient: bright center → transparent edge
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.8)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.15)");
  grad.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/* ── Random point inside a sphere ── */
function randomInSphere(radius: number): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(Math.random());
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  );
}

/* ── Shared mouse state (projected into 3D world) ── */
const mouseWorld = new THREE.Vector3(0, 0, 0);
const mouseNDC = new THREE.Vector2(9999, 9999); // off-screen initially
let mouseActive = false; // true when cursor is inside viewport

function MouseTracker() {
  const { camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    [],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseActive = true;
    };
    const onLeave = () => {
      mouseNDC.set(9999, 9999);
      mouseActive = false;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useFrame(() => {
    raycaster.setFromCamera(mouseNDC, camera);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);
    if (target) {
      mouseWorld.lerp(target, 0.08);
    }
  });

  return null;
}

/* ─────────────────────────────────────────────
   NeuroLink — The main animation
   ───────────────────────────────────────────── */

function NeuroLink({ reduced }: { reduced: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const count = reduced ? 50 : 100;
  const radius = 8;
  const maxDist = 3.0;
  const mouseInfluence = reduced ? 0 : 0.015; // attraction strength
  const mouseRadius = 5; // how far the attraction reaches

  const circleTexture = useMemo(() => createCircleTexture(), []);

  /* ── init particles ── */
  const { nodes, velocities, orbitAxes, orbitSpeeds } = useMemo(() => {
    const n: THREE.Vector3[] = [];
    const v: THREE.Vector3[] = [];
    const axes: THREE.Vector3[] = [];
    const speeds: number[] = [];
    for (let i = 0; i < count; i++) {
      n.push(randomInSphere(radius));
      v.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.0003,
          (Math.random() - 0.5) * 0.0003,
          (Math.random() - 0.5) * 0.00018,
        ),
      );
      axes.push(
        new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5,
        ).normalize(),
      );
      speeds.push(0.00008 + Math.random() * 0.00018);
    }
    return { nodes: n, velocities: v, orbitAxes: axes, orbitSpeeds: speeds };
  }, [count, radius]);

  /* ── point geometry ── */
  const pointGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = nodes[i].x;
      pos[i * 3 + 1] = nodes[i].y;
      pos[i * 3 + 2] = nodes[i].z;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [nodes, count]);

  /* ── line geometry with vertex colours ── */
  const lineGeo = useMemo(() => {
    const maxLines = (count * (count - 1)) / 2;
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(maxLines * 6), 3),
    );
    g.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(maxLines * 6), 3),
    );
    g.setDrawRange(0, 0);
    return g;
  }, [count]);

  const _quat = useMemo(() => new THREE.Quaternion(), []);
  const _dir = useMemo(() => new THREE.Vector3(), []);
  const _vel = useMemo(() => new THREE.Vector3(), []);
  const speedMul = useRef(1); // smoothed speed multiplier

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Smoothly ramp speed: 1× idle → 5× on hover
    const target = mouseActive && !reduced ? 5 : 1;
    speedMul.current += (target - speedMul.current) * 0.035;
    const sm = speedMul.current;

    /* ── move particles ── */
    for (let i = 0; i < count; i++) {
      // Drift + orbit, scaled by speed multiplier
      if (!reduced) {
        _vel.copy(velocities[i]).multiplyScalar(sm);
        nodes[i].add(_vel);
        _quat.setFromAxisAngle(orbitAxes[i], orbitSpeeds[i] * sm);
        nodes[i].applyQuaternion(_quat);
      } else {
        nodes[i].add(velocities[i].clone().multiplyScalar(0.25));
      }

      // Mouse attraction — nodes gently gravitate toward cursor
      if (mouseInfluence > 0 && mouseNDC.x < 100) {
        _dir.copy(mouseWorld).sub(nodes[i]);
        const dist = _dir.length();
        if (dist < mouseRadius && dist > 0.1) {
          const force = mouseInfluence * (1 - dist / mouseRadius);
          _dir.normalize().multiplyScalar(force);
          nodes[i].add(_dir);
        }
      }

      // Spherical boundary
      const d = nodes[i].length();
      if (d > radius) {
        nodes[i].multiplyScalar(radius / d);
        velocities[i].negate();
      }
    }

    /* ── update point positions ── */
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const a = attr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        a[i * 3] = nodes[i].x;
        a[i * 3 + 1] = nodes[i].y;
        a[i * 3 + 2] = nodes[i].z;
      }
      attr.needsUpdate = true;
    }

    /* ── update connection lines ── */
    if (linesRef.current) {
      const posAttr = linesRef.current.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const colAttr = linesRef.current.geometry.getAttribute(
        "color",
      ) as THREE.BufferAttribute;
      const pa = posAttr.array as Float32Array;
      const ca = colAttr.array as Float32Array;

      // Indigo-500 in linear RGB
      const cr = 0.388,
        cg = 0.4,
        cb = 0.945;

      let idx = 0;
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dist = nodes[i].distanceTo(nodes[j]);
          if (dist < maxDist) {
            const fade = 1 - dist / maxDist;
            const o = idx * 6;
            pa[o] = nodes[i].x;
            pa[o + 1] = nodes[i].y;
            pa[o + 2] = nodes[i].z;
            pa[o + 3] = nodes[j].x;
            pa[o + 4] = nodes[j].y;
            pa[o + 5] = nodes[j].z;
            ca[o] = cr * fade;
            ca[o + 1] = cg * fade;
            ca[o + 2] = cb * fade;
            ca[o + 3] = cr * fade;
            ca[o + 4] = cg * fade;
            ca[o + 5] = cb * fade;
            idx++;
          }
        }
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      linesRef.current.geometry.setDrawRange(0, idx * 2);
    }

    /* ── slow global rotation (scales with hover speed) ── */
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.003 * sm;
      groupRef.current.rotation.x = Math.sin(t * 0.0015 * sm) * 0.025;
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} geometry={pointGeo}>
        <pointsMaterial
          map={circleTexture}
          size={1.4}
          color="#a5b4fc"
          transparent
          opacity={0.6}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          alphaTest={0.01}
        />
      </points>
      <lineSegments ref={linesRef} geometry={lineGeo}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

/* ─────────────────────────────────────────────
   Scene
   ───────────────────────────────────────────── */

function Scene({ reduced }: { reduced: boolean }) {
  return (
    <>
      <fog attach="fog" args={["#08081a", 10, 30]} />
      <MouseTracker />
      <NeuroLink reduced={reduced} />
    </>
  );
}

/* ─────────────────────────────────────────────
   Export — ThreeBackground
   ───────────────────────────────────────────── */

export default function ThreeBackground() {
  const [reduced, setReduced] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", onChange);

    setIsMobile(window.innerWidth < 768);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      mql.removeEventListener("change", onChange);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const effectiveReduced = reduced || isMobile;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none w-screen h-screen"
      style={{ opacity: "var(--t-three-opacity, 1)" }}
    >
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <Scene reduced={effectiveReduced} />
      </Canvas>
    </div>
  );
}
