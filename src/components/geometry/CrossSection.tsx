import * as THREE from 'three';
import { GeometryParams, VisualizationOptions } from '@/types/geometry';

interface CrossSectionProps {
  params: GeometryParams;
  showCrossSection: boolean;
  sectionHeight: number;
  options?: VisualizationOptions;
}

export function CrossSection({ params, showCrossSection, sectionHeight, options }: CrossSectionProps) {
  if (!showCrossSection) return null;
  // Seção transversal permanece visível independente da ferramenta ativa
  // Só some se explicitamente desativada via showCrossSection

  let maxHeight = 4;
  
  switch (params.type) {
    case 'sphere':
      maxHeight = (params.radius || 2) * 2;
      break;
    case 'cube':
    case 'tetrahedron':
      maxHeight = params.sideLength || 2;
      break;
    default:
      maxHeight = params.height || 4;
  }
  
  // CORREÇÃO: seção transversal deve variar de 0 até a altura total
  const yPosition = sectionHeight * maxHeight;

  return (
    <group>
      {/* Cross section plane */}
      <CrossSectionPlane params={params} yPosition={yPosition} />
      {/* Section outline */}
      <CrossSectionOutline params={params} yPosition={yPosition} />
    </group>
  );
}

function CrossSectionPlane({ params, yPosition }: { params: GeometryParams; yPosition: number }) {
  let geometry: THREE.BufferGeometry;
  let planeSize = 6; // Tamanho maior para o plano
  
  switch (params.type) {
    case 'pyramid':
    case 'prism':
      const { baseEdgeLength = 2, numSides = 5 } = params;
      const r = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
      planeSize = r * 3;
      break;
    case 'cylinder':
      const cylinderRadius = params.radius || 2;
      planeSize = cylinderRadius * 3;
      break;
    case 'cone':
      const coneRadius = params.radius || 2;
      planeSize = coneRadius * 3;
      break;
    case 'cube':
    case 'tetrahedron':
      const sideLength = params.sideLength || 2;
      planeSize = sideLength * 2;
      break;
    case 'sphere':
      const sphereRadius = params.radius || 2;
      planeSize = sphereRadius * 3;
      break;
  }

  // Criar plano grande similar ao estilo da seção meridiana
  geometry = new THREE.PlaneGeometry(planeSize, planeSize);

  return (
    <mesh geometry={geometry} position={[0, yPosition, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <meshBasicMaterial 
        color="#ffff00" 
        transparent 
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function CrossSectionOutline({ params, yPosition }: { params: GeometryParams; yPosition: number }) {
  let outlineGeometry: THREE.BufferGeometry;
  let planeSize = 6;
  
  switch (params.type) {
    case 'pyramid':
    case 'prism':
      const { baseEdgeLength = 2, numSides = 5 } = params;
      const r = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
      planeSize = r * 3;
      break;
    case 'cylinder':
      const cylinderRadius = params.radius || 2;
      planeSize = cylinderRadius * 3;
      break;
    case 'cone':
      const coneRadius = params.radius || 2;
      planeSize = coneRadius * 3;
      break;
    case 'cube':
    case 'tetrahedron':
      const sideLength = params.sideLength || 2;
      planeSize = sideLength * 2;
      break;
    case 'sphere':
      const sphereRadius = params.radius || 2;
      planeSize = sphereRadius * 3;
      break;
  }

  // Criar outline do plano como um quadrado
  const halfSize = planeSize / 2;
  const points = [
    new THREE.Vector3(-halfSize, 0, -halfSize),
    new THREE.Vector3(halfSize, 0, -halfSize),
    new THREE.Vector3(halfSize, 0, halfSize),
    new THREE.Vector3(-halfSize, 0, halfSize),
    new THREE.Vector3(-halfSize, 0, -halfSize)
  ];
  
  outlineGeometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <lineLoop geometry={outlineGeometry} position={[0, yPosition, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <lineBasicMaterial color="#ffff00" linewidth={2} />
    </lineLoop>
  );
}