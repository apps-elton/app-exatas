import * as THREE from 'three';
import { GeometryParams } from '@/types/geometry';

interface OctahedronApothemsProps {
  params: GeometryParams;
  showBaseApothem: boolean;
}

export function OctahedronApothems({ params, showBaseApothem }: OctahedronApothemsProps) {
  if (params.type !== 'octahedron') return null;

  return (
    <group>
      {/* Base Apothem - apótema da face quadrada na base */}
      {showBaseApothem && (
        <OctahedronBaseApothem params={params} />
      )}
    </group>
  );
}

function OctahedronBaseApothem({ params }: { params: GeometryParams }) {
  const { sideLength = 2 } = params;
  const a = sideLength;
  
  // Para octaedro regular, a distância do centro ao meio da aresta é a/2
  const apothem = a / (2 * Math.sqrt(2));
  
  // Vértices do octaedro no plano horizontal (consistentes com GeometryCanvas)
  const scaleFactor = a / Math.sqrt(2);
  const offset = scaleFactor;
  const vertex1 = new THREE.Vector3(scaleFactor, offset, 0);
  const vertex2 = new THREE.Vector3(-scaleFactor, offset, 0);
  
  // Ponto médio da aresta entre vertex1 e vertex2
  const edgeMidpoint = new THREE.Vector3(0, offset, 0);
  
  const points = [
    new THREE.Vector3(0, offset, 0), // Centro no nível da base
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