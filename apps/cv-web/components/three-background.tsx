"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─────────────────────────────────────────────
   1. Neural Network / AI Constellation
   ───────────────────────────────────────────── */

function NeuralNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const nodeCount = 50;
  const maxDist = 3.5;

  const { nodes, velocities } = useMemo(() => {
    const n: THREE.Vector3[] = [];
    const v: THREE.Vector3[] = [];
    for (let i = 0; i < nodeCount; i++) {
      n.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 6,
        ),
      );
      v.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.005,
        ),
      );
    }
    return { nodes: n, velocities: v };
  }, []);

  const pointGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
      pos[i * 3] = nodes[i].x;
      pos[i * 3 + 1] = nodes[i].y;
      pos[i * 3 + 2] = nodes[i].z;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [nodes, nodeCount]);

  const lineGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const maxLines = (nodeCount * (nodeCount - 1)) / 2;
    const pos = new Float32Array(maxLines * 6);
    const col = new Float32Array(maxLines * 6);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setDrawRange(0, 0);
    return geo;
  }, [nodeCount]);

  useFrame(() => {
    // Update node positions
    for (let i = 0; i < nodeCount; i++) {
      nodes[i].add(velocities[i]);
      if (Math.abs(nodes[i].x) > 7) velocities[i].x *= -1;
      if (Math.abs(nodes[i].y) > 5) velocities[i].y *= -1;
      if (Math.abs(nodes[i].z) > 3) velocities[i].z *= -1;
    }

    // Update point positions
    if (pointsRef.current) {
      const pAttr = pointsRef.current.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const pArr = pAttr.array as Float32Array;
      for (let i = 0; i < nodeCount; i++) {
        pArr[i * 3] = nodes[i].x;
        pArr[i * 3 + 1] = nodes[i].y;
        pArr[i * 3 + 2] = nodes[i].z;
      }
      pAttr.needsUpdate = true;
    }

    // Update connecting lines
    if (linesRef.current) {
      const lPos = linesRef.current.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const lCol = linesRef.current.geometry.getAttribute(
        "color",
      ) as THREE.BufferAttribute;
      const posArr = lPos.array as Float32Array;
      const colArr = lCol.array as Float32Array;
      let idx = 0;
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const d = nodes[i].distanceTo(nodes[j]);
          if (d < maxDist) {
            const alpha = 1 - d / maxDist;
            posArr[idx * 6] = nodes[i].x;
            posArr[idx * 6 + 1] = nodes[i].y;
            posArr[idx * 6 + 2] = nodes[i].z;
            posArr[idx * 6 + 3] = nodes[j].x;
            posArr[idx * 6 + 4] = nodes[j].y;
            posArr[idx * 6 + 5] = nodes[j].z;
            const r = 0.4 + alpha * 0.15;
            const g = 0.38 + alpha * 0.12;
            const b = 0.98;
            colArr[idx * 6] = r;
            colArr[idx * 6 + 1] = g;
            colArr[idx * 6 + 2] = b;
            colArr[idx * 6 + 3] = r;
            colArr[idx * 6 + 4] = g;
            colArr[idx * 6 + 5] = b;
            idx++;
          }
        }
      }
      lPos.needsUpdate = true;
      lCol.needsUpdate = true;
      linesRef.current.geometry.setDrawRange(0, idx * 2);
    }
  });

  return (
    <group>
      <points ref={pointsRef} geometry={pointGeo}>
        <pointsMaterial
          size={3}
          color="#818cf8"
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <lineSegments ref={linesRef} geometry={lineGeo}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

/* ─────────────────────────────────────────────
   2. Floating Document Pages — CV / Resume shapes
   ───────────────────────────────────────────── */

function FloatingDocument({
  position,
  rotation,
  speed,
  color,
  scale,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  speed: number;
  color: string;
  scale: number;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const initialY = position[1];
  const phaseOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.y =
      initialY + Math.sin(t * speed + phaseOffset) * 0.6;
    meshRef.current.rotation.y += 0.003 * speed;
    meshRef.current.rotation.x =
      rotation[0] + Math.sin(t * speed * 0.5 + phaseOffset) * 0.08;
    meshRef.current.rotation.z = rotation[2] + Math.cos(t * speed * 0.3) * 0.05;
  });

  const { docShape, borderGeo, textLineShapes } = useMemo(() => {
    const w = 0.8 * scale;
    const h = 1.04 * scale;
    const r = 0.05 * scale;

    // Document outline shape
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

    // Border geometry (line loop)
    const pts = s.getPoints(48);
    const bGeo = new THREE.BufferGeometry();
    const bArr = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => {
      bArr[i * 3] = p.x;
      bArr[i * 3 + 1] = p.y;
      bArr[i * 3 + 2] = 0;
    });
    bGeo.setAttribute("position", new THREE.BufferAttribute(bArr, 3));

    // Text line shapes inside document
    const lines: THREE.Shape[] = [];
    const lineCount = 6;
    const margin = 0.12 * scale;
    const lineH = 0.018 * scale;
    const spacing = (h - 2 * margin) / (lineCount + 1);
    for (let i = 0; i < lineCount; i++) {
      const y = h / 2 - margin - (i + 1) * spacing;
      const lineW =
        i === 0
          ? w - 2 * margin
          : (w - 2 * margin) * (0.45 + Math.random() * 0.45);
      const ls = new THREE.Shape();
      ls.moveTo(-w / 2 + margin, y + lineH);
      ls.lineTo(-w / 2 + margin + lineW, y + lineH);
      ls.lineTo(-w / 2 + margin + lineW, y);
      ls.lineTo(-w / 2 + margin, y);
      ls.closePath();
      lines.push(ls);
    }

    return { docShape: s, borderGeo: bGeo, textLineShapes: lines };
  }, [scale]);

  return (
    <group ref={meshRef} position={position} rotation={rotation}>
      {/* Document fill */}
      <mesh>
        <shapeGeometry args={[docShape]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Document border */}
      <lineLoop geometry={borderGeo}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </lineLoop>
      {/* Text lines */}
      {textLineShapes.map((ls, i) => (
        <mesh key={i}>
          <shapeGeometry args={[ls]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ─────────────────────────────────────────────
   3. Data Stream Particles — flowing upward
   ───────────────────────────────────────────── */

function DataStream({
  xOffset,
  color,
  count,
  speed,
}: {
  xOffset: number;
  color: string;
  count: number;
  speed: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = xOffset + (Math.random() - 0.5) * 0.6;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count, xOffset]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const attr = pointsRef.current.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speed * 0.025;
      if (arr[i * 3 + 1] > 7) {
        arr[i * 3 + 1] = -7;
        arr[i * 3] = xOffset + (Math.random() - 0.5) * 0.6;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        size={2.5}
        color={color}
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ─────────────────────────────────────────────
   4. Holographic Grid Floor
   ───────────────────────────────────────────── */

function HolographicGrid() {
  const meshRef = useRef<THREE.LineSegments>(null);

  const geo = useMemo(() => {
    const gridSize = 24;
    const divisions = 24;
    const step = gridSize / divisions;
    const half = gridSize / 2;
    const pos: number[] = [];
    const col: number[] = [];

    for (let i = 0; i <= divisions; i++) {
      const t = i * step - half;
      pos.push(-half, 0, t, half, 0, t);
      pos.push(t, 0, -half, t, 0, half);
      const fade = 1 - Math.abs(t / half) * 0.7;
      const r = 0.39 * fade;
      const g = 0.4 * fade;
      const b = 0.97 * fade;
      col.push(r, g, b, r * 0.3, g * 0.3, b * 0.3);
      col.push(r, g, b, r * 0.3, g * 0.3, b * 0.3);
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(pos), 3),
    );
    g.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(col), 3),
    );
    return g;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.position.y =
      -4.5 + Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
    meshRef.current.position.z = -2;
    meshRef.current.rotation.x = -Math.PI * 0.32;
  });

  return (
    <lineSegments ref={meshRef} geometry={geo}>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.18}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/* ─────────────────────────────────────────────
   5. Orbiting Skill Nodes
   ───────────────────────────────────────────── */

function OrbitingNodes() {
  const groupRef = useRef<THREE.Group>(null);
  const nodeCount = 14;

  const nodeData = useMemo(() => {
    const palette = ["#818cf8", "#a78bfa", "#c084fc", "#6366f1", "#e879f9"];
    return Array.from({ length: nodeCount }, (_, i) => ({
      radius: 3 + Math.random() * 3.5,
      speed: 0.1 + Math.random() * 0.15,
      offset: (i / nodeCount) * Math.PI * 2,
      yOffset: (Math.random() - 0.5) * 5,
      size: 0.08 + Math.random() * 0.1,
      color: palette[Math.floor(Math.random() * palette.length)],
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      if (i >= nodeData.length) return;
      const d = nodeData[i];
      child.position.x = Math.cos(t * d.speed + d.offset) * d.radius;
      child.position.y =
        d.yOffset + Math.sin(t * d.speed * 1.5 + d.offset) * 1.2;
      child.position.z = Math.sin(t * d.speed * 0.5 + d.offset) * 1.5;
    });
  });

  return (
    <group ref={groupRef}>
      {nodeData.map((d, i) => (
        <mesh key={i} scale={d.size}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={d.color}
            transparent
            opacity={0.75}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ─────────────────────────────────────────────
   6. Pulsing Rings — AI processing broadcast
   ───────────────────────────────────────────── */

function PulsingRings() {
  const ringsRef = useRef<THREE.Group>(null);
  const ringCount = 4;

  const rings = useMemo(
    () =>
      Array.from({ length: ringCount }, (_, i) => ({
        delay: i * 1.5,
        maxScale: 5 + i * 1.5,
      })),
    [],
  );

  useFrame((state) => {
    if (!ringsRef.current) return;
    const t = state.clock.elapsedTime;
    ringsRef.current.children.forEach((child, i) => {
      if (i >= rings.length) return;
      const ring = rings[i];
      const phase = ((t + ring.delay) % 6) / 6;
      const scale = 0.1 + phase * ring.maxScale;
      const opacity = (1 - phase) * 0.25;
      child.scale.set(scale, scale, scale);
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = Math.max(0, opacity);
    });
  });

  return (
    <group ref={ringsRef} position={[0, 0, -3]}>
      {rings.map((_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.95, 1, 80]} />
          <meshBasicMaterial
            color="#6366f1"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ─────────────────────────────────────────────
   7. Ambient Dust
   ───────────────────────────────────────────── */

function AmbientDust() {
  const ref = useRef<THREE.Points>(null);
  const count = 500;

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.01;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.005) * 0.05;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={1.8}
        color="#a78bfa"
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ─────────────────────────────────────────────
   Scene Composition
   ───────────────────────────────────────────── */

function Scene() {
  return (
    <>
      <NeuralNetwork />

      <FloatingDocument
        position={[-5, 2, -2]}
        rotation={[0.15, 0.3, 0.05]}
        speed={0.3}
        color="#818cf8"
        scale={1.8}
      />
      <FloatingDocument
        position={[5, -1.5, -1]}
        rotation={[-0.1, -0.4, 0.1]}
        speed={0.25}
        color="#a78bfa"
        scale={1.5}
      />
      <FloatingDocument
        position={[-2.5, -3, -1.5]}
        rotation={[0.2, 0.6, -0.1]}
        speed={0.35}
        color="#c084fc"
        scale={1.2}
      />
      <FloatingDocument
        position={[6, 3, -3]}
        rotation={[-0.05, -0.2, 0.08]}
        speed={0.2}
        color="#6366f1"
        scale={2}
      />
      <FloatingDocument
        position={[-6.5, 0.5, -2.5]}
        rotation={[0.1, 0.5, -0.05]}
        speed={0.28}
        color="#818cf8"
        scale={1.3}
      />

      <DataStream xOffset={-5} color="#818cf8" count={35} speed={0.8} />
      <DataStream xOffset={-1.5} color="#a78bfa" count={30} speed={1.2} />
      <DataStream xOffset={2.5} color="#6366f1" count={32} speed={1.0} />
      <DataStream xOffset={6} color="#c084fc" count={28} speed={0.9} />

      <HolographicGrid />
      <OrbitingNodes />
      <PulsingRings />
      <AmbientDust />
    </>
  );
}

/* ─────────────────────────────────────────────
   Export
   ───────────────────────────────────────────── */

export default function ThreeBackground() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none w-screen h-screen"
      style={{ opacity: "var(--t-three-opacity, 1)" }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
