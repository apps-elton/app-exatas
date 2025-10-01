import * as THREE from 'three';
import { GeometryParams } from '@/types/geometry';

interface TetrahedronRadiiProps {
  params: GeometryParams;
  showInscribedRadius: boolean;
  showCircumscribedRadius: boolean;
  inscribedRadiusColor?: string;
  circumscribedRadiusColor?: string;
  inscribedRadiusThickness?: number;
  circumscribedRadiusThickness?: number;
}

export function TetrahedronRadii({ 
  params, 
  showInscribedRadius, 
  showCircumscribedRadius,
  inscribedRadiusColor = '#00ff00',
  circumscribedRadiusColor = '#ff0066',
  inscribedRadiusThickness = 1.0,
  circumscribedRadiusThickness = 1.0
}: TetrahedronRadiiProps) {
  if (params.type !== 'tetrahedron') return null;

  const { sideLength = 2 } = params;
  const a = sideLength;

  // Altura do tetraedro regular
  const height = a * Math.sqrt(2/3);
  
  // Raio inscrito do tetraedro regular (apótema da base triangular)
  const inscribedRadius = a / (2 * Math.sqrt(3));
  
  // Raio circunscrito do tetraedro regular (do centro até um vértice)
  const circumscribedRadius = a * Math.sqrt(6) / 4;
  
  // O centro do tetraedro está a 1/4 da altura a partir da base
  const centerY = height / 4;

  // Vértices da base triangular equilátera
  const circumRadius = a / Math.sqrt(3);
  const vertex1 = new THREE.Vector3(circumRadius, 0, 0);
  const vertex2 = new THREE.Vector3(-circumRadius/2, 0, circumRadius * Math.sqrt(3)/2);
  const vertex3 = new THREE.Vector3(-circumRadius/2, 0, -circumRadius * Math.sqrt(3)/2);

  return (
    <group>
      {/* Raio Inscrito - apótema da base (do centro do triângulo até o ponto médio de uma aresta) */}
      {showInscribedRadius && (
        <TetrahedronInscribedRadius 
          inscribedRadius={inscribedRadius}
          centerY={centerY}
          color={inscribedRadiusColor}
          thickness={inscribedRadiusThickness}
        />
      )}

      {/* Raio Circunscrito - do centro do tetraedro até um vértice da base */}
      {showCircumscribedRadius && (
        <TetrahedronCircumscribedRadius 
          circumscribedRadius={circumscribedRadius}
          centerY={centerY}
          vertex={vertex1}
          color={circumscribedRadiusColor}
          thickness={circumscribedRadiusThickness}
        />
      )}
    </group>
  );
}

function TetrahedronInscribedRadius({ 
  inscribedRadius, 
  centerY, 
  color, 
  thickness 
}: { 
  inscribedRadius: number; 
  centerY: number; 
  color: string; 
  thickness: number; 
}) {
  // O raio inscrito é o apótema da base - vai do centro do triângulo da base até o ponto médio de uma aresta
  // Centro da base está em (0, 0, 0)
  // Ponto médio de uma aresta da base está em (inscribedRadius, 0, 0)
  const points = [
    new THREE.Vector3(0, 0, 0), // Centro da base
    new THREE.Vector3(inscribedRadius, 0, 0) // Ponto médio de uma aresta da base
  ];
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial 
        color={color} 
        linewidth={thickness}
      />
    </lineSegments>
  );
}

function TetrahedronCircumscribedRadius({ 
  circumscribedRadius, 
  centerY, 
  vertex,
  color, 
  thickness 
}: { 
  circumscribedRadius: number; 
  centerY: number; 
  vertex: THREE.Vector3;
  color: string; 
  thickness: number; 
}) {
  // O raio circunscrito vai do centro do tetraedro até um vértice da base
  const points = [
    new THREE.Vector3(0, centerY, 0), // Centro do tetraedro
    vertex // Vértice da base
  ];
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial 
        color={color} 
        linewidth={thickness}
      />
    </lineSegments>
  );
}