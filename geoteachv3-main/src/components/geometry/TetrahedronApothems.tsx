import * as THREE from 'three';
import { GeometryParams } from '@/types/geometry';

interface TetrahedronApothemsProps {
  params: GeometryParams;
  showBaseApothem: boolean;
}

export function TetrahedronApothems({ params, showBaseApothem }: TetrahedronApothemsProps) {
  if (params.type !== 'tetrahedron') return null;

  return (
    <group>
      {/* Base Apothem - apótema da base triangular */}
      {showBaseApothem && (
        <TetrahedronBaseApothem params={params} />
      )}
    </group>
  );
}

function TetrahedronBaseApothem({ params }: { params: GeometryParams }) {
  const { sideLength = 2 } = params;
  const a = sideLength;
  
  // Raio da circunferência circunscrita da base triangular equilátera
  const circumRadius = a / Math.sqrt(3);
  
  // Apótema da base triangular (raio da circunferência inscrita)  
  const apothem = a / (2 * Math.sqrt(3));
  
  // Vértices da base triangular equilátera
  const vertex1 = new THREE.Vector3(circumRadius, 0, 0);
  const vertex2 = new THREE.Vector3(-circumRadius/2, 0, circumRadius * Math.sqrt(3)/2); 
  
  // O apótema vai do centro da base até o ponto médio da primeira aresta
  const edgeMidpoint = new THREE.Vector3(
    (vertex1.x + vertex2.x) / 2,
    0,
    (vertex1.z + vertex2.z) / 2
  );
  
  // Apenas um segmento: do centro até o ponto médio da aresta
  const points = [
    new THREE.Vector3(0, 0, 0), // Centro da base
    edgeMidpoint // Ponto médio da aresta
  ];
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <lineSegments geometry={geometry}>
      <lineDashedMaterial 
        color="#00ffff" 
        dashSize={0.1} 
        gapSize={0.05}
      />
    </lineSegments>
  );
}
