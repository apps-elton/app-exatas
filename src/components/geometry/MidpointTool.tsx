import React, { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { GeometryParams, StyleOptions } from '@/types/geometry';

interface MidpointToolProps {
  params: GeometryParams;
  style: StyleOptions;
  onStyleChange: (key: keyof StyleOptions, value: any) => void;
  onVertexSelect?: (vertexIndex: number) => void;
}

export default function MidpointTool({ params, style, onStyleChange, onVertexSelect }: MidpointToolProps) {
  if (style.activeVertexMode === 'plane' && style.activeTool !== 'midpoint') {
    return null;
  }

  const [selectedVertices, setSelectedVertices] = useState<number[]>([]);
  const [midpointPairs, setMidpointPairs] = useState<{vertex1: number, vertex2: number}[]>([]);
  
  // Memoizar as posições dos vértices
  const vertexPositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    
    if (params.type === 'cube') {
      const sideLength = params.sideLength || 2;
      const half = sideLength / 2;
      positions.push(
        new THREE.Vector3(-half, 0, -half),
        new THREE.Vector3(half, 0, -half),
        new THREE.Vector3(half, 0, half),
        new THREE.Vector3(-half, 0, half),
        new THREE.Vector3(-half, sideLength, -half),
        new THREE.Vector3(half, sideLength, -half),
        new THREE.Vector3(half, sideLength, half),
        new THREE.Vector3(-half, sideLength, half)
      );
    } else if (params.type === 'tetrahedron') {
      const { sideLength = 2 } = params;
      const a = sideLength;
      const height = a * Math.sqrt(2/3);
      const R = a / Math.sqrt(3);
      positions.push(
        new THREE.Vector3(R * Math.cos(0), 0, R * Math.sin(0)),
        new THREE.Vector3(R * Math.cos(2 * Math.PI / 3), 0, R * Math.sin(2 * Math.PI / 3)),
        new THREE.Vector3(R * Math.cos(4 * Math.PI / 3), 0, R * Math.sin(4 * Math.PI / 3)),
        new THREE.Vector3(0, height, 0)
      );
    } else if (params.type === 'octahedron') {
      const { sideLength = 2 } = params;
      const a = sideLength;
      const height = a * Math.sqrt(2);
      positions.push(
        new THREE.Vector3(0, height/2, 0),
        new THREE.Vector3(a/2, 0, 0),
        new THREE.Vector3(0, 0, a/2),
        new THREE.Vector3(-a/2, 0, 0),
        new THREE.Vector3(0, 0, -a/2),
        new THREE.Vector3(0, -height/2, 0)
      );
    } else if (params.type === 'cylinder') {
      const height = params.height || 4;
      const radius = params.radius || 2;
      const segments = 8;
      
      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        positions.push(new THREE.Vector3(
          radius * Math.cos(angle),
          0,
          radius * Math.sin(angle)
        ));
      }
      
      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        positions.push(new THREE.Vector3(
          radius * Math.cos(angle),
          height,
          radius * Math.sin(angle)
        ));
      }
    } else if (params.type === 'cone') {
      const height = params.height || 4;
      const radius = params.radius || 2;
      const segments = 8;
      
      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        positions.push(new THREE.Vector3(
          radius * Math.cos(angle),
          0,
          radius * Math.sin(angle)
        ));
      }
      positions.push(new THREE.Vector3(0, height, 0));
    } else if (params.type === 'prism' || params.type === 'pyramid') {
      const height = params.height || 4;
      const baseEdgeLength = params.baseEdgeLength || 2;
      const numSides = params.numSides || 5;
      const r = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
      
      if (params.type === 'prism') {
        for (let i = 0; i < numSides; i++) {
          const angle = (i * 2 * Math.PI) / numSides;
          positions.push(new THREE.Vector3(
            r * Math.cos(angle),
            0,
            r * Math.sin(angle)
          ));
        }
        
        for (let i = 0; i < numSides; i++) {
          const angle = (i * 2 * Math.PI) / numSides;
          positions.push(new THREE.Vector3(
            r * Math.cos(angle),
            height,
            r * Math.sin(angle)
          ));
        }
      } else if (params.type === 'pyramid') {
        for (let i = 0; i < numSides; i++) {
          const angle = (i * 2 * Math.PI) / numSides;
          positions.push(new THREE.Vector3(
            r * Math.cos(angle),
            0,
            r * Math.sin(angle)
          ));
        }
        positions.push(new THREE.Vector3(0, height, 0));
      }
    }
    
    return positions;
  }, [params.type, params.height, params.baseEdgeLength, params.numSides, params.sideLength, params.radius]);
  
  // Função para obter o número base de vértices da geometria
  const getBaseVertexCount = (): number => {
    const { type } = params;
    switch (type) {
      case 'cube': return 8;
      case 'tetrahedron': return 4;
      case 'octahedron': return 6;
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
  
  // Função para obter a posição de qualquer vértice (normal ou ponto médio)
  const getAnyVertexPosition = (vertexIndex: number, calculatedMidpoints: THREE.Vector3[] = []): THREE.Vector3 | null => {
    const baseVertexCount = getBaseVertexCount();
    
    if (vertexIndex >= baseVertexCount) {
      // É um ponto médio
      const midpointIndex = vertexIndex - baseVertexCount;
      return calculatedMidpoints[midpointIndex] || null;
    } else {
      // É um vértice normal
      return vertexPositions[vertexIndex] || null;
    }
  };

  // Calcular pontos médios com suporte a pontos médios aninhados
  const midpoints = useMemo(() => {
    const calculatedMidpoints: THREE.Vector3[] = [];
    
    // Calcular pontos médios em ordem sequencial para suportar aninhamento
    for (const pair of midpointPairs) {
      const vertex1 = getAnyVertexPosition(pair.vertex1, calculatedMidpoints);
      const vertex2 = getAnyVertexPosition(pair.vertex2, calculatedMidpoints);
      
      if (vertex1 && vertex2) {
        const midpoint = new THREE.Vector3()
          .addVectors(vertex1, vertex2)
          .multiplyScalar(0.5);
        calculatedMidpoints.push(midpoint);
      }
    }
    
    return calculatedMidpoints;
  }, [midpointPairs, vertexPositions]);

  // Limpar seleção quando a ferramenta muda
  useEffect(() => {
    if (style.activeTool !== 'midpoint') {
      setSelectedVertices([]);
    }
  }, [style.activeTool]);

  // Limpar pontos médios quando a geometria muda
  useEffect(() => {
    setMidpointPairs([]);
    setSelectedVertices([]);
  }, [params.type, params.numSides, params.height, params.baseEdgeLength, params.sideLength, params.radius]);

  // Integrar com o sistema de seleção
  useEffect(() => {
    if (style.activeTool === 'midpoint') {
      const currentSelection = style.selectedVerticesForGeneral || [];
      
      if (currentSelection.length >= 2) {
        const vertex1Index = currentSelection[0];
        const vertex2Index = currentSelection[1];
        
        const vertex1 = getVertexPosition(vertex1Index);
        const vertex2 = getVertexPosition(vertex2Index);
        
        if (vertex1 && vertex2) {
          setMidpointPairs(prev => [...prev, {
            vertex1: vertex1Index,
            vertex2: vertex2Index
          }]);
          
          onStyleChange('selectedVerticesForGeneral', []);
        }
      }
    }
  }, [style.selectedVerticesForGeneral, style.activeTool, onStyleChange, params.type]);

  const getVertexPosition = (vertexIndex: number): THREE.Vector3 | null => {
    return getAnyVertexPosition(vertexIndex, midpoints);
  };

  const clearAllMidpoints = () => {
    setMidpointPairs([]);
  };

  useEffect(() => {
    if (onStyleChange) {
      onStyleChange('clearMidpoints', clearAllMidpoints);
      onStyleChange('midpoints', midpoints);
    }
  }, [onStyleChange, midpoints]);

  return (
    <group>
      {/* Renderizar pontos médios com tamanho maior para facilitar cliques */}
      {midpoints.map((midpoint, index) => (
        <group key={`midpoint-${index}`}>
          <mesh 
            position={midpoint}
            onClick={(e) => {
              e.stopPropagation();
              const baseVertexCount = getBaseVertexCount();
              const finalIndex = baseVertexCount + index;
              onVertexSelect?.(finalIndex);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'default';
            }}
            renderOrder={10}
          >
            <sphereGeometry args={[0.12]} />
            <meshBasicMaterial 
              color="#ff0000" 
              transparent
              opacity={1.0}
            />
          </mesh>
        </group>
      ))}
      
      {/* Vértices selecionados */}
      {style.activeTool === 'midpoint' && selectedVertices.map((vertexIndex) => {
        const position = getVertexPosition(vertexIndex);
        if (!position) return null;
        
        return (
           <mesh key={`selected-${vertexIndex}`} position={position}>
             <sphereGeometry args={[0.1]} />
             <meshBasicMaterial 
               color="#4ecdc4" 
               transparent
               opacity={0.9}
             />
           </mesh>
        );
      })}
    </group>
  );
}