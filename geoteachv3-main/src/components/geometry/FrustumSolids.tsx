import React, { useMemo, useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { GeometryParams, VisualizationOptions, StyleOptions } from '@/types/geometry';

// Funções para criar geometrias de cones e pirâmides completos que podem ser cortados
const FrustumGeometries = {
  // Cone completo
  createFullCone: (
    radius: number,
    height: number,
    radialSegments: number = 32
  ) => {
    return new THREE.ConeGeometry(radius, height, radialSegments);
  },

  // Pirâmide completa
  createFullPyramid: (
    baseSides: number,
    baseRadius: number,
    height: number
  ) => {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    // Vértice do ápice
    vertices.push(0, height / 2, 0);

    // Vértices da base
    for (let i = 0; i < baseSides; i++) {
      const angle = (i * 2 * Math.PI) / baseSides;
      const x = baseRadius * Math.cos(angle);
      const z = baseRadius * Math.sin(angle);
      vertices.push(x, -height / 2, z);
    }

    // Criar faces laterais
    for (let i = 0; i < baseSides; i++) {
      const next = (i + 1) % baseSides;
      indices.push(0, i + 1, next + 1);
    }

    // Criar face da base
    for (let i = 1; i < baseSides - 1; i++) {
      indices.push(1, i + 1, i + 2);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  },

  // Parte inferior do cone cortado (tronco)
  createConeBottom: (
    radius: number,
    cutHeight: number,
    totalHeight: number
  ) => {
    const bottomHeight = totalHeight - cutHeight;
    const topRadius = (radius * cutHeight) / totalHeight;
    
    // Sempre usar 64 segmentos para manter a base circular
    const geometry = new THREE.CylinderGeometry(
      topRadius,    // raio superior (menor)
      radius,       // raio inferior (maior)
      bottomHeight, // altura do tronco
      64, // Sempre circular
      1,
      false
    );
    
    // Mover para que a base inferior tangencie o grid (y=0)
    geometry.translate(0, bottomHeight / 2, 0);
    
    return geometry;
  },

  // Parte superior do cone cortado
  createConeTop: (
    radius: number,
    cutHeight: number,
    totalHeight: number
  ) => {
    const topRadius = (radius * cutHeight) / totalHeight;
    // Sempre usar 64 segmentos para manter a base circular
    const geometry = new THREE.ConeGeometry(topRadius, cutHeight, 64);
    
    // Mover para que a base do cone superior fique na posição correta
    geometry.translate(0, cutHeight / 2, 0);
    
    return geometry;
  },

  // Parte inferior da pirâmide cortada (tronco) - base poligonal
  createPyramidBottom: (
    baseRadius: number,
    cutHeight: number,
    totalHeight: number,
    sides: number = 4
  ) => {
    const bottomHeight = totalHeight - cutHeight;
    const topRadius = (baseRadius * cutHeight) / totalHeight;
    
    const geometry = new THREE.CylinderGeometry(
      topRadius,    // raio superior (menor)
      baseRadius,   // raio inferior (maior)
      bottomHeight, // altura do tronco
      sides, // Número de lados da base
      1,
      false
    );
    
    // Mover para que a base inferior tangencie o grid (y=0)
    geometry.translate(0, bottomHeight / 2, 0);
    
    return geometry;
  },

  // Parte superior da pirâmide cortada - base poligonal
  createPyramidTop: (
    baseRadius: number,
    cutHeight: number,
    totalHeight: number,
    sides: number = 4
  ) => {
    const topRadius = (baseRadius * cutHeight) / totalHeight;
    
    const geometry = new THREE.ConeGeometry(topRadius, cutHeight, sides);
    
    // Mover para que a base do cone superior fique na posição correta
    geometry.translate(0, cutHeight / 2, 0);
    
    return geometry;
  },

};

interface FrustumSolidsProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
  onVertexSelect?: (vertexIndex: number) => void;
  onStyleChange?: (style: StyleOptions) => void;
}

export default function FrustumSolids({ 
  params, 
  options, 
  style, 
  onVertexSelect, 
  onStyleChange 
}: FrustumSolidsProps) {
  const [topPosition, setTopPosition] = useState(new THREE.Vector3(0, 0, 0));
  const [isTopSeparated, setIsTopSeparated] = useState(false);
  const topRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);

  const {
    height = 4,
    radius = 2,
    frustumCutHeight = 0.5, // 50% da altura por padrão
    frustumBaseSides = 4,
    frustumSeparable = true,
    frustumTopVisible = true,
    frustumTopMovable = true,
    frustumRotating = false, // Rotação do tronco
    // Cores individuais
    frustumBottomColor = '#3b82f6',
    frustumTopColor = '#ef4444',
    // Opacidades individuais
    frustumBottomOpacity = 0.8,
    frustumTopOpacity = 0.8,
    // Segmentos de altura
    frustumShowHeightSegments = false,
    frustumBottomSegmentColor = '#ffff00',
    frustumTopSegmentColor = '#ff00ff',
    frustumBottomSegmentThickness = 0.02,
    frustumTopSegmentThickness = 0.02
  } = params;

  const {
    fillFaces = true,
    showEdges = true,
    showVertices = false
  } = options;

  const {
    edgeColor = '#000000'
  } = style;

  // Calcular dimensões
  const cutHeight = height * frustumCutHeight;
  const bottomHeight = height - cutHeight;
  const topRadius = (radius * cutHeight) / height;

  // Geometria da parte inferior (tronco)
  const bottomGeometry = useMemo(() => {
    if (params.type === 'cone-frustum') {
      return FrustumGeometries.createConeBottom(
        radius,
        cutHeight,
        height
      );
    } else {
      return FrustumGeometries.createPyramidBottom(
        radius,
        cutHeight,
        height,
        frustumBaseSides
      );
    }
  }, [params.type, radius, cutHeight, height, frustumBaseSides]);

  // Geometria da parte superior
  const topGeometry = useMemo(() => {
    if (params.type === 'cone-frustum') {
      return FrustumGeometries.createConeTop(
        radius,
        cutHeight,
        height
      );
    } else {
      return FrustumGeometries.createPyramidTop(
        radius,
        cutHeight,
        height,
        frustumBaseSides
      );
    }
  }, [params.type, radius, cutHeight, height, frustumBaseSides]);

  // Posição da parte superior
  const topPositionY = isTopSeparated ? 
    topPosition.y : 
    (bottomHeight / 2 + cutHeight / 2);

  // Manipulador de clique para separar/mover a parte superior
  const handleTopClick = () => {
    if (frustumSeparable && frustumTopMovable) {
      if (isTopSeparated) {
        // Conectar: voltar à posição original (formar pirâmide completa)
        setIsTopSeparated(false);
        setTopPosition(new THREE.Vector3(0, 0, 0));
      } else {
        // Separar: mover para cima
        setIsTopSeparated(true);
        setTopPosition(new THREE.Vector3(0, 2, 0));
      }
    }
  };

  // Gerar vértices únicos da parte inferior
  const bottomVertices = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const positionAttribute = bottomGeometry.attributes.position;
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
  }, [bottomGeometry]);

  // Gerar vértices únicos da parte superior
  const topVertices = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const positionAttribute = topGeometry.attributes.position;
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
  }, [topGeometry]);

  // Wireframes
  const bottomWireframeGeometry = useMemo(() => {
    if (!showEdges) return null;
    return new THREE.EdgesGeometry(bottomGeometry, 1);
  }, [bottomGeometry, showEdges]);

  const topWireframeGeometry = useMemo(() => {
    if (!showEdges || !frustumTopVisible) return null;
    return new THREE.EdgesGeometry(topGeometry, 1);
  }, [topGeometry, showEdges, frustumTopVisible]);

  // Animação de rotação
  useFrame((state, delta) => {
    if (frustumRotating && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });


  // Manipulador de clique em vértice
  const handleVertexClick = (index: number) => {
    if (onVertexSelect) {
      onVertexSelect(index);
    }
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Parte inferior (tronco) */}
      {fillFaces && (
        <mesh geometry={bottomGeometry}>
          <meshPhongMaterial 
            color={frustumBottomColor}
            transparent={true}
            opacity={frustumBottomOpacity}
            side={THREE.DoubleSide}
            shininess={100}
            specular={0x222222}
          />
        </mesh>
      )}


      {/* Wireframe da parte inferior */}
      {showEdges && bottomWireframeGeometry && (
        <lineSegments geometry={bottomWireframeGeometry}>
          <lineBasicMaterial 
            color={edgeColor} 
            linewidth={2}
          />
        </lineSegments>
      )}

      {/* Parte superior cortada */}
      {frustumTopVisible && (
        <group 
          ref={topRef}
          position={[topPosition.x, topPositionY, topPosition.z]}
          onClick={handleTopClick}
        >
          {fillFaces && (
            <mesh geometry={topGeometry}>
              <meshPhongMaterial 
                color={frustumTopColor}
                transparent={true}
                opacity={frustumTopOpacity}
                side={THREE.DoubleSide}
                shininess={100}
                specular={0x222222}
              />
            </mesh>
          )}

          {showEdges && topWireframeGeometry && (
            <lineSegments geometry={topWireframeGeometry}>
              <lineBasicMaterial 
                color={edgeColor} 
                linewidth={2}
              />
            </lineSegments>
          )}


          {/* Indicador de conexão - temporariamente desabilitado */}
          {false && !isTopSeparated && (
            <mesh position={[0, -cutHeight / 2, 0]}>
              <ringGeometry args={[topRadius * 0.9, topRadius * 1.1, 32]} />
              <meshBasicMaterial color="#00ff00" transparent opacity={0.3} />
            </mesh>
          )}
        </group>
      )}

      {/* Segmentos de altura */}
      {frustumShowHeightSegments && (
        <>
          {/* Segmento da altura do tronco */}
          <mesh position={[radius + 0.5, bottomHeight / 2, 0]}>
            <cylinderGeometry args={[frustumBottomSegmentThickness, frustumBottomSegmentThickness, bottomHeight]} />
            <meshBasicMaterial color={frustumBottomSegmentColor} />
          </mesh>
          
          {/* Segmento da altura da parte superior */}
          {frustumTopVisible && (
            <mesh position={[radius + 0.5, topPositionY, 0]}>
              <cylinderGeometry args={[frustumTopSegmentThickness, frustumTopSegmentThickness, cutHeight]} />
              <meshBasicMaterial color={frustumTopSegmentColor} />
            </mesh>
          )}
        </>
      )}

      {/* Renderizar vértices da parte inferior */}
      {showVertices && bottomVertices.map((vertex, index) => (
        <mesh 
          key={`bottom-vertex-${index}`}
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

      {/* Renderizar vértices da parte superior */}
      {showVertices && frustumTopVisible && topVertices.map((vertex, index) => (
        <mesh 
          key={`top-vertex-${index}`}
          position={[vertex.x + topPosition.x, vertex.y + topPositionY, vertex.z + topPosition.z]}
          onClick={() => handleVertexClick(bottomVertices.length + index)}
        >
          <sphereGeometry args={[0.02, 6, 4]} />
          <meshBasicMaterial 
            color="#00ff00"
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
