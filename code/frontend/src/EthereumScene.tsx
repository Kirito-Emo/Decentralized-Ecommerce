// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
// EthereumScene.tsx - nodo toroidale wireframe in stile cyberpunk

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function Cyberform() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.x = t * 0.1;
      ref.current.rotation.y = t * 0.25;
      ref.current.rotation.z = t * 0.1;
    }
  });

  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[1.3, 0.45, 50, 15, 1, 3]} />
      <meshBasicMaterial color="#ea00d9" wireframe />
    </mesh>
  );
}

export default function EthereumScene() {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <Cyberform />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}