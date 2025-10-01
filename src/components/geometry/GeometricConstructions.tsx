import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Text, Line } from '@react-three/drei';
import { GeometryParams, StyleOptions } from '@/types/geometry';

export type ConstructionType = 
  | 'reta-perpendicular' 
  | 'reta-paralela' 
  | 'mediatriz' 
  | 'bissetriz' 
  | 'reta-tangente'
  | 'ponto-medio'
  | 'segmento-reta'
  | null;

interface GeometricConstructionsProps {
  params: GeometryParams;
  style: StyleOptions;
  selectedVertices: number[];
  constructionType: ConstructionType;
  showConstruction: boolean;
  onVertexSelect?: (vertexIndex: number, position?: THREE.Vector3) => void;
  onClearSelection?: () => void;
  constructions?: { id: string; type: ConstructionType; vertices: number[]; color: string; }[];
}

// Função para obter as posições dos vértices
function getVertexPositions(params: GeometryParams): THREE.Vector3[] {
  const vertices: THREE.Vector3[] = [];
  
  switch (params.type) {
    case 'cube': {
      const size = params.sideLength || 2;
      const half = size / 2;
      // Coordenadas ajustadas para coincidir com a geometria real do cubo
      // que é transladada para y=0 (base) até y=size (topo)
      vertices.push(
        new THREE.Vector3(-half, 0, -half),      // vértice 0: bottom-left-back
        new THREE.Vector3(half, 0, -half),       // vértice 1: bottom-right-back
        new THREE.Vector3(half, 0, half),        // vértice 2: bottom-right-front
        new THREE.Vector3(-half, 0, half),       // vértice 3: bottom-left-front
        new THREE.Vector3(-half, size, -half),   // vértice 4: top-left-back
        new THREE.Vector3(half, size, -half),    // vértice 5: top-right-back
        new THREE.Vector3(half, size, half),     // vértice 6: top-right-front
        new THREE.Vector3(-half, size, half)     // vértice 7: top-left-front
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
        new THREE.Vector3(scaleFactor, offset, 0),        // 0: direita
        new THREE.Vector3(-scaleFactor, offset, 0),       // 1: esquerda
        new THREE.Vector3(0, offset, scaleFactor),        // 2: frente
        new THREE.Vector3(0, offset, -scaleFactor),       // 3: tras
        new THREE.Vector3(0, offset + scaleFactor, 0),    // 4: topo
        new THREE.Vector3(0, 0, 0)                        // 5: baixo
      );
      break;
    }
    default:
      break;
  }
  
  return vertices;
}

// Função para calcular reta perpendicular (2 pontos para segmento, 1 ponto externo)
function calculatePerpendicular(p1: THREE.Vector3, p2: THREE.Vector3, externalPoint: THREE.Vector3) {
  // Direção do segmento original
  const direction = p2.clone().sub(p1).normalize();
  
  // Projeção do ponto externo no segmento
  const toExternal = externalPoint.clone().sub(p1);
  const projection = p1.clone().add(direction.clone().multiplyScalar(toExternal.dot(direction)));
  
  // Direção perpendicular do ponto externo para a projeção
  const perpDirection = externalPoint.clone().sub(projection).normalize();
  
  // Se o ponto está sobre a linha, usar uma direção perpendicular padrão
  if (perpDirection.length() === 0) {
    perpDirection.set(-direction.z, direction.y, direction.x).normalize();
  }
  
  const startPoint = externalPoint.clone().add(perpDirection.clone().multiplyScalar(-5));
  const endPoint = externalPoint.clone().add(perpDirection.clone().multiplyScalar(5));
  
  return { start: startPoint, end: endPoint };
}

// Função para calcular reta paralela
function calculateParallel(p1: THREE.Vector3, p2: THREE.Vector3, point: THREE.Vector3) {
  const direction = p2.clone().sub(p1).normalize();
  
  const startPoint = point.clone().add(direction.clone().multiplyScalar(-5));
  const endPoint = point.clone().add(direction.clone().multiplyScalar(5));
  
  return { start: startPoint, end: endPoint };
}

// Função para calcular mediatriz
function calculateBisector(p1: THREE.Vector3, p2: THREE.Vector3) {
  const midpoint = p1.clone().add(p2).multiplyScalar(0.5);
  const direction = p2.clone().sub(p1);
  const perpDirection = new THREE.Vector3(-direction.z, direction.y, direction.x).normalize();
  
  const startPoint = midpoint.clone().add(perpDirection.clone().multiplyScalar(-3));
  const endPoint = midpoint.clone().add(perpDirection.clone().multiplyScalar(3));
  
  return { start: startPoint, end: endPoint, midpoint };
}

