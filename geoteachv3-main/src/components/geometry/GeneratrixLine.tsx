import * as THREE from 'three';
import { GeometryParams } from '@/types/geometry';

interface GeneratrixLineProps {
  params: GeometryParams;
}

export function GeneratrixLine({ params }: GeneratrixLineProps) {
  const { height = 4, radius = 2 } = params;
  
  if (params.type !== 'cone') return null;

  // Ápice do cone
  const apex = new THREE.Vector3(0, height + height / 2, 0);
  
  // Ponto na borda da base do cone
  const basePoint = new THREE.Vector3(radius, height / 2, 0);
  
  const points = [apex, basePoint];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineDashedMaterial 
          color="#00ffff" 
          dashSize={0.15} 
          gapSize={0.08}
        />
      </lineSegments>
      {/* Marcação no ponto da base */}
      <mesh position={basePoint}>
        <sphereGeometry args={[0.04]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
    </group>
  );
}