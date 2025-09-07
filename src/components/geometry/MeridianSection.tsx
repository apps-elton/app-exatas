import * as THREE from 'three';
import { GeometryParams, StyleOptions } from '@/types/geometry';

// Função auxiliar para calcular vértices do prisma
function getPrismVertices(numSides: number, radius: number, height: number): THREE.Vector3[] {
  const vertices: THREE.Vector3[] = [];
  
  // Vértices da base inferior
  for (let i = 0; i < numSides; i++) {
    const angle = (i * 2 * Math.PI) / numSides;
    vertices.push(new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle)));
  }
  
  // Vértices da base superior
  for (let i = 0; i < numSides; i++) {
    const angle = (i * 2 * Math.PI) / numSides;
    vertices.push(new THREE.Vector3(radius * Math.cos(angle), height, radius * Math.sin(angle)));
  }
  
  return vertices;
}

interface MeridianSectionProps {
  params: GeometryParams;
  showMeridianSection: boolean;
  sectionAngle?: number;
  sectionPercentage?: number; // Controle de 0 a 100% similar à seção transversal
  style?: StyleOptions;
  selectedVertices?: number[];
}

export function MeridianSection({ 
  params, 
  showMeridianSection, 
  sectionAngle = 0, 
  sectionPercentage = 0.5, // Padrão 50%
  style, 
  selectedVertices = [] 
}: MeridianSectionProps) {
  if (!showMeridianSection || !['cylinder', 'cone', 'cube', 'prism', 'tetrahedron', 'pyramid', 'sphere'].includes(params.type)) return null;

  const height = params.height || 4;
  const radius = params.radius || 2;

  return (
    <group>
      {/* Meridian section plane */}
      <MeridianSectionPlane 
        params={params} 
        angle={sectionAngle} 
        percentage={sectionPercentage}
        style={style} 
        selectedVertices={selectedVertices} 
      />
      {/* Section outline - only show if no custom vertices selected for prism */}
      {!(params.type === 'prism' && selectedVertices.length === 2) && (
        <MeridianSectionOutline 
          params={params} 
          angle={sectionAngle} 
          percentage={sectionPercentage}
          style={style} 
          selectedVertices={[]} 
        />
      )}
      {/* Custom section for selected vertices in prism */}
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
  
  // Calcular posição baseada na porcentagem (0 a 1)
  let maxDimension = height;
  switch (params.type) {
    case 'cube':
    case 'tetrahedron':
      maxDimension = params.type === 'tetrahedron' ? sideLength * Math.sqrt(2/3) : sideLength;
      break;
    default:
      maxDimension = height;
  }
  
  // Create a large plane that cuts through the geometry meridionally
  let geometry;
  let position: [number, number, number] = [0, percentage * maxDimension, 0];
  let planeSize = 10; // Tamanho maior para parecer que corta através da geometria
  
  if (params.type === 'cylinder') {
    geometry = new THREE.PlaneGeometry(planeSize, height + 2);
  } else if (params.type === 'cone') {
    geometry = new THREE.PlaneGeometry(planeSize, height + 2);  
  } else if (params.type === 'pyramid') {
    geometry = new THREE.PlaneGeometry(planeSize, height + 2);
  } else if (params.type === 'cube') {
    geometry = new THREE.PlaneGeometry(planeSize, sideLength + 2);
  } else if (params.type === 'tetrahedron') {
    const tetraHeight = sideLength * Math.sqrt(2/3);
    geometry = new THREE.PlaneGeometry(planeSize, tetraHeight + 2);
  } else if (params.type === 'prism') {
    const height = params.height || 4;
    geometry = new THREE.PlaneGeometry(planeSize, height + 2);
  } else if (params.type === 'sphere') {
    // Para esfera, criar um plano que passa pelo centro
    const sphereRadius = params.radius || 2;
    geometry = new THREE.PlaneGeometry(sphereRadius * 2.5, sphereRadius * 2.5);
    position = [0, sphereRadius, 0]; // Centro da esfera
  }
  
  // Para prismas com vértices selecionados, calcular plano passando pelos vértices
  if (params.type === 'prism' && selectedVertices.length === 2) {
    const { baseEdgeLength = 2, numSides = 5 } = params;
    const circumscribedRadius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
    const vertices = getPrismVertices(numSides, circumscribedRadius, height);
    const vertex1 = vertices[selectedVertices[0]];
    const vertex2 = vertices[selectedVertices[1]];
    
    // Calcular ponto médio entre os dois vértices
    const midPoint = new THREE.Vector3(
      (vertex1.x + vertex2.x) / 2,
      0,
      (vertex1.z + vertex2.z) / 2
    );
    
    // Calcular ângulo do plano que passa pelos dois vértices
    // O plano deve ser perpendicular ao solo e passar pelos dois vértices selecionados
    angle = Math.atan2(midPoint.x, midPoint.z);
    
    // Ajustar posição do plano para passar pelos vértices selecionados
    position = [midPoint.x, percentage * height, midPoint.z];
  }

  return (
    <mesh 
      geometry={geometry} 
      position={position} 
      rotation={[0, angle, 0]}
    >
      <meshBasicMaterial 
        color={style?.meridianSectionColor || style?.heightLineColor || "#ff6600"} 
        transparent 
        opacity={0.2}
        side={THREE.DoubleSide}
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
  
  // Create outline of the meridian section
  let points;
  
  if (params.type === 'cylinder') {
    // Rectangle for cylinder
    points = [
      new THREE.Vector3(-radius, 0, 0),
      new THREE.Vector3(radius, 0, 0),
      new THREE.Vector3(radius, height, 0),
      new THREE.Vector3(-radius, height, 0),
      new THREE.Vector3(-radius, 0, 0)
    ];
  } else if (params.type === 'cone') {
    // Triangle for cone
    points = [
      new THREE.Vector3(-radius, 0, 0),
      new THREE.Vector3(radius, 0, 0),
      new THREE.Vector3(0, height, 0),
      new THREE.Vector3(-radius, 0, 0)
    ];
  } else if (params.type === 'pyramid') {
    // Pirâmide: seção meridiana triangular similar ao cone
    const { baseEdgeLength = 2, numSides = 5 } = params;
    const baseRadius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
    points = [
      new THREE.Vector3(-baseRadius, 0, 0),
      new THREE.Vector3(baseRadius, 0, 0),
      new THREE.Vector3(0, height, 0),
      new THREE.Vector3(-baseRadius, 0, 0)
    ];
  } else if (params.type === 'cube') {
    // Square for cube
    const half = sideLength / 2;
    points = [
      new THREE.Vector3(-half, 0, 0),
      new THREE.Vector3(half, 0, 0),
      new THREE.Vector3(half, sideLength, 0),
      new THREE.Vector3(-half, sideLength, 0),
      new THREE.Vector3(-half, 0, 0)
    ];
  } else if (params.type === 'tetrahedron') {
    // Seção meridiana do tetraedro: triângulo
    const tetraHeight = sideLength * Math.sqrt(2/3);
    const r = sideLength / Math.sqrt(3); // Raio da base triangular
    points = [
      new THREE.Vector3(-r/2, 0, 0),
      new THREE.Vector3(r/2, 0, 0),
      new THREE.Vector3(0, tetraHeight, 0),
      new THREE.Vector3(-r/2, 0, 0)
    ];
  } else if (params.type === 'sphere') {
    // Círculo para esfera (seção meridiana é um círculo máximo)
    // A seção meridiana de uma esfera é um círculo que passa pelo centro
    // Similar aos meridianos terrestres em um globo
    const sphereRadius = radius;
    const segments = 64; // Alta resolução para suavidade
    points = [];
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      const x = sphereRadius * Math.cos(angle);
      const y = sphereRadius * Math.sin(angle) + sphereRadius; // Ajustar para centro da esfera
      points.push(new THREE.Vector3(x, y, 0));
    }
  } else if (params.type === 'prism') {
    // Prisma: seção meridiana baseada nos vértices selecionados
    const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
    const circumscribedRadius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
    
    if (selectedVertices.length === 2) {
      // Calcular posições dos vértices selecionados
      const vertices = getPrismVertices(numSides, circumscribedRadius, height);
      const vertex1 = vertices[selectedVertices[0]];
      const vertex2 = vertices[selectedVertices[1]];
      
      // Criar seção baseada nos dois vértices selecionados
      const midX = Math.max(Math.abs(vertex1.x), Math.abs(vertex2.x));
      points = [
        new THREE.Vector3(-midX, 0, 0),
        new THREE.Vector3(midX, 0, 0),
        new THREE.Vector3(midX, height, 0),
        new THREE.Vector3(-midX, height, 0),
        new THREE.Vector3(-midX, 0, 0)
      ];
    } else {
      // Seção padrão passando por um vértice
      const vertexX = circumscribedRadius;
      points = [
        new THREE.Vector3(-vertexX, 0, 0),
        new THREE.Vector3(vertexX, 0, 0),
        new THREE.Vector3(vertexX, height, 0),
        new THREE.Vector3(-vertexX, height, 0),
        new THREE.Vector3(-vertexX, 0, 0)
      ];
    }
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <lineLoop geometry={geometry} rotation={[0, angle, 0]}>
      <lineBasicMaterial color={style?.meridianSectionColor || style?.heightLineColor || "#ff6600"} linewidth={2} />
    </lineLoop>
  );
}

// Seção meridiana customizada para vértices selecionados em prismas
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
  const circumscribedRadius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
  const vertices = getPrismVertices(numSides, circumscribedRadius, height);
  
  const vertex1 = vertices[selectedVertices[0]];
  const vertex2 = vertices[selectedVertices[1]];
  
  // Criar plano passando pelos dois vértices selecionados
  const midPoint = new THREE.Vector3(
    (vertex1.x + vertex2.x) / 2,
    percentage * height, // Usar porcentagem para altura
    (vertex1.z + vertex2.z) / 2
  );
  
  // Calcular ângulo do plano
  const direction = new THREE.Vector3(
    vertex2.x - vertex1.x,
    0,
    vertex2.z - vertex1.z
  ).normalize();
  const angle = Math.atan2(direction.x, direction.z);
  
  // Plano de corte
  const planeGeometry = new THREE.PlaneGeometry(10, height + 2);
  
  // Contorno da seção
  const maxX = Math.max(Math.abs(vertex1.x), Math.abs(vertex2.x));
  const points = [
    new THREE.Vector3(-maxX, 0, 0),
    new THREE.Vector3(maxX, 0, 0),
    new THREE.Vector3(maxX, height, 0),
    new THREE.Vector3(-maxX, height, 0),
    new THREE.Vector3(-maxX, 0, 0)
  ];
  const outlineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <group>
      {/* Plano de corte */}
      <mesh 
        geometry={planeGeometry} 
        position={[0, percentage * height, 0]} 
        rotation={[0, angle, 0]}
      >
        <meshBasicMaterial 
          color={style?.meridianSectionColor || "#ff6600"} 
          transparent 
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Contorno da seção */}
      <lineLoop geometry={outlineGeometry} rotation={[0, angle, 0]}>
        <lineBasicMaterial color={style?.meridianSectionColor || "#ff6600"} linewidth={3} />
      </lineLoop>
    </group>
  );
}