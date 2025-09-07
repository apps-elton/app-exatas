import * as THREE from 'three';
import { useMemo } from 'react';
import { GeometryParams, StyleOptions } from '@/types/geometry';

interface UnfoldingSystemProps {
  params: GeometryParams;
  showUnfolded: boolean;
  style?: StyleOptions;
}

export function UnfoldingSystem({ params, showUnfolded, style }: UnfoldingSystemProps) {
  if (!showUnfolded) return null;

  const faceColor = style?.faceColor || "#3b82f6";
  const edgeColor = style?.edgeColor || "#000000";
  const faceOpacity = style?.faceOpacity || 0.8;

  return (
    <>
      {/* Sólido 3D à esquerda */}
      <group position={[-3, 0, 0]} scale={[0.8, 0.8, 0.8]}>
        <SolidShape params={params} faceColor={faceColor} edgeColor={edgeColor} faceOpacity={faceOpacity} />
      </group>
      
      {/* Planificação à direita */}
      <group position={[3, 0, 0]} scale={[0.7, 0.7, 0.7]}>
        <UnfoldedShape params={params} faceColor={faceColor} edgeColor={edgeColor} faceOpacity={faceOpacity} />
      </group>
      
      {/* Plano de apoio para visualização */}
      <mesh position={[3, -0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial color="#f8f9fa" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

// Componente principal que escolhe a planificação correta
function UnfoldedShape({ params, faceColor, edgeColor, faceOpacity }: {
  params: GeometryParams;
  faceColor: string;
  edgeColor: string;
  faceOpacity: number;
}) {
  const unfolding = useMemo(() => {
    return calculateUnfolding(params);
  }, [params]);

  return (
    <group rotation={[-Math.PI/2, 0, 0]}>
      {unfolding.faces.map((face, index) => (
        <FaceComponent
          key={index}
          face={face}
          faceColor={faceColor}
          edgeColor={edgeColor}
          faceOpacity={faceOpacity}
        />
      ))}
    </group>
  );
}

// Interface para descrever uma face na planificação
interface UnfoldedFace {
  type: 'triangle' | 'rectangle' | 'circle' | 'sector' | 'polygon';
  position: [number, number, number];
  rotation: [number, number, number];
  dimensions: any;
  id: string;
}

interface UnfoldingResult {
  faces: UnfoldedFace[];
  totalWidth: number;
  totalHeight: number;
}

// Função principal que calcula a planificação para cada tipo de sólido
function calculateUnfolding(params: GeometryParams): UnfoldingResult {
  switch (params.type) {
    case 'cube':
      return calculateCubeUnfolding(params);
    case 'tetrahedron':
      return calculateTetrahedronUnfolding(params);
    case 'octahedron':
      return calculateOctahedronUnfolding(params);
    case 'dodecahedron':
      return calculateDodecahedronUnfolding(params);
    case 'pyramid':
      return calculatePyramidUnfolding(params);
    case 'prism':
      return calculatePrismUnfolding(params);
    case 'cylinder':
      return calculateCylinderUnfolding(params);
    case 'cone':
      return calculateConeUnfolding(params);
    default:
      return { faces: [], totalWidth: 0, totalHeight: 0 };
  }
}

// POLIEDROS

function calculateCubeUnfolding(params: GeometryParams): UnfoldingResult {
  const size = params.sideLength || 2;
  
  return {
    faces: [
      // Cruz tradicional do cubo
      { type: 'rectangle', position: [0, 0, 0], rotation: [0, 0, 0], dimensions: { width: size, height: size }, id: 'front' },
      { type: 'rectangle', position: [0, size, 0], rotation: [0, 0, 0], dimensions: { width: size, height: size }, id: 'top' },
      { type: 'rectangle', position: [0, -size, 0], rotation: [0, 0, 0], dimensions: { width: size, height: size }, id: 'bottom' },
      { type: 'rectangle', position: [-size, 0, 0], rotation: [0, 0, 0], dimensions: { width: size, height: size }, id: 'left' },
      { type: 'rectangle', position: [size, 0, 0], rotation: [0, 0, 0], dimensions: { width: size, height: size }, id: 'right' },
      { type: 'rectangle', position: [0, -2*size, 0], rotation: [0, 0, 0], dimensions: { width: size, height: size }, id: 'back' },
    ],
    totalWidth: 3 * size,
    totalHeight: 4 * size
  };
}

function calculateTetrahedronUnfolding(params: GeometryParams): UnfoldingResult {
  const a = params.sideLength || 2;
  const height = a * Math.sqrt(3) / 2; // Altura do triângulo equilátero
  
  return {
    faces: [
      // Base central
      { type: 'triangle', position: [0, 0, 0], rotation: [0, 0, 0], dimensions: { sideLength: a }, id: 'base' },
      // Três faces laterais ao redor da base
      { type: 'triangle', position: [0, height, 0], rotation: [0, 0, 0], dimensions: { sideLength: a }, id: 'face1' },
      { type: 'triangle', position: [-a*0.75, -height/2, 0], rotation: [0, 0, Math.PI/3], dimensions: { sideLength: a }, id: 'face2' },
      { type: 'triangle', position: [a*0.75, -height/2, 0], rotation: [0, 0, -Math.PI/3], dimensions: { sideLength: a }, id: 'face3' },
    ],
    totalWidth: 2 * a,
    totalHeight: 2 * height
  };
}

function calculateOctahedronUnfolding(params: GeometryParams): UnfoldingResult {
  const a = params.sideLength || 2;
  const height = a * Math.sqrt(3) / 2;
  
  return {
    faces: [
      // Faixa de 8 triângulos equiláteros
      { type: 'triangle', position: [0, 0, 0], rotation: [0, 0, 0], dimensions: { sideLength: a }, id: 'tri1' },
      { type: 'triangle', position: [a, 0, 0], rotation: [0, 0, Math.PI], dimensions: { sideLength: a }, id: 'tri2' },
      { type: 'triangle', position: [2*a, 0, 0], rotation: [0, 0, 0], dimensions: { sideLength: a }, id: 'tri3' },
      { type: 'triangle', position: [3*a, 0, 0], rotation: [0, 0, Math.PI], dimensions: { sideLength: a }, id: 'tri4' },
      { type: 'triangle', position: [4*a, 0, 0], rotation: [0, 0, 0], dimensions: { sideLength: a }, id: 'tri5' },
      { type: 'triangle', position: [5*a, 0, 0], rotation: [0, 0, Math.PI], dimensions: { sideLength: a }, id: 'tri6' },
      { type: 'triangle', position: [6*a, 0, 0], rotation: [0, 0, 0], dimensions: { sideLength: a }, id: 'tri7' },
      { type: 'triangle', position: [7*a, 0, 0], rotation: [0, 0, Math.PI], dimensions: { sideLength: a }, id: 'tri8' },
    ],
    totalWidth: 8 * a,
    totalHeight: height
  };
}

function calculateDodecahedronUnfolding(params: GeometryParams): UnfoldingResult {
  const a = params.sideLength || 1;
  const pentSize = a * 2; // Tamanho aproximado do pentágono
  
  // Planificação em formato de cruz com pentágonos
  return {
    faces: [
      // Pentágono central
      { type: 'polygon', position: [0, 0, 0], rotation: [0, 0, 0], dimensions: { sideLength: a, sides: 5 }, id: 'center' },
      // 5 pentágonos ao redor do central
      { type: 'polygon', position: [0, pentSize, 0], rotation: [0, 0, 0], dimensions: { sideLength: a, sides: 5 }, id: 'top' },
      { type: 'polygon', position: [pentSize, 0, 0], rotation: [0, 0, 0], dimensions: { sideLength: a, sides: 5 }, id: 'right' },
      { type: 'polygon', position: [0, -pentSize, 0], rotation: [0, 0, 0], dimensions: { sideLength: a, sides: 5 }, id: 'bottom' },
      { type: 'polygon', position: [-pentSize, 0, 0], rotation: [0, 0, 0], dimensions: { sideLength: a, sides: 5 }, id: 'left' },
      { type: 'polygon', position: [-pentSize, pentSize, 0], rotation: [0, 0, 0], dimensions: { sideLength: a, sides: 5 }, id: 'topleft' },
      // 6 pentágonos restantes dispostos estrategicamente
      { type: 'polygon', position: [pentSize, pentSize, 0], rotation: [0, 0, 0], dimensions: { sideLength: a, sides: 5 }, id: 'topright' },
      { type: 'polygon', position: [pentSize, -pentSize, 0], rotation: [0, 0, 0], dimensions: { sideLength: a, sides: 5 }, id: 'bottomright' },
      { type: 'polygon', position: [-pentSize, -pentSize, 0], rotation: [0, 0, 0], dimensions: { sideLength: a, sides: 5 }, id: 'bottomleft' },
      { type: 'polygon', position: [0, 2*pentSize, 0], rotation: [0, 0, 0], dimensions: { sideLength: a, sides: 5 }, id: 'far1' },
      { type: 'polygon', position: [2*pentSize, 0, 0], rotation: [0, 0, 0], dimensions: { sideLength: a, sides: 5 }, id: 'far2' },
      { type: 'polygon', position: [0, -2*pentSize, 0], rotation: [0, 0, 0], dimensions: { sideLength: a, sides: 5 }, id: 'far3' },
    ],
    totalWidth: 4 * pentSize,
    totalHeight: 4 * pentSize
  };
}

function calculatePyramidUnfolding(params: GeometryParams): UnfoldingResult {
  const baseEdgeLength = params.baseEdgeLength || 2;
  const height = params.height || 4;
  const numSides = params.numSides || 4;
  
  const apothem = baseEdgeLength / (2 * Math.tan(Math.PI / numSides));
  const slantHeight = Math.sqrt(height * height + apothem * apothem);
  const spacing = baseEdgeLength + 0.5;
  
  const faces: UnfoldedFace[] = [
    // Base poligonal no centro
    { type: 'polygon', position: [0, 0, 0], rotation: [0, 0, 0], dimensions: { sideLength: baseEdgeLength, sides: numSides }, id: 'base' }
  ];
  
  // Faces laterais triangulares ao redor da base
  for (let i = 0; i < numSides; i++) {
    const angle = (i / numSides) * Math.PI * 2;
    const x = spacing * Math.cos(angle);
    const z = spacing * Math.sin(angle);
    
    faces.push({
      type: 'triangle',
      position: [x, z, 0],
      rotation: [0, 0, angle + Math.PI/2],
      dimensions: { baseLength: baseEdgeLength, height: slantHeight },
      id: `face${i}`
    });
  }
  
  return {
    faces,
    totalWidth: 2 * spacing + baseEdgeLength,
    totalHeight: 2 * spacing + baseEdgeLength
  };
}

function calculatePrismUnfolding(params: GeometryParams): UnfoldingResult {
  const baseEdgeLength = params.baseEdgeLength || 2;
  const height = params.height || 4;
  const numSides = params.numSides || 5;
  
  const faces: UnfoldedFace[] = [
    // Base inferior
    { type: 'polygon', position: [0, -height/2 - 1, 0], rotation: [0, 0, 0], dimensions: { sideLength: baseEdgeLength, sides: numSides }, id: 'base' },
    // Base superior
    { type: 'polygon', position: [0, height/2 + 1, 0], rotation: [0, 0, 0], dimensions: { sideLength: baseEdgeLength, sides: numSides }, id: 'top' }
  ];
  
  // Faces laterais retangulares em faixa
  for (let i = 0; i < numSides; i++) {
    const x = i * baseEdgeLength - (numSides * baseEdgeLength) / 2 + baseEdgeLength/2;
    
    faces.push({
      type: 'rectangle',
      position: [x, 0, 0],
      rotation: [0, 0, 0],
      dimensions: { width: baseEdgeLength, height: height },
      id: `side${i}`
    });
  }
  
  return {
    faces,
    totalWidth: numSides * baseEdgeLength,
    totalHeight: height + 4
  };
}

// SÓLIDOS DE REVOLUÇÃO

function calculateCylinderUnfolding(params: GeometryParams): UnfoldingResult {
  const radius = params.radius || 2;
  const height = params.height || 4;
  const circumference = 2 * Math.PI * radius;
  
  return {
    faces: [
      // Superfície lateral (retângulo central)
      { type: 'rectangle', position: [0, 0, 0], rotation: [0, 0, 0], dimensions: { width: circumference, height: height }, id: 'lateral' },
      // Base inferior
      { type: 'circle', position: [0, -height/2 - radius - 0.5, 0], rotation: [0, 0, 0], dimensions: { radius: radius }, id: 'base' },
      // Base superior
      { type: 'circle', position: [0, height/2 + radius + 0.5, 0], rotation: [0, 0, 0], dimensions: { radius: radius }, id: 'top' },
    ],
    totalWidth: circumference,
    totalHeight: height + 2 * (radius + 0.5)
  };
}

function calculateConeUnfolding(params: GeometryParams): UnfoldingResult {
  const radius = params.radius || 2;
  const height = params.height || 4;
  const slantHeight = Math.sqrt(radius * radius + height * height);
  const sectorAngle = (2 * Math.PI * radius) / slantHeight;
  
  return {
    faces: [
      // Setor circular (superfície lateral)
      { type: 'sector', position: [0, 0, 0], rotation: [0, 0, 0], dimensions: { radius: slantHeight, angle: sectorAngle }, id: 'lateral' },
      // Base circular
      { type: 'circle', position: [slantHeight + radius + 1, 0, 0], rotation: [0, 0, 0], dimensions: { radius: radius }, id: 'base' },
    ],
    totalWidth: slantHeight + radius + 1,
    totalHeight: 2 * slantHeight
  };
}

// Componente que renderiza cada face individual
function FaceComponent({ face, faceColor, edgeColor, faceOpacity }: {
  face: UnfoldedFace;
  faceColor: string;
  edgeColor: string;
  faceOpacity: number;
}) {
  const geometry = useMemo(() => {
    switch (face.type) {
      case 'rectangle':
        return new THREE.PlaneGeometry(face.dimensions.width, face.dimensions.height);
      case 'circle':
        return new THREE.CylinderGeometry(face.dimensions.radius, face.dimensions.radius, 0.01, 32);
      case 'triangle':
        return createTriangleGeometry(face.dimensions);
      case 'sector':
        return new THREE.RingGeometry(0, face.dimensions.radius, 0, face.dimensions.angle, 32);
      case 'polygon':
        return new THREE.CylinderGeometry(
          face.dimensions.sideLength / (2 * Math.tan(Math.PI / face.dimensions.sides)),
          face.dimensions.sideLength / (2 * Math.tan(Math.PI / face.dimensions.sides)),
          0.01,
          face.dimensions.sides
        );
      default:
        return new THREE.PlaneGeometry(1, 1);
    }
  }, [face]);

  const edgeGeometry = useMemo(() => {
    return new THREE.EdgesGeometry(geometry);
  }, [geometry]);

  return (
    <group position={face.position} rotation={face.rotation}>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={faceColor} transparent opacity={faceOpacity} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments position={[0, 0, 0.001]} geometry={edgeGeometry}>
        <lineBasicMaterial color={edgeColor} />
      </lineSegments>
    </group>
  );
}

// Função auxiliar para criar geometria de triângulo
function createTriangleGeometry(dimensions: any) {
  const geometry = new THREE.BufferGeometry();
  
  if (dimensions.sideLength) {
    // Triângulo equilátero
    const a = dimensions.sideLength;
    const height = a * Math.sqrt(3) / 2;
    const vertices = new Float32Array([
      -a/2, -height/3, 0,
      a/2, -height/3, 0,
      0, 2*height/3, 0
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  } else if (dimensions.baseLength && dimensions.height) {
    // Triângulo isósceles
    const base = dimensions.baseLength;
    const h = dimensions.height;
    const vertices = new Float32Array([
      -base/2, 0, 0,
      base/2, 0, 0,
      0, h, 0
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  }
  
  const indices = new Uint16Array([0, 1, 2]);
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  
  return geometry;
}

// Sólido 3D para comparação
function SolidShape({ params, faceColor, edgeColor, faceOpacity }: {
  params: GeometryParams;
  faceColor: string;
  edgeColor: string;
  faceOpacity: number;
}) {
  const geometry = useMemo(() => {
    switch (params.type) {
      case 'cube':
        const size = params.sideLength || 2;
        return new THREE.BoxGeometry(size, size, size);
      case 'cylinder':
        const radius = params.radius || 2;
        const height = params.height || 4;
        return new THREE.CylinderGeometry(radius, radius, height, 32);
      case 'cone':
        const coneRadius = params.radius || 2;
        const coneHeight = params.height || 4;
        return new THREE.ConeGeometry(coneRadius, coneHeight, 32);
      case 'tetrahedron':
        return new THREE.TetrahedronGeometry(params.sideLength || 2);
      case 'octahedron':
        return new THREE.OctahedronGeometry(params.sideLength || 2);
      case 'dodecahedron':
        return new THREE.DodecahedronGeometry(params.sideLength || 1);
      case 'pyramid':
      case 'prism':
      default:
        return new THREE.BoxGeometry(2, 2, 2);
    }
  }, [params]);

  const edgeGeometry = useMemo(() => {
    return new THREE.EdgesGeometry(geometry);
  }, [geometry]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={faceColor} transparent opacity={faceOpacity} />
      </mesh>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color={edgeColor} />
      </lineSegments>
    </group>
  );
}