import * as THREE from 'three';
import { GeometryParams, StyleOptions } from '@/types/geometry';

interface MeridianSectionProps {
  params: GeometryParams;
  showMeridianSection: boolean;
  sectionAngle?: number;
  sectionPercentage?: number;
  style?: StyleOptions;
  selectedVertices?: number[];
}

// Função auxiliar para calcular vértices do prisma
function getPrismVertices(numSides: number, radius: number, height: number): THREE.Vector3[] {
  const vertices: THREE.Vector3[] = [];
  
  // Base inferior
  for (let i = 0; i < numSides; i++) {
    const angle = (i * 2 * Math.PI) / numSides;
    vertices.push(new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle)));
  }
  
  // Base superior
  for (let i = 0; i < numSides; i++) {
    const angle = (i * 2 * Math.PI) / numSides;
    vertices.push(new THREE.Vector3(radius * Math.cos(angle), height, radius * Math.sin(angle)));
  }
  
  return vertices;
}

export function MeridianSection({ 
  params, 
  showMeridianSection, 
  sectionAngle = 0, 
  sectionPercentage = 0.5,
  style, 
  selectedVertices = [] 
}: MeridianSectionProps) {
  // Validar se deve mostrar a seção
  if (!showMeridianSection) return null;
  
  // Lista expandida de geometrias suportadas
  const supportedGeometries = [
    'cylinder', 'cone', 'cube', 'prism', 'tetrahedron', 
    'pyramid', 'sphere', 'octahedron'
  ];
  
  if (!supportedGeometries.includes(params.type)) return null;

  const height = params.height || 4;
  const radius = params.radius || 2;

  return (
    <group name="meridian-section-group">
      {/* Plano de seção meridiana */}
      <MeridianSectionPlane 
        params={params} 
        angle={sectionAngle} 
        percentage={sectionPercentage}
        style={style} 
        selectedVertices={selectedVertices} 
      />
      
      {/* Contorno da seção */}
      {!(params.type === 'prism' && selectedVertices.length === 2) && (
        <MeridianSectionOutline 
          params={params} 
          angle={sectionAngle} 
          percentage={sectionPercentage}
          style={style} 
          selectedVertices={[]} 
        />
      )}
      
      {/* Seção customizada para vértices selecionados */}
      {params.type === 'prism' && selectedVertices.length === 2 && (
        <CustomMeridianSection 
          params={params} 
          selectedVertices={selectedVertices} 
          percentage={sectionPercentage}
          style={style} 
        />
      )}
    </group>
  );
}

