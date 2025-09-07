import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { GeometryParams, StyleOptions } from '@/types/geometry';

interface PlaneDefinitionProps {
  params: GeometryParams;
  style: StyleOptions;
  selectedVertices: number[];
  selectedPositions?: THREE.Vector3[];
  showPlane: boolean;
  showSelectionInstructions?: boolean;
  showNormalVector?: boolean;
  onVertexSelect?: (vertexIndex: number, position?: THREE.Vector3) => void;
  onClearSelection?: () => void;
  onCreatePlane?: () => void;
  planes?: { id: string; name?: string; vertices: number[]; color: string; opacity: number; }[];
  selectedElements?: {type: 'plane' | 'construction', id: string}[];
  onElementSelect?: (elements: {type: 'plane' | 'construction', id: string}[]) => void;
  isEquilateral?: boolean;
}

// Função para obter as posições dos vértices de diferentes geometrias
function getVertexPositions(params: GeometryParams, style: StyleOptions, isEquilateral?: boolean): THREE.Vector3[] {
  const vertices: THREE.Vector3[] = [];
  
  switch (params.type) {
    case 'cube': {
      const size = params.sideLength || 2;
      const half = size / 2;
      // 8 vértices do cubo, ordenados
      vertices.push(
        new THREE.Vector3(-half, 0, -half),  // 0: base inferior esquerda tras
        new THREE.Vector3(half, 0, -half),   // 1: base inferior direita tras
        new THREE.Vector3(half, 0, half),    // 2: base inferior direita frente
        new THREE.Vector3(-half, 0, half),   // 3: base inferior esquerda frente
        new THREE.Vector3(-half, size, -half), // 4: base superior esquerda tras
        new THREE.Vector3(half, size, -half),  // 5: base superior direita tras
        new THREE.Vector3(half, size, half),   // 6: base superior direita frente
        new THREE.Vector3(-half, size, half)   // 7: base superior esquerda frente
      );
      break;
    }
    case 'prism': {
      const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
      const radius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
      
      // Vértices da base inferior
      for (let i = 0; i < numSides; i++) {
        const angle = (i * 2 * Math.PI) / numSides;
        vertices.push(new THREE.Vector3(
          radius * Math.cos(angle),
          0,
          radius * Math.sin(angle)
        ));
      }
      
      // Vértices da base superior
      for (let i = 0; i < numSides; i++) {
        const angle = (i * 2 * Math.PI) / numSides;
        vertices.push(new THREE.Vector3(
          radius * Math.cos(angle),
          height,
          radius * Math.sin(angle)
        ));
      }
      break;
    }
    case 'pyramid': {
      const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
      const radius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
      
      // Vértices da base
      for (let i = 0; i < numSides; i++) {
        const angle = (i * 2 * Math.PI) / numSides;
        vertices.push(new THREE.Vector3(
          radius * Math.cos(angle),
          0,
          radius * Math.sin(angle)
        ));
      }
      
      // Vértice do topo
      vertices.push(new THREE.Vector3(0, height, 0));
      break;
    }
    case 'tetrahedron': {
      const a = params.sideLength || 2;
      const h = a * Math.sqrt(2/3);
      
      // Base triangular
      vertices.push(new THREE.Vector3(0, 0, 0));
      vertices.push(new THREE.Vector3(a, 0, 0));
      vertices.push(new THREE.Vector3(a/2, 0, a * Math.sqrt(3)/2));
      // Vértice superior
      vertices.push(new THREE.Vector3(a/2, h, a * Math.sqrt(3)/6));
      break;
    }
    case 'octahedron': {
      const a = params.sideLength || 2;
      const scaleFactor = a / Math.sqrt(2);
      const offset = scaleFactor;
      
      // 6 vértices do octaedro (consistentes com GeometryCanvas)
      vertices.push(
        new THREE.Vector3(scaleFactor, offset, 0),        // 0: direita
        new THREE.Vector3(-scaleFactor, offset, 0),       // 1: esquerda  
        new THREE.Vector3(0, offset, scaleFactor),        // 2: frente
        new THREE.Vector3(0, offset, -scaleFactor),       // 3: tras
        new THREE.Vector3(0, offset + scaleFactor, 0),    // 4: topo
        new THREE.Vector3(0, 0, 0)                        // 5: baixo
      );
      break;
    }
    case 'cylinder': {
      const radius = params.radius || 2;
      const height = isEquilateral ? radius * 2 : (params.height || 4);
      const numGeneratrices = Math.min(style.cylinderGeneratrices || 8, 10); // Máximo 10 vértices
      
      // Vértices da base inferior (circunferência)
      for (let i = 0; i < numGeneratrices; i++) {
        const angle = (i * 2 * Math.PI) / numGeneratrices;
        vertices.push(new THREE.Vector3(
          radius * Math.cos(angle),
          0,
          radius * Math.sin(angle)
        ));
      }
      
      // Vértices da base superior (circunferência)
      for (let i = 0; i < numGeneratrices; i++) {
        const angle = (i * 2 * Math.PI) / numGeneratrices;
        vertices.push(new THREE.Vector3(
          radius * Math.cos(angle),
          height,
          radius * Math.sin(angle)
        ));
      }
      break;
    }
    case 'cone': {
      const radius = params.radius || 2;
      const height = isEquilateral ? radius * 2 : (params.height || 4);
      const numGeneratrices = Math.min(style.coneGeneratrices || 8, 10); // Máximo 10 vértices
      
      // Vértices da base (circunferência)
      for (let i = 0; i < numGeneratrices; i++) {
        const angle = (i * 2 * Math.PI) / numGeneratrices;
        vertices.push(new THREE.Vector3(
          radius * Math.cos(angle),
          0,
          radius * Math.sin(angle)
        ));
      }
      
      // Vértice do topo
      vertices.push(new THREE.Vector3(0, height, 0));
      break;
    }
    case 'dodecahedron': {
      const side = params.sideLength || 2;
      const radius = side * (Math.sqrt(3) * (1 + Math.sqrt(5))) / 4;
      
      // Vértices do dodecaedro regular (20 vértices únicos)
      const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
      const scale = radius / Math.sqrt(3);
      
      // Apenas os 20 vértices únicos do dodecaedro
      const uniqueVertices = [
        // Cubo unitário
        [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
        [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
        // Retângulos no plano YZ
        [0, phi, 1/phi], [0, phi, -1/phi], [0, -phi, 1/phi], [0, -phi, -1/phi],
        // Retângulos no plano XZ  
        [1/phi, 0, phi], [-1/phi, 0, phi], [1/phi, 0, -phi], [-1/phi, 0, -phi],
        // Retângulos no plano XY
        [phi, 1/phi, 0], [phi, -1/phi, 0], [-phi, 1/phi, 0], [-phi, -1/phi, 0]
      ];
      
      uniqueVertices.forEach(([x, y, z]) => {
        vertices.push(new THREE.Vector3(x * scale, y * scale + radius, z * scale));
      });
      break;
    }
    case 'icosahedron': {
      const side = params.sideLength || 2;
      const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
      const radius = (side * phi) / (2 * Math.sin(Math.PI / 5));
      
      // Apenas os 12 vértices únicos do icosaedro
      const scale = radius / Math.sqrt(phi * phi + 1);
      const uniqueVertices = [
        // Retângulos no plano YZ
        [0, 1, phi], [0, 1, -phi], [0, -1, phi], [0, -1, -phi],
        // Retângulos no plano XZ
        [1, phi, 0], [1, -phi, 0], [-1, phi, 0], [-1, -phi, 0],
        // Retângulos no plano XY
        [phi, 0, 1], [phi, 0, -1], [-phi, 0, 1], [-phi, 0, -1]
      ];
      
      uniqueVertices.forEach(([x, y, z]) => {
        vertices.push(new THREE.Vector3(x * scale, y * scale + radius, z * scale));
      });
      break;
    }
    default:
      break;
  }
  
  return vertices;
}

// Função para calcular o plano a partir de 3 pontos
function calculatePlane(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3) {
  const v1 = p2.clone().sub(p1);
  const v2 = p3.clone().sub(p1);
  const normal = v1.clone().cross(v2).normalize();
  
  // Equação do plano: ax + by + cz + d = 0
  const a = normal.x;
  const b = normal.y;
  const c = normal.z;
  const d = -(a * p1.x + b * p1.y + c * p1.z);
  
  return { normal, coefficients: { a, b, c, d }, point: p1 };
}

// Função para criar a geometria visual do plano
function createPlaneGeometry(plane: any, size: number = 10): THREE.PlaneGeometry {
  const planeGeometry = new THREE.PlaneGeometry(size, size, 32, 32);
  
  // Orientar o plano de acordo com a normal
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), plane.normal);
  planeGeometry.applyQuaternion(quaternion);
  
  // Posicionar o plano no ponto de referência
  planeGeometry.translate(plane.point.x, plane.point.y, plane.point.z);
  
  return planeGeometry;
}

