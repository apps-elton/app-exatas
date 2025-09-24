import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { GeometryParams } from '@/types/geometry';

interface SimpleVertexConnectorProps {
  params: GeometryParams;
  selectedVertices: number[];
  connections: Array<{
    id: string;
    type: string;
    vertices: number[];
    color: string;
  }>;
  onVertexSelect: (vertexIndex: number) => void;
  onClearConnections: () => void;
  onDeleteConnection?: (connectionId: string) => void;
  edgeColor?: string;
  lineWidth?: number;
  // Vértices adicionais de sólidos inscritos e circunscritos
  inscribedVertices?: THREE.Vector3[];
  circumscribedVertices?: THREE.Vector3[];
}

export function SimpleVertexConnector({
  params,
  selectedVertices,
  connections,
  onVertexSelect,
  onClearConnections,
  onDeleteConnection,
  edgeColor = '#00ff00',
  lineWidth = 4,
  inscribedVertices = [],
  circumscribedVertices = []
}: SimpleVertexConnectorProps) {
  
  const vertices = useMemo(() => {
    const vertexList: THREE.Vector3[] = [];
    
    switch (params.type) {
      case 'cube': {
        const size = params.sideLength || 2;
        const half = size / 2;
        
        vertexList.push(
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
          vertexList.push(new THREE.Vector3(r * Math.cos(angle), 0, r * Math.sin(angle)));
        }
        
        // Base superior
        for (let i = 0; i < numSides; i++) {
          const angle = (i * 2 * Math.PI) / numSides;
          vertexList.push(new THREE.Vector3(r * Math.cos(angle), height, r * Math.sin(angle)));
        }
        break;
      }
      
      case 'pyramid': {
        const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
        const r = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
        
        // Base
        for (let i = 0; i < numSides; i++) {
          const angle = (i * 2 * Math.PI) / numSides;
          vertexList.push(new THREE.Vector3(r * Math.cos(angle), 0, r * Math.sin(angle)));
        }
        
        // Ápice
        vertexList.push(new THREE.Vector3(0, height, 0));
        break;
      }
      
      case 'tetrahedron': {
        const { sideLength = 2 } = params;
        const a = sideLength;
        const height = a * Math.sqrt(2/3);
        const r = a / Math.sqrt(3);
        vertexList.push(
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
        vertexList.push(
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
          const vec = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
          uniqueVertices.set(vec.toArray().map(v => v.toFixed(3)).join(','), vec);
        }
        vertexList.push(...Array.from(uniqueVertices.values()));
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
          vertexList.push(new THREE.Vector3(x * scale, y * scale + radius, z * scale));
        });
        break;
      }
      
      case 'cylinder': {
        const { height = 4, radius = 2 } = params;
        const segments = 8; // Máximo 8 vértices
        for (let i = 0; i < segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          vertexList.push(new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle)));
        }
        for (let i = 0; i < segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          vertexList.push(new THREE.Vector3(radius * Math.cos(angle), height, radius * Math.sin(angle)));
        }
        break;
      }
      
      case 'cone': {
        const { height = 4, radius = 2 } = params;
        const segments = 8; // Máximo 8 vértices
        for (let i = 0; i < segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          vertexList.push(new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle)));
        }
        vertexList.push(new THREE.Vector3(0, height, 0)); // Apex
        break;
      }
      
      case 'sphere': {
        const { radius = 2 } = params;
        
        // SEMPRE mostrar apenas os vértices da esfera - sem verificação complexa
        const segments = 4;
        
        // Vértices no equador (círculo horizontal) - apenas 4
        for (let i = 0; i < segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          // Vértices na superfície da esfera (equador)
          vertexList.push(new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle)));
        }
        
        // Apenas os polos
        vertexList.push(new THREE.Vector3(0, radius, 0)); // Polo norte
        vertexList.push(new THREE.Vector3(0, -radius, 0)); // Polo sul
        
        break;
      }
      
      case 'icosahedron': {
        const { sideLength = 2 } = params;
        const phi = (1 + Math.sqrt(5)) / 2; // Número áureo
        const radius = (sideLength * phi) / (2 * Math.sin(Math.PI / 5));
        
        // Usar vértices manuais para garantir consistência
        const scale = radius / Math.sqrt(phi * phi + 1);
        
        const vertices = [
          [0, 1, phi], [0, 1, -phi], [0, -1, phi], [0, -1, -phi],
          [1, phi, 0], [1, -phi, 0], [-1, phi, 0], [-1, -phi, 0],
          [phi, 0, 1], [phi, 0, -1], [-phi, 0, 1], [-phi, 0, -1]
        ];
        
        vertices.forEach(([x, y, z]) => {
          vertexList.push(new THREE.Vector3(x * scale, y * scale + radius, z * scale));
        });
        break;
      }
      
      case 'octahedron': {
        const { sideLength = 2 } = params;
        const a = sideLength;
        const d = a / Math.sqrt(2);
        
        vertexList.push(
          new THREE.Vector3(d, d, 0),    // 0: +X
          new THREE.Vector3(-d, d, 0),   // 1: -X
          new THREE.Vector3(0, d + d, 0), // 2: +Y (superior)
          new THREE.Vector3(0, 0, 0),     // 3: -Y (inferior)
          new THREE.Vector3(0, d, d),     // 4: +Z
          new THREE.Vector3(0, d, -d)     // 5: -Z
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
        
        vertexList.push(...Array.from(uniqueVertices.values()));
        break;
      }
      
      default:
        console.warn('Tipo de geometria não suportado:', params.type);
    }
    
    // Adicionar vértices de sólidos inscritos e circunscritos
    const allVertices = [
      ...vertexList,
      ...inscribedVertices,
      ...circumscribedVertices
    ];
    
    return allVertices;
  }, [params, inscribedVertices, circumscribedVertices]);

  const renderVertices = () => {
    return vertices.map((vertex, index) => {
      const isSelected = selectedVertices.includes(index);
      
      return (
        <group key={`vertex-${index}`}>
          <mesh 
            position={vertex}
            onClick={(e) => {
              e.stopPropagation();
              console.log(`Clique no vértice ${index}`);
              onVertexSelect(index);
            }}
            renderOrder={10}
          >
            <sphereGeometry args={[0.08]} />
            <meshBasicMaterial 
              color={isSelected ? '#ffd700' : '#ffff00'}
              transparent
              opacity={0.9}
            />
          </mesh>
          
          {isSelected && (
            <Text
              position={[vertex.x, vertex.y + 0.3, vertex.z]}
              fontSize={0.2}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              renderOrder={11}
            >
              {selectedVertices.indexOf(index) + 1}
            </Text>
          )}
        </group>
      );
    });
  };

  const renderConnections = () => {
    return connections.map((connection, index) => {
      if (connection.vertices.length < 2) return null;
      
      const startVertex = vertices[connection.vertices[0]];
      const endVertex = vertices[connection.vertices[1]];
      
      if (!startVertex || !endVertex) {
        return null;
      }
      
      // Criar curva entre os dois pontos para usar com TubeGeometry
      const curve = new THREE.LineCurve3(startVertex, endVertex);
      
      // Usar a espessura real (convertendo para um valor adequado para TubeGeometry)
      const tubeRadius = Math.max(lineWidth * 0.02, 0.01); // Converter para raio do tubo
      const tubeGeometry = new THREE.TubeGeometry(curve, 2, tubeRadius, 8, false);
      
      // Usar sempre a cor e espessura atuais, não as salvas na conexão
      return (
        <mesh 
          key={`connection-${connection.id}-${edgeColor}-${lineWidth}`} 
          geometry={tubeGeometry} 
          renderOrder={5}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Segmento clicado:', connection.id);
            onDeleteConnection?.(connection.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'default';
          }}
        >
          <meshBasicMaterial color={edgeColor} />
        </mesh>
      );
    });
  };

  return (
    <group name="simple-vertex-connector">
      {renderVertices()}
      {renderConnections()}
      
      {/* Indicadores de status removidos para melhor UX */}
    </group>
  );
}

export default SimpleVertexConnector;