// Função para calcular segmento de reta
function calculateLineSegment(p1: THREE.Vector3, p2: THREE.Vector3) {
  return { start: p1, end: p2 };
}
function calculateMidpoint(p1: THREE.Vector3, p2: THREE.Vector3) {
  const midpoint = p1.clone().add(p2).multiplyScalar(0.5);
  return { midpoint };
}

// Função para calcular bissetriz de ângulopassing points
function calculateAngleBisector(p1: THREE.Vector3, vertex: THREE.Vector3, p2: THREE.Vector3) {
  const v1 = p1.clone().sub(vertex).normalize();
  const v2 = p2.clone().sub(vertex).normalize();
  const bisector = v1.clone().add(v2).normalize();
  
  if (bisector.length() === 0) {
    // Se os vetores são opostos, usar qualquer direção perpendicular
    const perpDirection = new THREE.Vector3(-v1.z, v1.y, v1.x).normalize();
    bisector.copy(perpDirection);
  }
  
  const startPoint = vertex.clone().add(bisector.clone().multiplyScalar(-3));
  const endPoint = vertex.clone().add(bisector.clone().multiplyScalar(3));
  
  return { start: startPoint, end: endPoint };
}

export function GeometricConstructions({
  params,
  style,
  selectedVertices,
  constructionType,
  showConstruction,
  onVertexSelect,
  onClearSelection,
  constructions = []
}: GeometricConstructionsProps) {
  const vertexPositions = useMemo(() => getVertexPositions(params), [params]);
  
  const selectedPoints = useMemo(() => {
    return selectedVertices.map(index => vertexPositions[index]).filter(Boolean);
  }, [selectedVertices, vertexPositions]);

  const constructionGeometry = useMemo(() => {
    if (!showConstruction || !constructionType || selectedPoints.length < 2) return null;

    switch (constructionType) {
      case 'reta-perpendicular':
        if (selectedPoints.length >= 3) {
          return calculatePerpendicular(selectedPoints[0], selectedPoints[1], selectedPoints[2]);
        }
        break;
      
      case 'reta-paralela':
        if (selectedPoints.length >= 3) {
          return calculateParallel(selectedPoints[0], selectedPoints[1], selectedPoints[2]);
        }
        break;
      
      case 'mediatriz':
        if (selectedPoints.length >= 2) {
          return calculateBisector(selectedPoints[0], selectedPoints[1]);
        }
        break;
      
      case 'bissetriz':
        if (selectedPoints.length >= 3) {
          return calculateAngleBisector(selectedPoints[0], selectedPoints[1], selectedPoints[2]);
        }
        break;
      
      case 'reta-tangente':
        // Implementação básica de reta tangente (pode ser expandida)
        if (selectedPoints.length >= 2) {
          const direction = selectedPoints[1].clone().sub(selectedPoints[0]).normalize();
          const startPoint = selectedPoints[0].clone().add(direction.clone().multiplyScalar(-3));
          const endPoint = selectedPoints[0].clone().add(direction.clone().multiplyScalar(3));
          return { start: startPoint, end: endPoint };
        }
        break;
      
      case 'ponto-medio':
        if (selectedPoints.length >= 2) {
          return calculateMidpoint(selectedPoints[0], selectedPoints[1]);
        }
        break;
      
      case 'segmento-reta':
        if (selectedPoints.length >= 2) {
          return calculateLineSegment(selectedPoints[0], selectedPoints[1]);
        }
        break;
    }
    
    return null;
  }, [selectedPoints, constructionType, showConstruction]);

  const handleVertexClick = (vertexIndex: number) => {
    if (onVertexSelect) {
      onVertexSelect(vertexIndex, vertexPositions[vertexIndex]);
    }
  };

  const isVertexSelected = (index: number) => {
    return selectedVertices.includes(index);
  };

  const getRequiredPoints = () => {
    switch (constructionType) {
      case 'mediatriz': 
      case 'ponto-medio':
      case 'segmento-reta': return 2;
      case 'reta-perpendicular':
      case 'reta-paralela':
      case 'bissetriz': return 3;
      case 'reta-tangente': return 2;
      default: return 2;
    }
  };

  const getInstructionText = () => {
    const required = getRequiredPoints();
    const remaining = required - selectedPoints.length;
    
    if (remaining > 0) {
      switch (constructionType) {
        case 'reta-perpendicular':
          return `Selecione ${remaining === 3 ? 'dois pontos do segmento e um ponto externo' : remaining === 2 ? 'um ponto externo' : 'mais um ponto'} para reta perpendicular`;
        case 'reta-paralela':
          return `Selecione ${remaining === 3 ? 'dois pontos da reta e um ponto externo' : remaining === 2 ? 'um ponto externo' : 'mais um ponto'} para reta paralela`;
        case 'mediatriz':
          return `Selecione ${remaining} ponto${remaining > 1 ? 's' : ''} para mediatriz`;
        case 'bissetriz':
          return `Selecione ${remaining === 3 ? 'três pontos (vértice do ângulo no meio)' : remaining === 2 ? 'dois pontos' : 'mais um ponto'} para bissetriz`;
        case 'reta-tangente':
          return `Selecione ${remaining} ponto${remaining > 1 ? 's' : ''} para reta tangente`;
        case 'ponto-medio':
          return `Selecione ${remaining} ponto${remaining > 1 ? 's' : ''} para obter ponto médio`;
        case 'segmento-reta':
          return `Selecione ${remaining} ponto${remaining > 1 ? 's' : ''} para criar segmento de reta`;
        default:
          return `Selecione ${remaining} ponto${remaining > 1 ? 's' : ''}`;
      }
    }
    
    return '';
  };

  return (
    <group>
      {/* Renderizar vértices clicáveis */}
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
      
      {/* Renderizar pontos selecionados com números */}
      {selectedPoints.map((point, index) => (
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
      
      {/* Renderizar construções existentes */}
      {constructions.map((construction) => {
        const constructionPoints = construction.vertices.map(index => vertexPositions[index]).filter(Boolean);
        if (constructionPoints.length < 2) return null;

        let geometry = null;
        switch (construction.type) {
          case 'reta-perpendicular':
            if (constructionPoints.length >= 3) {
              geometry = calculatePerpendicular(constructionPoints[0], constructionPoints[1], constructionPoints[2]);
            }
            break;
          case 'reta-paralela':
            if (constructionPoints.length >= 3) {
              geometry = calculateParallel(constructionPoints[0], constructionPoints[1], constructionPoints[2]);
            }
            break;
          case 'mediatriz':
            if (constructionPoints.length >= 2) {
              geometry = calculateBisector(constructionPoints[0], constructionPoints[1]);
            }
            break;
          case 'bissetriz':
            if (constructionPoints.length >= 3) {
              geometry = calculateAngleBisector(constructionPoints[0], constructionPoints[1], constructionPoints[2]);
            }
            break;
          case 'reta-tangente':
            if (constructionPoints.length >= 2) {
              const direction = constructionPoints[1].clone().sub(constructionPoints[0]).normalize();
              const startPoint = constructionPoints[0].clone().add(direction.clone().multiplyScalar(-3));
              const endPoint = constructionPoints[0].clone().add(direction.clone().multiplyScalar(3));
              geometry = { start: startPoint, end: endPoint };
            }
            break;
          case 'ponto-medio':
            if (constructionPoints.length >= 2) {
              geometry = calculateMidpoint(constructionPoints[0], constructionPoints[1]);
            }
            break;
          case 'segmento-reta':
            if (constructionPoints.length >= 2) {
              geometry = calculateLineSegment(constructionPoints[0], constructionPoints[1]);
            }
            break;
        }

        if (!geometry) return null;

        return (
          <group key={construction.id}>
            {/* Linha principal */}
            {'start' in geometry && 'end' in geometry && (
              <Line
                points={[geometry.start, geometry.end]}
                color={construction.color}
                lineWidth={2}
                dashed={construction.type === 'mediatriz' || construction.type === 'bissetriz'}
              />
            )}
            
            {/* Ponto médio */}
            {'midpoint' in geometry && (
              <mesh position={geometry.midpoint}>
                <sphereGeometry args={[0.08]} />
                <meshBasicMaterial color={construction.color} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Renderizar a construção atual em desenvolvimento */}
      {constructionGeometry && (
        <group>
          {/* Linha principal - apenas para construções que têm start/end */}
          {'start' in constructionGeometry && 'end' in constructionGeometry && (
            <Line
              points={[constructionGeometry.start, constructionGeometry.end]}
              color={style.planeColor}
              lineWidth={2}
            />
          )}
          
          {/* Ponto médio para mediatriz e ponto-medio */}
          {'midpoint' in constructionGeometry && (
            <mesh position={constructionGeometry.midpoint}>
              <sphereGeometry args={[0.08]} />
              <meshBasicMaterial color={style.planeColor} />
            </mesh>
          )}
        </group>
      )}
      
      {/* Instruções */}
      {constructionType && getInstructionText() && (
        <Text
          position={[0, 6, 0]}
          fontSize={0.25}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {getInstructionText()}
        </Text>
      )}
      
      {/* Botão para limpar seleção */}
      {selectedPoints.length > 0 && onClearSelection && (
        <mesh 
          position={[5, 5, 0]} 
          onClick={onClearSelection}
        >
          <boxGeometry args={[2, 0.5, 0.1]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      )}
    </group>
  );
}

export default GeometricConstructions;