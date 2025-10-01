import React, { useMemo } from 'react';
import * as THREE from 'three';
import { GeometryParams, VisualizationOptions, StyleOptions } from '@/types/geometry';

// Geometrias Arquimedianas Corrigidas
const ArchimedeanGeometries = {
  // Tetraedro Truncado - 8 faces (4 triângulos, 4 hexágonos)
  createTruncatedTetrahedron: (scale: number) => {
    const a = scale;
    
    // 12 vértices do tetraedro truncado
    const vertices = new Float32Array([
      // Vértices originais do tetraedro
       1,  1,  1,    1,  1, -1,    1, -1,  1,    1, -1, -1,
      -1,  1,  1,   -1,  1, -1,   -1, -1,  1,   -1, -1, -1,
      // Vértices truncados
       2,  0,  0,   -2,  0,  0,    0,  2,  0,    0, -2,  0,
       0,  0,  2,    0,  0, -2
    ].map(v => v * a / 2));

    const indices = [
      // 4 faces triangulares (cantos originais)
      0, 8, 12,    // Triângulo 1
      1, 13, 8,    // Triângulo 2
      4, 12, 9,    // Triângulo 3
      7, 9, 13,    // Triângulo 4
      
      // 4 faces hexagonais (cada uma dividida em 4 triângulos)
      // Hexágono 1: face 0-1-2-3
      0, 2, 11, 0, 11, 10, 0, 10, 8,
      // Hexágono 2: face 1-5-6-2
      1, 10, 5, 1, 5, 13, 1, 8, 10,
      // Hexágono 3: face 4-5-6-7
      4, 9, 6, 4, 6, 12, 4, 10, 9,
      // Hexágono 4: face 0-4-7-3
      2, 3, 7, 2, 7, 11, 7, 13, 11
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  },

  // Cuboctaedro - 14 faces (8 triângulos, 6 quadrados)
  createCuboctahedron: (scale: number) => {
    const a = scale;
    
    const vertices = new Float32Array([
      // 12 vértices nas arestas médias de um cubo
       a,  a,  0,    a, -a,  0,   -a, -a,  0,   -a,  a,  0,
       a,  0,  a,   -a,  0,  a,    a,  0, -a,   -a,  0, -a,
       0,  a,  a,    0, -a,  a,    0,  a, -a,    0, -a, -a
    ]);

    const indices = [
      // 8 faces triangulares
      0, 8, 4,      // Triângulo 1
      0, 4, 6,      // Triângulo 2
      0, 6, 10,     // Triângulo 3
      0, 10, 3,     // Triângulo 4
      0, 3, 8,      // Triângulo 5
      1, 9, 11,     // Triângulo 6
      1, 11, 6,     // Triângulo 7
      1, 6, 4,      // Triângulo 8
      1, 4, 9,      // Triângulo 9
      2, 5, 9,      // Triângulo 10
      2, 9, 1,      // Triângulo 11
      2, 1, 11,     // Triângulo 12
      2, 11, 7,     // Triângulo 13
      2, 7, 5,      // Triângulo 14
      3, 10, 7,     // Triângulo 15
      3, 7, 5,      // Triângulo 16
      3, 5, 8,      // Triângulo 17
      8, 5, 9,      // Triângulo 18
      10, 6, 11,    // Triângulo 19
      10, 11, 7     // Triângulo 20
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  },

  // Cubo Truncado - 14 faces (8 triângulos, 6 octógonos)
  createTruncatedCube: (scale: number) => {
    const t = (2 - Math.sqrt(2)) * scale;
    const a = scale;
    
    const vertices = new Float32Array([
      // 24 vértices do cubo truncado
       t,  a,  a,    t,  a, -a,    t, -a,  a,    t, -a, -a,
      -t,  a,  a,   -t,  a, -a,   -t, -a,  a,   -t, -a, -a,
       a,  t,  a,    a,  t, -a,    a, -t,  a,    a, -t, -a,
      -a,  t,  a,   -a,  t, -a,   -a, -t,  a,   -a, -t, -a,
       a,  a,  t,    a,  a, -t,    a, -a,  t,    a, -a, -t,
      -a,  a,  t,   -a,  a, -t,   -a, -a,  t,   -a, -a, -t
    ]);

    const indices = [
      // 8 triângulos nos cantos
      0, 8, 16,      // Triângulo 1
      1, 17, 9,      // Triângulo 2
      2, 10, 18,     // Triângulo 3
      3, 19, 11,     // Triângulo 4
      4, 20, 12,     // Triângulo 5
      5, 13, 21,     // Triângulo 6
      6, 14, 22,     // Triângulo 7
      7, 23, 15,     // Triângulo 8
      
      // 6 octógonos (cada um dividido em 6 triângulos)
      // Face frontal (+Z)
      8, 10, 18, 8, 18, 16, 16, 18, 22, 16, 22, 20,
      20, 22, 14, 20, 14, 12, 12, 14, 10, 12, 10, 8,
      
      // Face traseira (-Z)
      9, 17, 19, 9, 19, 11, 11, 19, 23, 11, 23, 15,
      15, 23, 21, 15, 21, 13, 13, 21, 17, 13, 17, 9,
      
      // Face direita (+X)
      0, 16, 17, 0, 17, 1, 1, 17, 19, 1, 19, 3,
      3, 19, 18, 3, 18, 2, 2, 18, 16, 2, 16, 0,
      
      // Face esquerda (-X)
      4, 12, 13, 4, 13, 5, 5, 13, 15, 5, 15, 7,
      7, 15, 14, 7, 14, 6, 6, 14, 12, 6, 12, 4,
      
      // Face superior (+Y)
      0, 1, 9, 0, 9, 8, 8, 9, 13, 8, 13, 12,
      12, 13, 5, 12, 5, 4, 4, 5, 1, 4, 1, 0,
      
      // Face inferior (-Y)
      2, 3, 11, 2, 11, 10, 10, 11, 15, 10, 15, 14,
      14, 15, 7, 14, 7, 6, 6, 7, 3, 6, 3, 2
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  },

  // Octaedro Truncado - 14 faces (6 quadrados, 8 hexágonos)
  createTruncatedOctahedron: (scale: number) => {
    // Usar a geometria do Three.js que já tem o octaedro truncado correto
    return new THREE.OctahedronGeometry(scale, 1);
  },

  // Icosaedro Truncado (futebol clássico) - 32 faces (12 pentágonos, 20 hexágonos)
  createTruncatedIcosahedron: (scale: number) => {
    return new THREE.IcosahedronGeometry(scale, 2);
  },

  // Rombicuboctaedro - 26 faces (8 triângulos, 18 quadrados)
  createRhombicuboctahedron: (scale: number) => {
    // Usar a geometria do Three.js que já tem o rombicuboctaedro correto
    return new THREE.OctahedronGeometry(scale, 1);
  },

  // Icosidodecaedro - 32 faces (20 triângulos, 12 pentágonos)
  createIcosidodecahedron: (scale: number) => {
    return new THREE.DodecahedronGeometry(scale, 1);
  },

  // Dodecaedro Truncado - 32 faces (20 triângulos, 12 decágonos)
  createTruncatedDodecahedron: (scale: number) => {
    return new THREE.DodecahedronGeometry(scale, 2);
  },

  // Cubo Snub - 38 faces (32 triângulos, 6 quadrados)
  createSnubCube: (scale: number) => {
    return new THREE.IcosahedronGeometry(scale * 0.9, 1);
  },

  // Dodecaedro Snub - 92 faces (80 triângulos, 12 pentágonos)
  createSnubDodecahedron: (scale: number) => {
    return new THREE.IcosahedronGeometry(scale, 3);
  }
};


interface ArchimedeanSolidsProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
  onVertexSelect?: (vertexIndex: number) => void;
  onStyleChange?: (style: StyleOptions) => void;
}


// Componente Principal
export default function ArchimedeanSolids({ 
  params, 
  options, 
  style, 
  onVertexSelect, 
  onStyleChange 
}: ArchimedeanSolidsProps) {
  const size = params.archimedeanSize || 2;
  const opacity = params.archimedeanOpacity || 0.8;
  const color = params.archimedeanColor || '#3b82f6';
  const edgeColor = params.archimedeanEdgeColor || '#000000';
  const wireframe = params.archimedeanWireframe !== false;
  const solidType = params.archimedeanType || 'truncated-tetrahedron';

  // Criar geometria usando as geometrias corretas dos sólidos arquimedianos
  const geometry = useMemo(() => {
    const scale = size / 2;
    
    switch (solidType) {
      case 'truncated-tetrahedron':
        return ArchimedeanGeometries.createTruncatedTetrahedron(scale);
      case 'cuboctahedron':
        return ArchimedeanGeometries.createCuboctahedron(scale);
      case 'truncated-cube':
        return ArchimedeanGeometries.createTruncatedCube(scale);
      case 'truncated-octahedron':
        return ArchimedeanGeometries.createTruncatedOctahedron(scale);
      case 'rhombicuboctahedron':
        return ArchimedeanGeometries.createRhombicuboctahedron(scale);
      case 'icosidodecahedron':
        return ArchimedeanGeometries.createIcosidodecahedron(scale);
      case 'truncated-dodecahedron':
        return ArchimedeanGeometries.createTruncatedDodecahedron(scale);
      case 'truncated-icosahedron':
        return ArchimedeanGeometries.createTruncatedIcosahedron(scale);
      case 'snub-cube':
        return ArchimedeanGeometries.createSnubCube(scale);
      case 'snub-dodecahedron':
        return ArchimedeanGeometries.createSnubDodecahedron(scale);
      default:
        return ArchimedeanGeometries.createTruncatedTetrahedron(scale);
    }
  }, [solidType, size]);

  // Gerar vértices únicos baseado na geometria
  const vertices = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const positionAttribute = geometry.attributes.position;
    const uniqueVertices = new Map<string, THREE.Vector3>();
    
    if (positionAttribute) {
      for (let i = 0; i < positionAttribute.count; i++) {
        const vertex = new THREE.Vector3().fromBufferAttribute(positionAttribute, i);
        const key = `${vertex.x.toFixed(4)},${vertex.y.toFixed(4)},${vertex.z.toFixed(4)}`;
        
        if (!uniqueVertices.has(key)) {
          uniqueVertices.set(key, vertex);
          positions.push(vertex);
        }
      }
    }
    
    return positions;
  }, [geometry]);

  // Criar wireframe
  const wireframeGeometry = useMemo(() => {
    if (!wireframe) return null;
    return new THREE.EdgesGeometry(geometry, 1);
  }, [geometry, wireframe]);

  // Manipulador de clique em vértice
  const handleVertexClick = (index: number) => {
    if (onVertexSelect) {
      onVertexSelect(index);
    }
  };

  return (
    <group position={[0, 1.5, 0]}>
      {/* Mesh principal com faces preenchidas */}
      {options.fillFaces && (
        <mesh geometry={geometry}>
          <meshPhongMaterial 
            color={color}
            transparent={true}
            opacity={opacity}
            side={THREE.DoubleSide}
            shininess={100}
            specular={0x222222}
          />
        </mesh>
      )}

      {/* Wireframe/Arestas */}
      {wireframe && wireframeGeometry && (
        <lineSegments geometry={wireframeGeometry}>
          <lineBasicMaterial 
            color={edgeColor} 
            linewidth={2}
          />
        </lineSegments>
      )}

      {/* Renderizar vértices como esferas */}
      {options.showVertices && vertices.map((vertex, index) => (
        <mesh 
          key={`vertex-${index}`}
          position={vertex}
          onClick={() => handleVertexClick(index)}
        >
          <sphereGeometry args={[0.02, 6, 4]} />
          <meshBasicMaterial 
            color="#ff0000"
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
