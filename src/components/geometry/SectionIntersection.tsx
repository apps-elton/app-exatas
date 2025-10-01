import * as THREE from 'three';
import { GeometryParams, StyleOptions } from '@/types/geometry';

interface SectionIntersectionProps {
  params: GeometryParams;
  showMeridianSection: boolean;
  showCrossSection: boolean;
  crossSectionHeight: number;
  meridianAngle?: number;
  style?: StyleOptions;
}

export function SectionIntersection({ 
  params, 
  showMeridianSection, 
  showCrossSection, 
  crossSectionHeight,
  meridianAngle = 0,
  style 
}: SectionIntersectionProps) {
  if (!showMeridianSection || !showCrossSection) return null;

  const height = params.height || params.sideLength || 4;
  const radius = params.radius || 2;
  const sideLength = params.sideLength || 2;

  // Calcular a posição Y da seção transversal
  let maxHeight = height;
  if (params.type === 'sphere') {
    maxHeight = radius * 2;
  } else if (params.type === 'cube') {
    maxHeight = sideLength;
  }
  
  const yPosition = crossSectionHeight * maxHeight;

  // Criar linha de interseção das duas seções
  let intersectionPoints: THREE.Vector3[] = [];
  
  if (params.type === 'cylinder') {
    // Para cilindro, a interseção é uma linha horizontal no plano meridiano
    intersectionPoints = [
      new THREE.Vector3(-radius, yPosition, 0),
      new THREE.Vector3(radius, yPosition, 0)
    ];
  } else if (params.type === 'cone') {
    // Para cone, calcular o raio na altura da seção
    const coneRadius = radius * (1 - yPosition / height);
    intersectionPoints = [
      new THREE.Vector3(-coneRadius, yPosition, 0),
      new THREE.Vector3(coneRadius, yPosition, 0)
    ];
  } else if (params.type === 'cube') {
    // Para cubo, linha horizontal
    const half = sideLength / 2;
    intersectionPoints = [
      new THREE.Vector3(-half, yPosition, 0),
      new THREE.Vector3(half, yPosition, 0)
    ];
  }

  if (intersectionPoints.length === 0) return null;

  const geometry = new THREE.BufferGeometry().setFromPoints(intersectionPoints);

  return (
    <group rotation={[0, meridianAngle, 0]}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial 
          color="#ff0000" 
          linewidth={3}
        />
      </lineSegments>
      {/* Pontos de destaque nas extremidades */}
      {intersectionPoints.map((point, index) => (
        <mesh key={index} position={[point.x, point.y, point.z]}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      ))}
    </group>
  );
}