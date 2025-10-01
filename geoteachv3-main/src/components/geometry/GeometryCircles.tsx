import * as THREE from 'three';
import { GeometryParams, StyleOptions } from '@/types/geometry';

interface GeometryCirclesProps {
  params: GeometryParams;
  showInscribedCircle: boolean;
  showCircumscribedCircle: boolean;
  style?: StyleOptions;
}

export function GeometryCircles({ params, showInscribedCircle, showCircumscribedCircle, style }: GeometryCirclesProps) {
  if (!['pyramid', 'prism', 'cube', 'tetrahedron'].includes(params.type)) return null;

  return (
    <group>
      {showInscribedCircle && (
        <InscribedCircle params={params} style={style} />
      )}
      {showCircumscribedCircle && (
        <CircumscribedCircle params={params} style={style} />
      )}
    </group>
  );
}

function InscribedCircle({ params, style }: { params: GeometryParams; style?: StyleOptions }) {
  let radius: number;
  
  if (params.type === 'cube') {
    const sideLength = params.sideLength || 2;
    // Para um cubo, o círculo inscrito na base é o maior círculo que cabe dentro do quadrado
    radius = sideLength / 2;
  } else if (params.type === 'tetrahedron') {
    const { sideLength = 2 } = params;
    // Para tetraedro: raio inscrito = apótema da base triangular
    const apothem = sideLength / (2 * Math.sqrt(3));
    radius = apothem;
  } else {
    const { baseEdgeLength = 2, numSides = 5 } = params;
    // Raio inscrito = apótema da base (distância do centro até o meio de uma aresta)
    radius = baseEdgeLength / (2 * Math.tan(Math.PI / numSides));
  }

  const geometry = new THREE.RingGeometry(Math.max(radius - (style?.inscribedCircleThickness || 1) * 0.02, 0.02), radius + (style?.inscribedCircleThickness || 1) * 0.02, 64);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <meshBasicMaterial 
        color={style?.inscribedCircleColor || "#ff6600"} 
        transparent 
        opacity={0.8} 
        side={THREE.DoubleSide} 
      />
    </mesh>
  );
}

function CircumscribedCircle({ params, style }: { params: GeometryParams; style?: StyleOptions }) {
  let radius: number;
  
  if (params.type === 'cube') {
    const sideLength = params.sideLength || 2;
    // Para um cubo, o círculo circunscrito na base é o círculo que passa pelos vértices do quadrado
    radius = (sideLength * Math.sqrt(2)) / 2;
  } else if (params.type === 'tetrahedron') {
    const { sideLength = 2 } = params;
    // Para tetraedro: raio circunscrito da base triangular
    const circumscribedRadius = sideLength / (2 * Math.sin(Math.PI / 3)); // Para triângulo equilátero
    radius = circumscribedRadius;
  } else {
    const { baseEdgeLength = 2, numSides = 5 } = params;
    // Raio circunscrito = raio do círculo que passa pelos vértices da base
    radius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
  }

  const geometry = new THREE.RingGeometry(Math.max(radius - (style?.circumscribedCircleThickness || 1) * 0.02, 0.02), radius + (style?.circumscribedCircleThickness || 1) * 0.02, 64);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <meshBasicMaterial 
        color={style?.circumscribedCircleColor || "#ff0066"} 
        transparent 
        opacity={0.8} 
        side={THREE.DoubleSide} 
      />
    </mesh>
  );
}