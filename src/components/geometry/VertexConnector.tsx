import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
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
}

export function VertexConnector({ 
  params, 
  showVertexConnections, 
  selectedVertices = [],
  onVertexSelect,
  onClearSelection,
  edgeColor = "#ff0000",
  vertexColor = "#00ffff", 
  selectedVertexColor = "#ff0000",
  connectionType = 'general',
  lineWidth = 1,
  vertexPositions = []
}: VertexConnectorProps) {
  const [intersectionPoints, setIntersectionPoints] = useState<THREE.Vector3[]>([]);
  const [persistentIntersections, setPersistentIntersections] = useState<THREE.Vector3[]>([]);

  if (!showVertexConnections || !['cube', 'prism', 'pyramid', 'tetrahedron', 'octahedron', 'dodecahedron', 'icosahedron', 'cylinder', 'cone'].includes(params.type)) return null;

  const getVertices = (): THREE.Vector3[] => {
    const vertices: THREE.Vector3[] = [];
    
    if (params.type === 'cube') {
      const size = params.sideLength || 2;
      const half = size / 2;
      
      // 8 vértices do cubo (base em y=0)
      vertices.push(
        new THREE.Vector3(-half, 0, -half),      // 0
        new THREE.Vector3(half, 0, -half),       // 1
        new THREE.Vector3(half, 0, half),        // 2
        new THREE.Vector3(-half, 0, half),       // 3
        new THREE.Vector3(-half, size, -half),   // 4
        new THREE.Vector3(half, size, -half),    // 5
        new THREE.Vector3(half, size, half),     // 6
        new THREE.Vector3(-half, size, half)     // 7
      );
    } else if (params.type === 'prism') {
      const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
      const n = numSides;
      const r = baseEdgeLength / (2 * Math.sin(Math.PI / n));
      
      // Vértices da base inferior
      for (let i = 0; i < n; i++) {
        const angle = (i * 2 * Math.PI) / n;
        vertices.push(new THREE.Vector3(r * Math.cos(angle), 0, r * Math.sin(angle)));
      }
      
      // Vértices da base superior
      for (let i = 0; i < n; i++) {
        const angle = (i * 2 * Math.PI) / n;
        vertices.push(new THREE.Vector3(r * Math.cos(angle), height, r * Math.sin(angle)));
      }
    } else if (params.type === 'pyramid') {
      const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
      const n = numSides;
      const r = baseEdgeLength / (2 * Math.sin(Math.PI / n));
      
      // Vértices da base
      for (let i = 0; i < n; i++) {
        const angle = (i * 2 * Math.PI) / n;
        vertices.push(new THREE.Vector3(r * Math.cos(angle), 0, r * Math.sin(angle)));
      }
      
      // Ápice da pirâmide
      vertices.push(new THREE.Vector3(0, height, 0));
    } else if (params.type === 'tetrahedron') {
      const { sideLength = 2 } = params;
      const a = sideLength;
      const height = a * Math.sqrt(2/3);
      const r = a / Math.sqrt(3);
      
      // Vértices da base triangular
      vertices.push(new THREE.Vector3(r, 0, 0));                      // 0
      vertices.push(new THREE.Vector3(-r/2, 0, r * Math.sqrt(3)/2));  // 1
      vertices.push(new THREE.Vector3(-r/2, 0, -r * Math.sqrt(3)/2)); // 2
      
      // Vértice do topo
      vertices.push(new THREE.Vector3(0, height, 0));                 // 3
    } else if (params.type === 'octahedron') {
      const { sideLength = 2 } = params;
      const a = sideLength;
      
      // Vértices do octaedro regular (escalados e posicionados)
      const scaleFactor = a / Math.sqrt(2);
      const offset = scaleFactor;
      
      vertices.push(
        new THREE.Vector3(scaleFactor, offset, 0),     // 0
        new THREE.Vector3(-scaleFactor, offset, 0),    // 1  
        new THREE.Vector3(0, offset, scaleFactor),     // 2
        new THREE.Vector3(0, offset, -scaleFactor),    // 3
        new THREE.Vector3(0, offset + scaleFactor, 0), // 4 (topo)
        new THREE.Vector3(0, 0, 0)                     // 5 (base)
      );
    } else if (params.type === 'dodecahedron') {
      // Usar geometria Three.js para obter vértices únicos
      const { sideLength = 2 } = params;
      const radius = sideLength * (Math.sqrt(3) * (1 + Math.sqrt(5))) / 4;
      const geometry = new THREE.DodecahedronGeometry(radius);
      
      // Aplicar mesmo offset que na geometria principal
      geometry.translate(0, radius, 0);
      
      // Extrair apenas vértices únicos
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
      
    } else if (params.type === 'icosahedron') {
      // Usar geometria Three.js para obter vértices únicos
      const { sideLength = 2 } = params;
      const phi = (1 + Math.sqrt(5)) / 2;
      const radius = (sideLength * phi) / (2 * Math.sin(Math.PI / 5));
      const geometry = new THREE.IcosahedronGeometry(radius);
      
      // Aplicar mesmo offset que na geometria principal
      geometry.translate(0, radius, 0);
      
      // Extrair apenas vértices únicos
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
    } else if (params.type === 'cylinder') {
      const { height = 4, radius = 2 } = params;
      const segments = 8; // Reduzido de 16 para 8 segmentos
      
      // Vértices da base inferior
      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        vertices.push(new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle)));
      }
      
      // Vértices da base superior
      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        vertices.push(new THREE.Vector3(radius * Math.cos(angle), height, radius * Math.sin(angle)));
      }
    } else if (params.type === 'cone') {
      const { height = 4, radius = 2 } = params;
      const segments = 8; // Reduzido de 16 para 8 segmentos
      
      // Vértices da base
      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        vertices.push(new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle)));
      }
      
      // Ápice do cone
      vertices.push(new THREE.Vector3(0, height, 0));
    }
    
    return vertices;
  };

  const vertices = getVertices();

  // Função para calcular intersecção entre duas linhas 3D
  const getLineIntersection = (line1Start: THREE.Vector3, line1End: THREE.Vector3, line2Start: THREE.Vector3, line2End: THREE.Vector3): THREE.Vector3 | null => {
    // Usar geometria 3D real em vez de projeção 2D
    const dir1 = line1End.clone().sub(line1Start).normalize();
    const dir2 = line2End.clone().sub(line2Start).normalize();
    
    // Verificar se as linhas são paralelas
    const cross = dir1.clone().cross(dir2);
    if (cross.length() < 0.0001) return null; // Linhas paralelas
    
    // Calcular o ponto mais próximo entre as duas linhas
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
    
    // Verificar se os parâmetros estão dentro dos segmentos
    if (t1 < 0 || t1 > 1 || t2 < 0 || t2 > 1) return null;
    
    // Calcular os pontos mais próximos em cada linha
    const p1 = line1Start.clone().add(dir1.clone().multiplyScalar(t1 * line1Start.distanceTo(line1End)));
    const p2 = line2Start.clone().add(dir2.clone().multiplyScalar(t2 * line2Start.distanceTo(line2End)));
    
    // Se as linhas realmente se intersectam, os pontos devem ser muito próximos
    if (p1.distanceTo(p2) > 0.1) return null;
    
    // Retornar o ponto médio como intersecção
    return p1.clone().add(p2).multiplyScalar(0.5);
  };

  // Função para verificar se dois vetores são perpendiculares
  const areVectorsPerpendicular = (v1: THREE.Vector3, v2: THREE.Vector3, tolerance = 0.01): boolean => {
    const dotProduct = v1.normalize().dot(v2.normalize());
    return Math.abs(dotProduct) < tolerance;
  };

  // Função para criar indicador de ângulo reto
  const createRightAngleIndicator = (point: THREE.Vector3, dir1: THREE.Vector3, dir2: THREE.Vector3) => {
    const size = 0.3;
    const group = [];
    
    // Criar duas linhas perpendiculares para formar o símbolo de ângulo reto
    const v1 = dir1.clone().normalize().multiplyScalar(size);
    const v2 = dir2.clone().normalize().multiplyScalar(size);
    
    // Ponto de encontro + primeira direção
    const corner1 = point.clone().add(v1);
    // Ponto de encontro + segunda direção  
    const corner2 = point.clone().add(v2);
    // Fechar o quadrado do ângulo reto
    const corner3 = point.clone().add(v1).add(v2);
    
    // Linha 1: do ponto ao corner1
    const curve1 = new THREE.LineCurve3(point, corner1);
    const tube1 = new THREE.TubeGeometry(curve1, 1, 0.01, 4, false);
    
    // Linha 2: do ponto ao corner2
    const curve2 = new THREE.LineCurve3(point, corner2);
    const tube2 = new THREE.TubeGeometry(curve2, 1, 0.01, 4, false);
    
    // Linha 3: de corner1 ao corner3
    const curve3 = new THREE.LineCurve3(corner1, corner3);
    const tube3 = new THREE.TubeGeometry(curve3, 1, 0.01, 4, false);
    
    // Linha 4: de corner2 ao corner3
    const curve4 = new THREE.LineCurve3(corner2, corner3);
    const tube4 = new THREE.TubeGeometry(curve4, 1, 0.01, 4, false);
    
    return [
      <mesh key="right-angle-1" geometry={tube1}>
        <meshBasicMaterial color="#ffff00" />
      </mesh>,
      <mesh key="right-angle-2" geometry={tube2}>
        <meshBasicMaterial color="#ffff00" />
      </mesh>,
      <mesh key="right-angle-3" geometry={tube3}>
        <meshBasicMaterial color="#ffff00" />
      </mesh>,
      <mesh key="right-angle-4" geometry={tube4}>
        <meshBasicMaterial color="#ffff00" />
      </mesh>
    ];
  };

  const renderConnections = () => {
    const connections = [];
    const segments = [];
    const newIntersections: THREE.Vector3[] = [];
    const rightAngleIndicators = [];
    const allAvailableVertices = [...vertices, ...persistentIntersections];
    
    // Conectar vértices em pares usando posições corretas (incluindo intersecções persistentes)
    for (let i = 0; i < selectedVertices.length; i += 2) {
      if (i + 1 < selectedVertices.length) {
        let startVertex: THREE.Vector3 | undefined;
        let endVertex: THREE.Vector3 | undefined;
        
        // Obter vértices de índices (originais + intersecções persistentes)
        if (selectedVertices[i] < allAvailableVertices.length) {
          startVertex = allAvailableVertices[selectedVertices[i]];
        }
        
        if (selectedVertices[i + 1] < allAvailableVertices.length) {
          endVertex = allAvailableVertices[selectedVertices[i + 1]];
        }
        
        if (startVertex && endVertex) {
          // Armazenar segmento para cálculo de intersecção
          const segmentDirection = endVertex.clone().sub(startVertex);
          segments.push({ start: startVertex, end: endVertex, direction: segmentDirection });
          
          // Usar TubeGeometry para criar linhas com espessura visível
          const curve = new THREE.LineCurve3(startVertex, endVertex);
          const tubeGeometry = new THREE.TubeGeometry(
            curve, 
            1, // segments
            Math.max(0.005, lineWidth * 0.01), // radius baseado na espessura
            8, // radial segments
            false // closed
          );
          
          // Usar cor específica para conexões, independente da cor das arestas
          const connectionColor = connectionType === 'meridian' ? edgeColor : "#00ff00"; // Verde para conexões gerais
          
          connections.push(
            <mesh key={`connection-${i/2}`} geometry={tubeGeometry}>
              <meshBasicMaterial color={connectionColor} />
            </mesh>
          );
        }
      }
    }
    
    // Calcular intersecções apenas se há pelo menos 2 segmentos válidos
    if (segments.length >= 2) {
      for (let i = 0; i < segments.length; i++) {
        for (let j = i + 1; j < segments.length; j++) {
          const intersection = getLineIntersection(
            segments[i].start, segments[i].end,
            segments[j].start, segments[j].end
          );
          
          if (intersection) {
            // Verificar se a intersecção está suficientemente longe das extremidades dos segmentos
            const distToStart1 = intersection.distanceTo(segments[i].start);
            const distToEnd1 = intersection.distanceTo(segments[i].end);
            const distToStart2 = intersection.distanceTo(segments[j].start);
            const distToEnd2 = intersection.distanceTo(segments[j].end);
            
            // Verificar se já existe uma intersecção muito próxima (evitar duplicatas)
            const isDuplicate = allAvailableVertices.some(vertex => 
              vertex.distanceTo(intersection) < 0.1
            );
            
            // Apenas adicionar intersecção se não estiver muito próxima das extremidades e não for duplicata
            const minDistance = 0.2;
            if (distToStart1 > minDistance && distToEnd1 > minDistance && 
                distToStart2 > minDistance && distToEnd2 > minDistance && !isDuplicate) {
              
              newIntersections.push(intersection);
              const intersectionIndex = allAvailableVertices.length + newIntersections.indexOf(intersection);
              
              // Verificar se os segmentos são perpendiculares
              if (areVectorsPerpendicular(segments[i].direction, segments[j].direction)) {
                const rightAngleIndicator = createRightAngleIndicator(
                  intersection, 
                  segments[i].direction, 
                  segments[j].direction
                );
                rightAngleIndicators.push(...rightAngleIndicator);
              }
              
              connections.push(
                <mesh 
                  key={`intersection-${i}-${j}`} 
                  position={intersection}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Adicionar à lista persistente quando clicado
                    setPersistentIntersections(prev => {
                      if (!prev.some(p => p.distanceTo(intersection) < 0.1)) {
                        return [...prev, intersection];
                      }
                      return prev;
                    });
                    onVertexSelect?.(intersectionIndex, intersection);
                  }}
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

  // Renderizar vértices clicáveis (originais + intersecções persistentes)
  const renderSelectableVertices = () => {
    const vertexElements = [];
    
    // Vértices originais da geometria
    vertices.forEach((vertex, index) => {
      vertexElements.push(
        <mesh 
          key={`vertex-${index}`} 
          position={vertex}
          onClick={(e) => {
            e.stopPropagation();
            onVertexSelect?.(index, vertex);
          }}
        >
          <sphereGeometry args={[0.08]} />
          <meshBasicMaterial 
            color={selectedVertices.includes(index) ? selectedVertexColor : vertexColor} 
          />
        </mesh>
      );
    });
    
    // Intersecções persistentes como vértices selecionáveis
    persistentIntersections.forEach((intersection, index) => {
      const globalIndex = vertices.length + index;
      vertexElements.push(
        <mesh 
          key={`persistent-intersection-${index}`} 
          position={intersection}
          onClick={(e) => {
            e.stopPropagation();
            onVertexSelect?.(globalIndex, intersection);
          }}
        >
          <sphereGeometry args={[0.06]} />
          <meshBasicMaterial 
            color={selectedVertices.includes(globalIndex) ? selectedVertexColor : "#ff99ff"} 
          />
        </mesh>
      );
    });
    
    return vertexElements;
  };

  return (
    <group>
      {renderSelectableVertices()}
      {renderConnections()}
    </group>
  );
}