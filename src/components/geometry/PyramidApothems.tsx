import * as THREE from 'three';
import { GeometryParams } from '@/types/geometry';
import { TetrahedronApothems } from './TetrahedronApothems';

interface PyramidApothemsProps {
  params: GeometryParams;
  showBaseApothem: boolean;
  showLateralApothem: boolean;
}

export function PyramidApothems({ params, showBaseApothem, showLateralApothem }: PyramidApothemsProps) {
  const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
  
  if (params.type !== 'pyramid' && params.type !== 'tetrahedron') return null;

  if (params.type === 'tetrahedron') {
    // Usar componente específico para tetraedro
    return <TetrahedronApothems params={params} showBaseApothem={showBaseApothem} />;
  }

  return (
    <group>
      {/* Base Apothem - linha do centro até o meio de uma aresta da base */}
      {showBaseApothem && (
        <BaseApothemLine params={params} />
      )}

      {/* Apótema da Pirâmide - linha do ápice até o meio da aresta da base */}
      {showLateralApothem && (
        <LateralApothemLine params={params} />
      )}
    </group>
  );
}

function BaseApothemLine({ params }: { params: GeometryParams }) {
  const { baseEdgeLength = 2, numSides = 5 } = params;
  const circumscribedRadius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
  const apothem = baseEdgeLength / (2 * Math.tan(Math.PI / numSides));
  
  // Calcular o ponto no meio da primeira aresta da base
  const firstVertexAngle = 0;
  const secondVertexAngle = 2 * Math.PI / numSides;
  
  const firstVertex = new THREE.Vector3(
    circumscribedRadius * Math.cos(firstVertexAngle), 
    0, 
    circumscribedRadius * Math.sin(firstVertexAngle)
  );
  const secondVertex = new THREE.Vector3(
    circumscribedRadius * Math.cos(secondVertexAngle), 
    0, 
    circumscribedRadius * Math.sin(secondVertexAngle)
  );
  
  // Ponto médio da aresta
  const edgeMidpoint = new THREE.Vector3().lerpVectors(firstVertex, secondVertex, 0.5);
  
  // Apótema da base: linha do centro perpendicular à aresta
  const centerToMidpoint = edgeMidpoint.clone().normalize().multiplyScalar(apothem);
  
  // Linha do centro da base até o ponto do apótema (perpendicular à aresta)
  const points = [
    new THREE.Vector3(0, 0, 0),
    centerToMidpoint
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

function LateralApothemLine({ params }: { params: GeometryParams }) {
  const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
  const circumscribedRadius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));

  // Ápice da pirâmide
  const apex = new THREE.Vector3(0, height, 0);

  // Calcular o meio da primeira aresta da base corretamente
  // Primeiro vértice da base
  const vertex1 = new THREE.Vector3(
    circumscribedRadius * Math.cos(0), 
    0, 
    circumscribedRadius * Math.sin(0)
  );
  
  // Segundo vértice da base (próximo vértice)
  const vertex2 = new THREE.Vector3(
    circumscribedRadius * Math.cos(2 * Math.PI / numSides), 
    0, 
    circumscribedRadius * Math.sin(2 * Math.PI / numSides)
  );
  
  // Ponto médio da aresta entre vertex1 e vertex2
  const edgeMidpoint = new THREE.Vector3().lerpVectors(vertex1, vertex2, 0.5);

  // O apótema da pirâmide: do ápice ao meio da aresta da base
  const points = [apex, edgeMidpoint];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineDashedMaterial 
          color="#ff0000" 
          dashSize={0.2} 
          gapSize={0.1}
        />
      </lineSegments>
      {/* Marcação no ponto médio da aresta */}
      <mesh position={edgeMidpoint}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
    </group>
  );
}