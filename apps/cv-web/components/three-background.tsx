"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function FloatingParticles() {
  const meshRef = useRef<THREE.Points>(null);
  const count = 800;

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      sz[i] = Math.random() * 0.03 + 0.01;
    }
    return [pos, sz];
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#6366f1"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function GlowingSphere({
  position,
  color,
  speed,
  distort,
  scale,
}: {
  position: [number, number, number];
  color: string;
  speed: number;
  distort: number;
  scale: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.3;
  });

  return (
    <Float speed={speed} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.15}
          distort={distort}
          speed={1.5}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
}

function GradientRing({
  position,
  color,
  rotationSpeed,
}: {
  position: [number, number, number];
  color: string;
  rotationSpeed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * rotationSpeed;
    meshRef.current.rotation.z = state.clock.elapsedTime * rotationSpeed * 0.5;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <torusGeometry args={[1.5, 0.02, 16, 100]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#818cf8" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#a78bfa" />

      <FloatingParticles />

      <GlowingSphere
        position={[-4, 2, -5]}
        color="#818cf8"
        speed={0.4}
        distort={0.4}
        scale={2}
      />
      <GlowingSphere
        position={[4, -1, -3]}
        color="#a78bfa"
        speed={0.3}
        distort={0.3}
        scale={1.5}
      />
      <GlowingSphere
        position={[0, 3, -8]}
        color="#6366f1"
        speed={0.2}
        distort={0.5}
        scale={3}
      />
      <GlowingSphere
        position={[-3, -3, -6]}
        color="#c084fc"
        speed={0.35}
        distort={0.35}
        scale={1.8}
      />

      <GradientRing
        position={[3, 2, -7]}
        color="#818cf8"
        rotationSpeed={0.15}
      />
      <GradientRing
        position={[-2, -2, -4]}
        color="#a78bfa"
        rotationSpeed={0.1}
      />
    </>
  );
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
