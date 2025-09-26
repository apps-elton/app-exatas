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
  showVerticesAlways?: boolean; // Nova prop para sempre mostrar vértices
  midpoints?: THREE.Vector3[]; // Pontos médios para incluir como vértices
}

// Função para obter as posições dos vértices
function getVertexPositions(params: GeometryParams, style: StyleOptions, isEquilateral?: boolean, midpoints?: THREE.Vector3[]): THREE.Vector3[] {
  const vertices: THREE.Vector3[] = [];
  
  switch (params.type) {
    case 'cube': {
      const size = params.sideLength || 2;
      const half = size / 2;
      vertices.push(
        new THREE.Vector3(-half, 0, -half),
        new THREE.Vector3(half, 0, -half),
        new THREE.Vector3(half, 0, half),
        new THREE.Vector3(-half, 0, half),
        new THREE.Vector3(-half, size, -half),
        new THREE.Vector3(half, size, -half),
        new THREE.Vector3(half, size, half),
        new THREE.Vector3(-half, size, half)
      );
      break;
    }
    case 'prism': {
      const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
      const radius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
      
      for (let i = 0; i < numSides; i++) {
        const angle = (i * 2 * Math.PI) / numSides;
        vertices.push(new THREE.Vector3(
          radius * Math.cos(angle),
          0,
          radius * Math.sin(angle)
        ));
      }
      
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
      
      for (let i = 0; i < numSides; i++) {
        const angle = (i * 2 * Math.PI) / numSides;
        vertices.push(new THREE.Vector3(
          radius * Math.cos(angle),
          0,
          radius * Math.sin(angle)
        ));
      }
      
      vertices.push(new THREE.Vector3(0, height, 0));
      break;
    }
    case 'tetrahedron': {
      const a = params.sideLength || 2;
      const h = a * Math.sqrt(2/3);
      
      vertices.push(new THREE.Vector3(0, 0, 0));
      vertices.push(new THREE.Vector3(a, 0, 0));
      vertices.push(new THREE.Vector3(a/2, 0, a * Math.sqrt(3)/2));
      vertices.push(new THREE.Vector3(a/2, h, a * Math.sqrt(3)/6));
      break;
    }
    case 'octahedron': {
      const a = params.sideLength || 2;
      const scaleFactor = a / Math.sqrt(2);
      const offset = scaleFactor;
      
      vertices.push(
        new THREE.Vector3(scaleFactor, offset, 0),
        new THREE.Vector3(-scaleFactor, offset, 0),
        new THREE.Vector3(0, offset, scaleFactor),
        new THREE.Vector3(0, offset, -scaleFactor),
        new THREE.Vector3(0, offset + scaleFactor, 0),
        new THREE.Vector3(0, 0, 0)
      );
      break;
    }
    case 'cylinder': {
      const radius = params.radius || 2;
      const height = isEquilateral ? radius * 2 : (params.height || 4);
      const numGeneratrices = Math.min(style.cylinderGeneratrices || 8, 10);
      
      for (let i = 0; i < numGeneratrices; i++) {
        const angle = (i * 2 * Math.PI) / numGeneratrices;
        vertices.push(new THREE.Vector3(
          radius * Math.cos(angle),
          0,
          radius * Math.sin(angle)
        ));
      }
      
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
      const numGeneratrices = Math.min(style.coneGeneratrices || 8, 10);
      
      for (let i = 0; i < numGeneratrices; i++) {
        const angle = (i * 2 * Math.PI) / numGeneratrices;
        vertices.push(new THREE.Vector3(
          radius * Math.cos(angle),
          0,
          radius * Math.sin(angle)
        ));
      }
      
      vertices.push(new THREE.Vector3(0, height, 0));
      break;
    }
    case 'dodecahedron': {
      const side = params.sideLength || 2;
      const radius = side * (Math.sqrt(3) * (1 + Math.sqrt(5))) / 4;
      const phi = (1 + Math.sqrt(5)) / 2;
      const scale = radius / Math.sqrt(3);
      
      const uniqueVertices = [
        [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
        [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
        [0, phi, 1/phi], [0, phi, -1/phi], [0, -phi, 1/phi], [0, -phi, -1/phi],
        [1/phi, 0, phi], [-1/phi, 0, phi], [1/phi, 0, -phi], [-1/phi, 0, -phi],
        [phi, 1/phi, 0], [phi, -1/phi, 0], [-phi, 1/phi, 0], [-phi, -1/phi, 0]
      ];
      
      uniqueVertices.forEach(([x, y, z]) => {
        vertices.push(new THREE.Vector3(x * scale, y * scale + radius, z * scale));
      });
      break;
    }
    case 'icosahedron': {
      const side = params.sideLength || 2;
      const phi = (1 + Math.sqrt(5)) / 2;
      const radius = (side * phi) / (2 * Math.sin(Math.PI / 5));
      const scale = radius / Math.sqrt(phi * phi + 1);
      
      const uniqueVertices = [
        [0, 1, phi], [0, 1, -phi], [0, -1, phi], [0, -1, -phi],
        [1, phi, 0], [1, -phi, 0], [-1, phi, 0], [-1, -phi, 0],
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
  
  // Adicionar pontos médios à lista de vértices na posição correta
  if (midpoints) {
    // Calcular o número base de vértices para determinar onde inserir os pontos médios
    const getBaseVertexCount = (): number => {
      switch (params.type) {
        case 'cube': return 8;
        case 'tetrahedron': return 4;
        case 'octahedron': return 6;
        case 'dodecahedron': return 20;
        case 'icosahedron': return 12;
        case 'cylinder': return 16;
        case 'cone': return 9;
        case 'prism': {
          const numSides = params.numSides || 5;
          return numSides * 2;
        }
        case 'pyramid': {
          const numSides = params.numSides || 5;
          return numSides + 1;
        }
        default: return 8;
      }
    };
    
    const baseVertexCount = getBaseVertexCount();
    console.log('=== PLANE DEFINITION MIDPOINTS DEBUG ===');
    console.log('Base vertex count:', baseVertexCount);
    console.log('Midpoints count:', midpoints.length);
    console.log('Vertices before midpoints:', vertices.length);
    
    // Inserir pontos médios na posição correta (após os vértices base)
    midpoints.forEach((midpoint, index) => {
      const finalIndex = baseVertexCount + index;
      console.log(`Midpoint ${index} inserted at index ${finalIndex}`);
      
      // Garantir que o array tenha o tamanho suficiente
      while (vertices.length <= finalIndex) {
        vertices.push(new THREE.Vector3(0, 0, 0)); // Placeholder
      }
      
      vertices[finalIndex] = midpoint;
    });
    
    console.log('Vertices after midpoints:', vertices.length);
    console.log('Final vertices array:', vertices.map((v, i) => `[${i}]: ${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}`));
  }
  
  return vertices;
}

function calculatePlane(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3) {
  const v1 = p2.clone().sub(p1);
  const v2 = p3.clone().sub(p1);
  const normal = v1.clone().cross(v2).normalize();
  
  const a = normal.x;
  const b = normal.y;
  const c = normal.z;
  const d = -(a * p1.x + b * p1.y + c * p1.z);
  
  return { normal, coefficients: { a, b, c, d }, point: p1 };
}

function createPlaneGeometry(plane: any, size: number = 10): THREE.PlaneGeometry {
  const planeGeometry = new THREE.PlaneGeometry(size, size, 32, 32);
  
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), plane.normal);
  planeGeometry.applyQuaternion(quaternion);
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
  isEquilateral,
  showVerticesAlways = true, // Por padrão sempre mostra
  midpoints = [] // Pontos médios para incluir como vértices
}: PlaneDefinitionProps) {
  const vertexPositions = useMemo(() => getVertexPositions(params, style, isEquilateral, midpoints), [params, style, isEquilateral, midpoints]);
  
  const selectedPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    
    selectedVertices.forEach(index => {
      if (index < vertexPositions.length) {
        points.push(vertexPositions[index]);
      }
    });
    
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
    console.log('=== PLANE DEFINITION VERTEX CLICK ===');
    console.log('Vertex index:', vertexIndex);
    console.log('Position:', vertexPositions[vertexIndex]);
    console.log('onVertexSelect available:', !!onVertexSelect);
    
    // Verificar se é um ponto médio
    const getBaseVertexCount = (): number => {
      switch (params.type) {
        case 'cube': return 8;
        case 'tetrahedron': return 4;
        case 'octahedron': return 6;
        case 'dodecahedron': return 20;
        case 'icosahedron': return 12;
        case 'cylinder': return 16;
        case 'cone': return 9;
        case 'prism': {
          const numSides = params.numSides || 5;
          return numSides * 2;
        }
        case 'pyramid': {
          const numSides = params.numSides || 5;
          return numSides + 1;
        }
        default: return 8;
      }
    };
    
    const baseVertexCount = getBaseVertexCount();
    const isMidpoint = vertexIndex >= baseVertexCount;
    
    if (isMidpoint) {
      console.log('🎯 CLIQUE EM PONTO MÉDIO DETECTADO!');
      console.log('Índice do ponto médio:', vertexIndex);
      console.log('Base vertex count:', baseVertexCount);
      console.log('Posição do ponto médio:', vertexPositions[vertexIndex]);
      console.log('onVertexSelect disponível:', !!onVertexSelect);
    }
    
    if (onVertexSelect) {
      onVertexSelect(vertexIndex, vertexPositions[vertexIndex]);
    }
  };

  const isVertexSelected = (index: number) => {
    return selectedVertices.includes(index);
  };

  // Verificar se um vértice faz parte de algum plano criado
  const isVertexInPlane = (index: number) => {
    return planes.some(plane => plane.vertices.includes(index));
  };

  return (
    <group key="plane-definition-root">
      {/* SEMPRE renderizar vértices clicáveis primeiro (atrás dos planos) */}
      {(() => {
        console.log('=== VERTICES RENDERING DEBUG ===');
        console.log('showVerticesAlways:', showVerticesAlways);
        console.log('vertexPositions.length:', vertexPositions.length);
        console.log('Should render vertices:', showVerticesAlways && vertexPositions.length > 0);
        return showVerticesAlways && vertexPositions.length > 0;
      })() && vertexPositions.map((position, index) => {
        // Verificar se é um ponto médio
        const getBaseVertexCount = (): number => {
          switch (params.type) {
            case 'cube': return 8;
            case 'tetrahedron': return 4;
            case 'octahedron': return 6;
            case 'dodecahedron': return 20;
            case 'icosahedron': return 12;
            case 'cylinder': return 16;
            case 'cone': return 9;
            case 'prism': {
              const numSides = params.numSides || 5;
              return numSides * 2;
            }
            case 'pyramid': {
              const numSides = params.numSides || 5;
              return numSides + 1;
            }
            default: return 8;
          }
        };
        
        const baseVertexCount = getBaseVertexCount();
        const isMidpoint = index >= baseVertexCount;
        
        console.log(`=== RENDERING VERTEX ${index} ===`);
        console.log('Position:', position);
        console.log('Is midpoint:', isMidpoint);
        console.log('Base vertex count:', baseVertexCount);
        
        if (isMidpoint) {
          console.log('🎯 RENDERIZANDO PONTO MÉDIO NO PLANE DEFINITION!');
          console.log('Índice do ponto médio:', index);
          console.log('Posição do ponto médio:', position);
        }
        
        return (
        <mesh
          key={`vertex-${index}`}
          position={position}
          onClick={(e) => {
            e.stopPropagation();
            console.log('=== VERTEX MESH CLICK ===');
            console.log('Vertex index:', index);
            console.log('Position:', position);
            console.log('Is midpoint:', isMidpoint);
            console.log('Base vertex count:', baseVertexCount);
            if (isMidpoint) {
              console.log('🎯 CLIQUE EM PONTO MÉDIO NO PLANE DEFINITION!');
              console.log('Índice do ponto médio clicado:', index);
              console.log('Posição do ponto médio clicado:', position);
            }
            handleVertexClick(index);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            console.log('=== VERTEX MESH POINTER DOWN ===');
            console.log('Vertex index:', index);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'default';
          }}
          renderOrder={10} // Renderizar por último para ficar na frente
        >
          <sphereGeometry args={[0.08]} />
          <meshBasicMaterial 
            color={
              isVertexSelected(index) ? '#ff0000' : // Vermelho quando selecionado
              isVertexInPlane(index) ? '#00ff00' :   // Verde se faz parte de um plano
              '#ffff00'                               // Amarelo padrão
            } 
            transparent
            opacity={0.9}
          />
        </mesh>
        );
      })}
      
      {/* Renderizar planos existentes */}
      {(() => {
        console.log('=== PLANE RENDERING DEBUG ===');
        console.log('planes prop:', planes);
        console.log('planes.length:', planes?.length);
        console.log('Should render planes:', planes && planes.length > 0);
        console.log('showVerticesAlways:', showVerticesAlways);
        console.log('selectedVertices:', selectedVertices);
        return planes && planes.length > 0;
      })() && planes.map((plane, planeIndex) => {
        console.log('=== INDIVIDUAL PLANE DEBUG ===');
        console.log('Current Plane:', plane);
        console.log('Plane Index:', planeIndex);
        console.log('Total Planes:', planes.length);
        
        const planePoints = plane.vertices.map(index => vertexPositions[index]).filter(pos => pos !== undefined);
        if (planePoints.length < 3) {
          console.warn('Não foi possível renderizar plano - vértices insuficientes');
          return null;
        }

        const currentPlaneData = calculatePlane(planePoints[0], planePoints[1], planePoints[2]);
        const currentPlaneGeometry = createPlaneGeometry(currentPlaneData);

        const isSelected = selectedElements.some(el => el.type === 'plane' && el.id === plane.id);
        
        return (
          <group key={`created-plane-${plane.id}`}>
            {/* Plano semi-transparente */}
            <mesh 
              geometry={currentPlaneGeometry}
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
              renderOrder={0} // Renderizar primeiro (atrás)
            >
              <meshBasicMaterial 
                color={isSelected ? '#ffff00' : plane.color}
                transparent
                opacity={isSelected ? 0.8 : plane.opacity}
                side={THREE.DoubleSide}
                depthWrite={false} // Importante para transparência
              />
            </mesh>
            
            {/* Wireframe do plano */}
            <lineSegments geometry={new THREE.EdgesGeometry(currentPlaneGeometry)}>
              <lineBasicMaterial color={plane.color} linewidth={2} />
            </lineSegments>
            
            {/* Vetor normal do plano */}
            {showNormalVector && (
              <arrowHelper
                args={[
                  currentPlaneData.normal, 
                  currentPlaneData.point, 
                  1, // Comprimento
                  '#ff0000', // Cor do vetor
                  0.2, // Tamanho da ponta
                  0.1 // Raio da haste
                ]}
              />
            )}
          </group>
        );
      })}
      
      {/* Renderizar pontos selecionados com números */}
      {selectedVertices.length > 0 && selectedPoints.map((point, index) => (
        <group key={`selected-point-${index}`} position={point}>
          <mesh renderOrder={2}>
            <sphereGeometry args={[0.08]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          <Text
            position={[0, 0.3, 0]}
            fontSize={0.2}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            renderOrder={3}
          >
            {(index + 1).toString()}
          </Text>
        </group>
      ))}
      
      {/* Preview do plano em construção */}
      {showPlane && planeGeometry && planeData && selectedVertices.length >= 3 && (
        <group key="plane-preview">
          <mesh geometry={planeGeometry} renderOrder={0}>
            <meshBasicMaterial 
              color={style.planeColor || '#00ffff'}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          
          <lineSegments geometry={new THREE.EdgesGeometry(planeGeometry)}>
            <lineBasicMaterial 
              color={style.planeColor || '#00ffff'} 
              opacity={0.7}
              transparent
              linewidth={2}
            />
          </lineSegments>
          
          {showNormalVector && (
            <arrowHelper
              args={[
                planeData.normal,
                planeData.point,
                2,
                style.planeColor || '#00ffff',
                0.5,
                0.3
              ]}
            />
          )}
        </group>
      )}
      
      {/* Instruções e botões */}
      {showSelectionInstructions && (
        <Text
          position={[0, 6, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          renderOrder={10}
        >
          {planes.length >= 5 
            ? 'Limite máximo de 5 planos atingido'
            : selectedVertices.length === 0 
              ? 'Selecione 3 vértices para criar um plano'
              : selectedVertices.length < 3
                ? `Selecione mais ${3 - selectedVertices.length} vértice(s)`
                : 'Clique em "Criar Plano" para finalizar'
          }
        </Text>
      )}
      
      {/* Botões de ação */}
      {selectedPoints.length >= 3 && planes.length < 5 && (
        <group>
          <mesh 
            position={[3, 5.5, 0]} 
            onClick={(e) => {
              e.stopPropagation();
              if (onCreatePlane) onCreatePlane();
            }}
            renderOrder={10}
          >
            <boxGeometry args={[2.5, 0.5, 0.1]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          <Text
            position={[3, 5.5, 0.06]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            renderOrder={11}
          >
            Criar Plano
          </Text>
        </group>
      )}

      {selectedPoints.length > 0 && (
        <group>
          <mesh 
            position={[6, 5.5, 0]} 
            onClick={(e) => {
              e.stopPropagation();
              if (onClearSelection) onClearSelection();
            }}
            renderOrder={10}
          >
            <boxGeometry args={[2, 0.5, 0.1]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          <Text
            position={[6, 5.5, 0.06]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            renderOrder={11}
          >
            Limpar
          </Text>
        </group>
      )}
    </group>
  );
}

export default PlaneDefinition;