export function PlaneDefinition({
  params,
  style,
  selectedVertices,
  selectedPositions = [],
  showPlane,
  showSelectionInstructions = true,
  showNormalVector = true,
  onVertexSelect,
  onClearSelection,
  onCreatePlane,
  planes = [],
  selectedElements = [],
  onElementSelect,
  isEquilateral
}: PlaneDefinitionProps) {
  const vertexPositions = useMemo(() => getVertexPositions(params, style, isEquilateral), [params, style, isEquilateral]);
  
  // Debug: log para verificar se os planos estão sendo recebidos
  React.useEffect(() => {
    console.log('=== PlaneDefinition RENDER ===');
    console.log('Número de planos recebidos:', planes.length);
    console.log('Planos:', planes);
    console.log('Vértices selecionados atualmente:', selectedVertices);
    console.log('showPlane:', showPlane);
  }, [planes, selectedVertices, showPlane]);
  
  const selectedPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    
    // Adicionar vértices selecionados
    selectedVertices.forEach(index => {
      if (index < vertexPositions.length) {
        points.push(vertexPositions[index]);
      }
    });
    
    // Adicionar posições customizadas (intersecções, etc.)
    selectedPositions.forEach(pos => {
      points.push(pos);
    });
    
    return points;
  }, [selectedVertices, selectedPositions, vertexPositions]);
  
  const planeData = useMemo(() => {
    if (selectedPoints.length >= 3) {
      return calculatePlane(selectedPoints[0], selectedPoints[1], selectedPoints[2]);
    }
    return null;
  }, [selectedPoints]);
  
  const planeGeometry = useMemo(() => {
    if (planeData) {
      return createPlaneGeometry(planeData);
    }
    return null;
  }, [planeData]);

  const handleVertexClick = (vertexIndex: number) => {
    if (onVertexSelect) {
      onVertexSelect(vertexIndex, vertexPositions[vertexIndex]);
    }
  };

  const isVertexSelected = (index: number) => {
    return selectedVertices.includes(index);
  };

  return (
    <group key="plane-definition-root">
      {/* Renderizar planos existentes */}
      {planes.map((plane) => {
        const planePoints = plane.vertices.map(index => vertexPositions[index]).filter(pos => pos !== undefined);
        if (planePoints.length < 3) return null;

        const planeData = calculatePlane(planePoints[0], planePoints[1], planePoints[2]);
        const planeGeometry = createPlaneGeometry(planeData);

        const isSelected = selectedElements.some(el => el.type === 'plane' && el.id === plane.id);
        
        return (
          <group key={`created-plane-${plane.id}`}>
            {/* Plano semi-transparente */}
            <mesh 
              geometry={planeGeometry}
              onClick={(e) => {
                e.stopPropagation();
                if (onElementSelect) {
                  const isCurrentlySelected = selectedElements.some(el => el.type === 'plane' && el.id === plane.id);
                  if (isCurrentlySelected) {
                    onElementSelect(selectedElements.filter(el => !(el.type === 'plane' && el.id === plane.id)));
                  } else {
                    onElementSelect([...selectedElements, { type: 'plane', id: plane.id }]);
                  }
                }
              }}
            >
              <meshBasicMaterial 
                color={isSelected ? '#ffff00' : plane.color}
                transparent
                opacity={isSelected ? 0.8 : plane.opacity}
                side={THREE.DoubleSide}
                wireframe={false}
              />
            </mesh>
            
            {/* Wireframe do plano */}
            <lineSegments geometry={new THREE.EdgesGeometry(planeGeometry)}>
              <lineBasicMaterial color={plane.color} />
            </lineSegments>
            
            {/* Vetor normal do plano */}
            {showNormalVector && (
              <arrowHelper
                args={[
                  planeData.normal,
                  planeData.point,
                  2,
                  plane.color,
                  0.5,
                  0.3
                ]}
              />
            )}
            
            {/* Nome do plano */}
            <Text
              position={[planeData.point.x, planeData.point.y + 1, planeData.point.z]}
              fontSize={0.25}
              color={plane.color}
              anchorX="center"
              anchorY="middle"
            >
              {plane.name || `Plano ${planes.findIndex(p => p.id === plane.id) + 1}`}
            </Text>
            {planePoints.map((point, index) => (
              <mesh key={`plane-${plane.id}-point-${index}`} position={point}>
                <sphereGeometry args={[0.06]} />
                <meshBasicMaterial color={plane.color} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Renderizar vértices clicáveis para novo plano */}
      {vertexPositions.map((position, index) => (
        <mesh
          key={`vertex-${index}`}
          position={position}
          onClick={() => handleVertexClick(index)}
        >
          <sphereGeometry args={[0.08]} />
          <meshBasicMaterial 
            color={isVertexSelected(index) ? style.planeColor : '#ffff00'} 
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
      
      {/* Renderizar pontos selecionados com números - APENAS se há seleção ativa */}
      {selectedVertices.length > 0 && selectedPoints.map((point, index) => (
        <group key={`selected-point-${index}`} position={point}>
          <mesh>
            <sphereGeometry args={[0.12]} />
            <meshBasicMaterial color={style.planeColor} />
          </mesh>
          <Text
            position={[0, 0.3, 0]}
            fontSize={0.2}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {(index + 1).toString()}
          </Text>
        </group>
      ))}
      
      {/* Renderizar o plano em construção (preview) - apenas quando há seleção ativa */}
      {showPlane && planeGeometry && planeData && selectedVertices.length >= 3 && (
        <group key="plane-preview">
          {/* Plano semi-transparente em construção */}
          <mesh geometry={planeGeometry}>
            <meshBasicMaterial 
              color={style.planeColor}
              transparent
              opacity={Math.min(style.planeOpacity, 0.5)} // Preview mais transparente
              side={THREE.DoubleSide}
              wireframe={false}
            />
          </mesh>
          
          {/* Wireframe do plano em construção */}
          <lineSegments geometry={new THREE.EdgesGeometry(planeGeometry)}>
            <lineBasicMaterial 
              color={style.planeColor} 
              opacity={0.7}
              transparent
            />
          </lineSegments>
          
          {/* Vetor normal do plano em construção */}
          {showNormalVector && (
            <arrowHelper
              args={[
                planeData.normal,
                planeData.point,
                2,
                style.planeColor,
                0.5,
                0.3
              ]}
            />
          )}
          
        </group>
      )}
      
      {/* Instruções visuais */}
      {showSelectionInstructions && (
        <Text
          position={[0, 6, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {planes && planes.length >= 5 
            ? 'Limite máximo de 5 planos atingido'
            : selectedVertices.length === 0 
              ? 'Clique nos vértices amarelos para definir um plano'
              : selectedVertices.length < 3
                ? `Selecione ${3 - selectedVertices.length} vértice(s) para criar um plano`
                : 'Clique em "Criar Plano" para finalizar'
          }
        </Text>
      )}
      
      {/* Botão para criar plano quando há 3 vértices selecionados */}
      {selectedPoints.length >= 3 && onCreatePlane && (
        <mesh 
          position={[3, 5, 0]} 
          onClick={(e) => {
            e.stopPropagation();
            onCreatePlane();
          }}
        >
          <boxGeometry args={[2.5, 0.5, 0.1]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
      )}
      
      {/* Texto do botão criar plano */}
      {selectedPoints.length >= 3 && onCreatePlane && (
        <Text
          position={[3, 5, 0.06]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Criar Plano
        </Text>
      )}

      {/* Botão para limpar seleção */}
      {selectedPoints.length > 0 && onClearSelection && (
        <mesh 
          position={[6, 5, 0]} 
          onClick={(e) => {
            e.stopPropagation();
            onClearSelection();
          }}
        >
          <boxGeometry args={[2, 0.5, 0.1]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      )}
      
      {/* Texto do botão limpar */}
      {selectedPoints.length > 0 && onClearSelection && (
        <Text
          position={[6, 5, 0.06]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Limpar
        </Text>
      )}
    </group>
  );
}

export default PlaneDefinition;