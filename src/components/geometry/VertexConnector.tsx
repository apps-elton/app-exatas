import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { GeometryParams } from '@/types/geometry';

interface VertexConnectorProps {
  params: GeometryParams;
  showVertexConnections: boolean;
  selectedVertices?: number[];
  onVertexSelect?: (vertexIndex: number, position?: THREE.Vector3) => void;
  onClearSelection?: () => void;
  edgeColor?: string;
  vertexColor?: string;
  selectedVertexColor?: string;
  connectionType?: 'meridian' | 'general';
  lineWidth?: number;
  vertexPositions?: THREE.Vector3[];
  showVerticesOnly?: boolean; // Novo: mostrar apenas vértices sem conexões
  hideVertices?: boolean; // Novo: ocultar vértices completamente
  connections?: Array<{ // Conexões criadas
    id: string;
    type: string;
    vertices: number[];
    color: string;
  }>;
  midpoints?: THREE.Vector3[]; // Novo: pontos médios para incluir como vértices
}

export function VertexConnector({ 
  params, 
  showVertexConnections, 
  selectedVertices = [],
  onVertexSelect,
  onClearSelection,
  edgeColor = "#00ff00",
  vertexColor = "#00ffff", 
  selectedVertexColor = "#ff0000",
  connectionType = 'general',
  lineWidth = 2,
  vertexPositions = [],
  showVerticesOnly = false,
  hideVertices = false,
  connections = [],
  midpoints = []
}: VertexConnectorProps) {
  const { t } = useTranslation();
  const [intersectionPoints, setIntersectionPoints] = useState<THREE.Vector3[]>([]);
  const [persistentIntersections, setPersistentIntersections] = useState<THREE.Vector3[]>([]);

  // Se não deve mostrar nada, retornar null
  if (!showVertexConnections) return null;
  
  // Lista de geometrias suportadas
  const supportedGeometries = [
    'cube', 'prism', 'pyramid', 'tetrahedron', 'octahedron', 
    'dodecahedron', 'icosahedron', 'cylinder', 'cone'
  ];
  
  if (!supportedGeometries.includes(params.type)) return null;

  const getVertices = (): THREE.Vector3[] => {
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
        const r = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
        
        // Base inferior
        for (let i = 0; i < numSides; i++) {
          const angle = (i * 2 * Math.PI) / numSides;
          vertices.push(new THREE.Vector3(r * Math.cos(angle), 0, r * Math.sin(angle)));
        }
        
        // Base superior
        for (let i = 0; i < numSides; i++) {
          const angle = (i * 2 * Math.PI) / numSides;
          vertices.push(new THREE.Vector3(r * Math.cos(angle), height, r * Math.sin(angle)));
        }
        break;
      }
      
      case 'pyramid': {
        const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
        const r = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
        
        // Base
        for (let i = 0; i < numSides; i++) {
          const angle = (i * 2 * Math.PI) / numSides;
          vertices.push(new THREE.Vector3(r * Math.cos(angle), 0, r * Math.sin(angle)));
        }
        
        // Ápice
        vertices.push(new THREE.Vector3(0, height, 0));
        break;
      }
      
      case 'tetrahedron': {
        const { sideLength = 2 } = params;
        const a = sideLength;
        const height = a * Math.sqrt(2/3);
        const r = a / Math.sqrt(3);
        
        vertices.push(
          new THREE.Vector3(r, 0, 0),
          new THREE.Vector3(-r/2, 0, r * Math.sqrt(3)/2),
          new THREE.Vector3(-r/2, 0, -r * Math.sqrt(3)/2),
          new THREE.Vector3(0, height, 0)
        );
        break;
      }
      
      case 'octahedron': {
        const { sideLength = 2 } = params;
        const scale = sideLength / Math.sqrt(2);
        const offset = scale;
        
        vertices.push(
          new THREE.Vector3(scale, offset, 0),
          new THREE.Vector3(-scale, offset, 0),
          new THREE.Vector3(0, offset, scale),
          new THREE.Vector3(0, offset, -scale),
          new THREE.Vector3(0, offset + scale, 0),
          new THREE.Vector3(0, 0, 0)
        );
        break;
      }
      
      case 'dodecahedron': {
        const { sideLength = 2 } = params;
        const radius = sideLength * (Math.sqrt(3) * (1 + Math.sqrt(5))) / 4;
        const geometry = new THREE.DodecahedronGeometry(radius);
        geometry.translate(0, radius, 0);
        
        const uniqueVertices = new Map<string, THREE.Vector3>();
        const positions = geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
          const vertex = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
          const key = `${vertex.x.toFixed(4)},${vertex.y.toFixed(4)},${vertex.z.toFixed(4)}`;
          if (!uniqueVertices.has(key)) {
            uniqueVertices.set(key, vertex);
          }
        }
        
        vertices.push(...Array.from(uniqueVertices.values()));
        break;
      }
      
      case 'icosahedron': {
        const { sideLength = 2 } = params;
        const phi = (1 + Math.sqrt(5)) / 2; // Número áureo
        const radius = (sideLength * phi) / (2 * Math.sin(Math.PI / 5));
        
        // Usar vértices manuais para garantir consistência
        const scale = radius / Math.sqrt(phi * phi + 1);
        
        const vertexCoords = [
          [0, 1, phi], [0, 1, -phi], [0, -1, phi], [0, -1, -phi],
          [1, phi, 0], [1, -phi, 0], [-1, phi, 0], [-1, -phi, 0],
          [phi, 0, 1], [phi, 0, -1], [-phi, 0, 1], [-phi, 0, -1]
        ];
        
        vertexCoords.forEach(([x, y, z]) => {
          vertices.push(new THREE.Vector3(x * scale, y * scale + radius, z * scale));
        });
        break;
      }
      
      case 'cylinder': {
        const { height = 4, radius = 2 } = params;
        const segments = 8;
        
        // Base inferior
        for (let i = 0; i < segments; i++) {
          const angle = (i * 2 * Math.PI) / segments;
          vertices.push(new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle)));
        }
        
        // Base superior
        for (let i = 0; i < segments; i++) {
          const angle = (i * 2 * Math.PI) / segments;
          vertices.push(new THREE.Vector3(radius * Math.cos(angle), height, radius * Math.sin(angle)));
        }
        break;
      }
      
      case 'cone': {
        const { height = 4, radius = 2 } = params;
        const segments = 8;
        
        // Base
        for (let i = 0; i < segments; i++) {
          const angle = (i * 2 * Math.PI) / segments;
          vertices.push(new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle)));
        }
        
        // Ápice
        vertices.push(new THREE.Vector3(0, height, 0));
        break;
      }
    }
    
    // Adicionar pontos médios à lista de vértices
    vertices.push(...midpoints);
    
    return vertices;
  };

  const vertices = getVertices();

  // Calcular intersecção entre duas linhas 3D
  const getLineIntersection = (
    line1Start: THREE.Vector3, 
    line1End: THREE.Vector3, 
    line2Start: THREE.Vector3, 
    line2End: THREE.Vector3
  ): THREE.Vector3 | null => {
    const dir1 = line1End.clone().sub(line1Start).normalize();
    const dir2 = line2End.clone().sub(line2Start).normalize();
    
    const cross = dir1.clone().cross(dir2);
    if (cross.length() < 0.0001) return null;
    
    const w0 = line1Start.clone().sub(line2Start);
    const a = dir1.dot(dir1);
    const b = dir1.dot(dir2);
    const c = dir2.dot(dir2);
    const d = dir1.dot(w0);
    const e = dir2.dot(w0);
    
    const denom = a * c - b * b;
    if (Math.abs(denom) < 0.0001) return null;
    
    const t1 = (b * e - c * d) / denom;
    const t2 = (a * e - b * d) / denom;
    
    if (t1 < 0 || t1 > 1 || t2 < 0 || t2 > 1) return null;
    
    const p1 = line1Start.clone().add(dir1.clone().multiplyScalar(t1 * line1Start.distanceTo(line1End)));
    const p2 = line2Start.clone().add(dir2.clone().multiplyScalar(t2 * line2Start.distanceTo(line2End)));
    
    if (p1.distanceTo(p2) > 0.1) return null;
    
    return p1.clone().add(p2).multiplyScalar(0.5);
  };

  const areVectorsPerpendicular = (v1: THREE.Vector3, v2: THREE.Vector3, tolerance = 0.01): boolean => {
    const dotProduct = v1.normalize().dot(v2.normalize());
    return Math.abs(dotProduct) < tolerance;
  };

  const createRightAngleIndicator = (point: THREE.Vector3, dir1: THREE.Vector3, dir2: THREE.Vector3) => {
    const size = 0.3;
    const indicators = [];
    
    const v1 = dir1.clone().normalize().multiplyScalar(size);
    const v2 = dir2.clone().normalize().multiplyScalar(size);
    
    const corner1 = point.clone().add(v1);
    const corner2 = point.clone().add(v2);
    const corner3 = point.clone().add(v1).add(v2);
    
    // Criar linhas do indicador de ângulo reto
    const lines = [
      [point, corner1],
      [point, corner2],
      [corner1, corner3],
      [corner2, corner3]
    ];
    
    lines.forEach((line, index) => {
      const curve = new THREE.LineCurve3(line[0], line[1]);
      const tube = new THREE.TubeGeometry(curve, 1, 0.01, 4, false);
      
      indicators.push(
        <mesh key={`right-angle-${index}`} geometry={tube} renderOrder={3}>
          <meshBasicMaterial color="#ffff00" />
        </mesh>
      );
    });
    
    return indicators;
  };

  const renderConnections = () => {
    console.log('=== RENDER CONNECTIONS DEBUG ===');
    console.log('Selected Vertices:', selectedVertices);
    console.log('Connection Type:', connectionType);
    console.log('Show Vertices Only:', showVerticesOnly);
    console.log('Hide Vertices:', hideVertices);
    
    if (showVerticesOnly || hideVertices) return [];
    
    const connections = [];
    const segments = [];
    const newIntersections: THREE.Vector3[] = [];
    const rightAngleIndicators = [];
    const allAvailableVertices = [...vertices, ...persistentIntersections];
    
    // Conectar vértices sequencialmente (cada vértice com o próximo)
    for (let i = 0; i < selectedVertices.length - 1; i++) {
      const startVertexIndex = selectedVertices[i];
      const endVertexIndex = selectedVertices[i + 1];
      
      const startVertex = allAvailableVertices[startVertexIndex];
      const endVertex = allAvailableVertices[endVertexIndex];
      
      console.log(`Connecting vertices: ${startVertexIndex} -> ${endVertexIndex}`);
      console.log('Start Vertex:', startVertex);
      console.log('End Vertex:', endVertex);
      
      if (startVertex && endVertex) {
        const segmentDirection = endVertex.clone().sub(startVertex);
        segments.push({ start: startVertex, end: endVertex, direction: segmentDirection });
        
        // Criar linha de conexão mais simples usando LineSegments
        const geometry = new THREE.BufferGeometry().setFromPoints([startVertex, endVertex]);
        
        const connectionColor = connectionType === 'meridian' ? edgeColor : "#00ff00";
        
        connections.push(
          <lineSegments key={`connection-${i}`} geometry={geometry} renderOrder={2}>
            <lineBasicMaterial color={connectionColor} linewidth={3} />
          </lineSegments>
        );
        
        console.log(`Conexão criada entre vértices ${startVertexIndex} e ${endVertexIndex}`);
      } else {
        console.warn(`Não foi possível conectar vértices: ${startVertexIndex} -> ${endVertexIndex}`);
        console.warn('Start vertex exists:', !!startVertex);
        console.warn('End vertex exists:', !!endVertex);
        console.warn('All available vertices:', allAvailableVertices.length);
      }
    }
    
    // Calcular intersecções
    if (segments.length >= 2) {
      for (let i = 0; i < segments.length; i++) {
        for (let j = i + 1; j < segments.length; j++) {
          const intersection = getLineIntersection(
            segments[i].start, segments[i].end,
            segments[j].start, segments[j].end
          );
          
          if (intersection) {
            const distToStart1 = intersection.distanceTo(segments[i].start);
            const distToEnd1 = intersection.distanceTo(segments[i].end);
            const distToStart2 = intersection.distanceTo(segments[j].start);
            const distToEnd2 = intersection.distanceTo(segments[j].end);
            
            const isDuplicate = allAvailableVertices.some(vertex => 
              vertex.distanceTo(intersection) < 0.1
            );
            
            const minDistance = 0.2;
            if (distToStart1 > minDistance && distToEnd1 > minDistance && 
                distToStart2 > minDistance && distToEnd2 > minDistance && !isDuplicate) {
              
              newIntersections.push(intersection);
              const intersectionIndex = allAvailableVertices.length + newIntersections.indexOf(intersection);
              
              // Adicionar indicador de ângulo reto se aplicável
              if (areVectorsPerpendicular(segments[i].direction, segments[j].direction)) {
                const indicators = createRightAngleIndicator(
                  intersection, 
                  segments[i].direction, 
                  segments[j].direction
                );
                rightAngleIndicators.push(...indicators);
              }
              
              // Ponto de intersecção clicável
              connections.push(
                <mesh 
                  key={`intersection-${i}-${j}`} 
                  position={intersection}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPersistentIntersections(prev => {
                      if (!prev.some(p => p.distanceTo(intersection) < 0.1)) {
                        return [...prev, intersection];
                      }
                      return prev;
                    });
                    onVertexSelect?.(intersectionIndex, intersection);
                  }}
                  renderOrder={3}
                >
                  <sphereGeometry args={[0.06]} />
                  <meshBasicMaterial color="#ff00ff" />
                </mesh>
              );
            }
          }
        }
      }
    }
    
    return [...connections, ...rightAngleIndicators];
  };

  // Renderizar vértices clicáveis
  const renderSelectableVertices = () => {
    if (hideVertices) return [];
    
    const vertexElements = [];
    
    console.log('=== RENDER VERTICES DEBUG ===');
    console.log('Show Vertex Connections:', showVertexConnections);
    console.log('Vertices available:', vertices.length);
    console.log('Selected vertices:', selectedVertices);
    console.log('Vertex color:', vertexColor);
    console.log('Selected vertex color:', selectedVertexColor);
    
    // Vértices originais
    vertices.forEach((vertex, index) => {
      const isSelected = selectedVertices.includes(index);
      console.log(`Vertex ${index}:`, vertex, 'Selected:', isSelected);
      
      vertexElements.push(
        <group key={`vertex-group-${index}`}>
          <mesh 
            position={vertex}
            onClick={(e) => {
              e.stopPropagation();
              console.log(`=== VERTEX CLICKED ===`);
              console.log(`Clicked vertex ${index} at position:`, vertex);
              console.log('onVertexSelect function exists:', !!onVertexSelect);
              onVertexSelect?.(index, vertex);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              // Mudar cursor para pointer
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              // Restaurar cursor
              document.body.style.cursor = 'default';
            }}
            renderOrder={4}
          >
            <sphereGeometry args={[0.08]} />
            <meshBasicMaterial 
              color={isSelected ? selectedVertexColor : vertexColor}
              transparent
              opacity={0.9}
            />
          </mesh>
        </group>
      );
    });
    
    // Intersecções persistentes
    persistentIntersections.forEach((intersection, index) => {
      const globalIndex = vertices.length + index;
      vertexElements.push(
        <group key={`persistent-intersection-${index}`}>
          <mesh 
            position={intersection}
            onClick={(e) => {
              e.stopPropagation();
              onVertexSelect?.(globalIndex, intersection);
            }}
            renderOrder={4}
          >
            <sphereGeometry args={[0.06]} />
            <meshBasicMaterial 
              color={selectedVertices.includes(globalIndex) ? selectedVertexColor : "#ff99ff"}
              transparent
              opacity={0.9}
            />
          </mesh>
        </group>
      );
    });
    
    return vertexElements;
  };

  // Botão de limpar seleção
  const renderClearButton = () => {
    if (!onClearSelection || selectedVertices.length === 0) return null;
    
    return (
      <group>
        <mesh 
          position={[0, -2, 0]} 
          onClick={(e) => {
            e.stopPropagation();
            onClearSelection();
            setPersistentIntersections([]); // Limpar intersecções também
          }}
          renderOrder={10}
        >
          <boxGeometry args={[2, 0.5, 0.1]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        <Text
          position={[0, -2, 0.06]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          renderOrder={11}
        >
          {t('button.clear_selection')}
        </Text>
      </group>
    );
  };

  // Renderizar conexões criadas
  const renderCreatedConnections = () => {
    console.log('=== RENDER CREATED CONNECTIONS DEBUG ===');
    console.log('Connections:', connections);
    console.log('Vertices:', vertices);
    
    return connections.map((connection, index) => {
      if (connection.vertices.length < 2) return null;
      
      const startVertex = vertices[connection.vertices[0]];
      const endVertex = vertices[connection.vertices[1]];
      
      console.log(`Rendering connection ${index}:`, connection);
      console.log('Start vertex:', startVertex);
      console.log('End vertex:', endVertex);
      
      if (!startVertex || !endVertex) {
        console.warn(`Cannot render connection ${index} - invalid vertices`);
        return null;
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints([startVertex, endVertex]);
      
      return (
        <lineSegments key={`created-connection-${connection.id}`} geometry={geometry} renderOrder={2}>
          <lineBasicMaterial color={connection.color} linewidth={3} />
        </lineSegments>
      );
    });
  };

  return (
    <group name="vertex-connector-group">
      {renderSelectableVertices()}
      {renderConnections()}
      {renderCreatedConnections()}
      {renderClearButton()}
      
      {/* Indicadores de status removidos para melhor UX */}
    </group>
  );
}

export default VertexConnector;