import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VisualizationOptions, StyleOptions } from '@/types/geometry';

interface AutoRotatingGroupProps {
  options: VisualizationOptions;
  style: StyleOptions;
  children: React.ReactNode;
}

export default function AutoRotatingGroup({ options, style, children }: AutoRotatingGroupProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current && options.autoRotate) {
      groupRef.current.rotation.y += style.rotationSpeed * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
}

export { AutoRotatingGroup };