function MeridianSectionPlane({ 
  params, 
  angle, 
  percentage = 0.5,
  style, 
  selectedVertices = [] 
}: { 
  params: GeometryParams; 
  angle: number; 
  percentage?: number;
  style?: StyleOptions; 
  selectedVertices?: number[] 
}) {
  const height = params.height || 4;
  const radius = params.radius || 2;
  const sideLength = params.sideLength || 2;
  
  // Calcular dimensões baseadas no tipo de geometria
  let maxDimension = height;
  switch (params.type) {
    case 'cube':
      maxDimension = sideLength;
      break;
    case 'tetrahedron':
      maxDimension = sideLength * Math.sqrt(2/3);
      break;
    case 'octahedron':
      maxDimension = sideLength * Math.sqrt(2);
      break;
    default:
      maxDimension = height;
  }
  
  // Criar plano grande que corta através da geometria
  let geometry;
  let position: [number, number, number] = [0, percentage * maxDimension, 0];
  const planeSize = 12; // Tamanho aumentado para garantir visibilidade
  
  switch (params.type) {
    case 'cylinder':
      geometry = new THREE.PlaneGeometry(radius * 2.5, height * 1.2);
      position = [0, height / 2, 0];
      break;
    case 'cone':
      geometry = new THREE.PlaneGeometry(radius * 2.5, height * 1.2);
      position = [0, height / 2, 0];
      break;
    case 'pyramid':
      geometry = new THREE.PlaneGeometry(planeSize, height * 1.2);
      position = [0, height / 2, 0];
      break;
    case 'cube':
      geometry = new THREE.PlaneGeometry(sideLength * 1.5, sideLength * 1.5);
      position = [0, sideLength / 2, 0];
      break;
    case 'tetrahedron':
      const tetraHeight = sideLength * Math.sqrt(2/3);
      geometry = new THREE.PlaneGeometry(sideLength * 1.5, tetraHeight * 1.2);
      position = [0, tetraHeight / 2, 0];
      break;
    case 'octahedron':
      const octaHeight = sideLength * Math.sqrt(2);
      geometry = new THREE.PlaneGeometry(sideLength * 1.5, octaHeight * 1.2);
      position = [0, octaHeight / 2, 0];
      break;
    case 'prism':
      geometry = new THREE.PlaneGeometry(radius * 3, height * 1.2);
      position = [0, height / 2, 0];
      
      // Ajustar para vértices selecionados
      if (selectedVertices.length === 2) {
        const { baseEdgeLength = 2, numSides = 5 } = params;
        const circumRadius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
        const vertices = getPrismVertices(numSides, circumRadius, height);
        
        const vertex1 = vertices[selectedVertices[0]];
        const vertex2 = vertices[selectedVertices[1]];
        
        if (vertex1 && vertex2) {
          const midPoint = new THREE.Vector3(
            (vertex1.x + vertex2.x) / 2,
            height / 2,
            (vertex1.z + vertex2.z) / 2
          );
          
          angle = Math.atan2(vertex2.z - vertex1.z, vertex2.x - vertex1.x) + Math.PI / 2;
          position = [midPoint.x, midPoint.y, midPoint.z];
        }
      }
      break;
    case 'sphere':
      const sphereRadius = params.radius || 2;
      geometry = new THREE.CircleGeometry(sphereRadius * 1.1, 64);
      position = [0, sphereRadius, 0];
      break;
    default:
      geometry = new THREE.PlaneGeometry(planeSize, planeSize);
  }

  return (
    <mesh 
      geometry={geometry} 
      position={position} 
      rotation={[0, angle, 0]}
      renderOrder={1}
    >
      <meshBasicMaterial 
        color={style?.meridianSectionColor || "#ff6600"} 
        transparent 
        opacity={style?.meridianSectionOpacity || 0.5}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function MeridianSectionOutline({ 
  params, 
  angle, 
  percentage = 0.5,
  style, 
  selectedVertices = [] 
}: { 
  params: GeometryParams; 
  angle: number; 
  percentage?: number;
  style?: StyleOptions; 
  selectedVertices?: number[] 
}) {
  const height = params.height || 4;
  const radius = params.radius || 2;
  const sideLength = params.sideLength || 2;
  
  // Criar contorno da seção meridiana
  let points: THREE.Vector3[] = [];
  
  switch (params.type) {
    case 'cylinder':
      // Retângulo para cilindro
      points = [
        new THREE.Vector3(-radius, 0, 0),
        new THREE.Vector3(radius, 0, 0),
        new THREE.Vector3(radius, height, 0),
        new THREE.Vector3(-radius, height, 0),
        new THREE.Vector3(-radius, 0, 0)
      ];
      break;
      
    case 'cone':
      // Triângulo para cone
      points = [
        new THREE.Vector3(-radius, 0, 0),
        new THREE.Vector3(radius, 0, 0),
        new THREE.Vector3(0, height, 0),
        new THREE.Vector3(-radius, 0, 0)
      ];
      break;
      
    case 'pyramid':
      const { baseEdgeLength = 2, numSides = 5 } = params;
      const baseRadius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
      points = [
        new THREE.Vector3(-baseRadius, 0, 0),
        new THREE.Vector3(baseRadius, 0, 0),
        new THREE.Vector3(0, height, 0),
        new THREE.Vector3(-baseRadius, 0, 0)
      ];
      break;
      
    case 'cube':
      // Quadrado para cubo
      const half = sideLength / 2;
      points = [
        new THREE.Vector3(-half, 0, 0),
        new THREE.Vector3(half, 0, 0),
        new THREE.Vector3(half, sideLength, 0),
        new THREE.Vector3(-half, sideLength, 0),
        new THREE.Vector3(-half, 0, 0)
      ];
      break;
      
    case 'tetrahedron':
      const tetraHeight = sideLength * Math.sqrt(2/3);
      const r = sideLength / Math.sqrt(3);
      points = [
        new THREE.Vector3(-r/2, 0, 0),
        new THREE.Vector3(r/2, 0, 0),
        new THREE.Vector3(0, tetraHeight, 0),
        new THREE.Vector3(-r/2, 0, 0)
      ];
      break;
      
    case 'octahedron':
      // Losango para octaedro
      const octaScale = sideLength / Math.sqrt(2);
      points = [
        new THREE.Vector3(-octaScale, octaScale, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(octaScale, octaScale, 0),
        new THREE.Vector3(0, octaScale * 2, 0),
        new THREE.Vector3(-octaScale, octaScale, 0)
      ];
      break;
      
    case 'sphere':
      // Círculo para esfera
      const sphereRadius = radius;
      const segments = 64;
      points = [];
      
      for (let i = 0; i <= segments; i++) {
        const theta = (i * 2 * Math.PI) / segments;
        const x = sphereRadius * Math.cos(theta);
        const y = sphereRadius * Math.sin(theta) + sphereRadius;
        points.push(new THREE.Vector3(x, y, 0));
      }
      break;
      
    case 'prism':
      const { baseEdgeLength: prismEdge = 2, numSides: prismSides = 5 } = params;
      const circumRadius = prismEdge / (2 * Math.sin(Math.PI / prismSides));
      
      if (selectedVertices.length === 2) {
        const vertices = getPrismVertices(prismSides, circumRadius, height);
        const vertex1 = vertices[selectedVertices[0]];
        const vertex2 = vertices[selectedVertices[1]];
        
        if (vertex1 && vertex2) {
          const midX = Math.max(Math.abs(vertex1.x), Math.abs(vertex2.x));
          points = [
            new THREE.Vector3(-midX, 0, 0),
            new THREE.Vector3(midX, 0, 0),
            new THREE.Vector3(midX, height, 0),
            new THREE.Vector3(-midX, height, 0),
            new THREE.Vector3(-midX, 0, 0)
          ];
        }
      } else {
        // Seção padrão
        points = [
          new THREE.Vector3(-circumRadius, 0, 0),
          new THREE.Vector3(circumRadius, 0, 0),
          new THREE.Vector3(circumRadius, height, 0),
          new THREE.Vector3(-circumRadius, height, 0),
          new THREE.Vector3(-circumRadius, 0, 0)
        ];
      }
      break;
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <lineLoop 
      geometry={geometry} 
      rotation={[0, angle, 0]}
      renderOrder={2}
    >
      <lineBasicMaterial 
        color={style?.meridianSectionColor || "#ff6600"} 
        linewidth={3}
      />
    </lineLoop>
  );
}

// Seção meridiana customizada para vértices selecionados
function CustomMeridianSection({ 
  params, 
  selectedVertices, 
  percentage = 0.5,
  style 
}: { 
  params: GeometryParams; 
  selectedVertices: number[]; 
  percentage?: number;
  style?: StyleOptions; 
}) {
  if (params.type !== 'prism' || selectedVertices.length !== 2) return null;
  
  const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
  const circumRadius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
  const vertices = getPrismVertices(numSides, circumRadius, height);
  
  const vertex1 = vertices[selectedVertices[0]];
  const vertex2 = vertices[selectedVertices[1]];
  
  if (!vertex1 || !vertex2) return null;
  
  // Criar plano passando pelos dois vértices
  const midPoint = new THREE.Vector3(
    (vertex1.x + vertex2.x) / 2,
    height / 2,
    (vertex1.z + vertex2.z) / 2
  );
  
  // Calcular ângulo do plano
  const direction = new THREE.Vector3(
    vertex2.x - vertex1.x,
    0,
    vertex2.z - vertex1.z
  ).normalize();
  
  const angle = Math.atan2(direction.z, direction.x) + Math.PI / 2;
  
  // Geometria do plano
  const planeGeometry = new THREE.PlaneGeometry(12, height * 1.5);
  
  // Contorno da seção
  const maxX = Math.max(Math.abs(vertex1.x), Math.abs(vertex2.x)) * 1.1;
  const points = [
    new THREE.Vector3(-maxX, 0, 0),
    new THREE.Vector3(maxX, 0, 0),
    new THREE.Vector3(maxX, height, 0),
    new THREE.Vector3(-maxX, height, 0),
    new THREE.Vector3(-maxX, 0, 0)
  ];
  const outlineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <group name="custom-meridian-section">
      {/* Plano de corte */}
      <mesh 
        geometry={planeGeometry} 
        position={midPoint} 
        rotation={[0, angle, 0]}
        renderOrder={1}
      >
        <meshBasicMaterial 
          color={style?.meridianSectionColor || "#ff6600"} 
          transparent 
          opacity={style?.meridianSectionOpacity || 0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Contorno da seção */}
      <lineLoop 
        geometry={outlineGeometry} 
        position={midPoint}
        rotation={[0, angle, 0]}
        renderOrder={2}
      >
        <lineBasicMaterial 
          color={style?.meridianSectionColor || "#ff6600"} 
          linewidth={3}
        />
      </lineLoop>
      
      {/* Destacar vértices selecionados */}
      <mesh position={vertex1} renderOrder={3}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={vertex2} renderOrder={3}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

export default MeridianSection;