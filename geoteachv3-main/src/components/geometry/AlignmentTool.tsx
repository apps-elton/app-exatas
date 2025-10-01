import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { GeometryParams, StyleOptions } from '@/types/geometry';

interface AlignmentToolProps {
  params: GeometryParams;
  style: StyleOptions;
  onStyleChange: (key: keyof StyleOptions, value: any) => void;
  onVertexSelect?: (vertexIndex: number) => void;
}

export default function AlignmentTool({ params, style, onStyleChange, onVertexSelect }: AlignmentToolProps) {
  const [selectedVertices, setSelectedVertices] = useState<number[]>([]);
  const [alignmentLines, setAlignmentLines] = useState<Array<{
    id: string;
    start: THREE.Vector3;
    end: THREE.Vector3;
    type: 'horizontal' | 'vertical' | 'diagonal';
  }>>([]);

  // Limpar seleção quando a ferramenta muda
  useEffect(() => {
    if (style.activeTool !== 'align') {
      setSelectedVertices([]);
    }
  }, [style.activeTool]);

  const handleVertexClick = (vertexIndex: number) => {
    if (style.activeTool !== 'align') return;

    if (selectedVertices.length < 2) {
      const newSelection = [...selectedVertices, vertexIndex];
      setSelectedVertices(newSelection);
      
      if (newSelection.length === 2) {
        // Calcular alinhamento
        const vertex1 = getVertexPosition(newSelection[0]);
        const vertex2 = getVertexPosition(newSelection[1]);
        
        if (vertex1 && vertex2) {
          const alignment = calculateAlignment(vertex1, vertex2);
          
          const alignmentLine = {
            id: `align-${Date.now()}`,
            start: vertex1,
            end: vertex2,
            type: alignment
          };
          
          setAlignmentLines(prev => [...prev, alignmentLine]);
          
          // Limpar seleção para próxima operação
          setSelectedVertices([]);
        }
      }
    }
  };

  const getVertexPosition = (vertexIndex: number): THREE.Vector3 | null => {
    // Esta função deve ser implementada para obter a posição do vértice
    // Por enquanto, retorna uma posição genérica
    return new THREE.Vector3(0, 0, 0);
  };

  const calculateAlignment = (start: THREE.Vector3, end: THREE.Vector3): 'horizontal' | 'vertical' | 'diagonal' => {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    const dz = Math.abs(end.z - start.z);
    
    // Verificar alinhamento horizontal (mesma altura Y)
    if (dy < 0.1) return 'horizontal';
    
    // Verificar alinhamento vertical (mesma posição X e Z)
    if (dx < 0.1 && dz < 0.1) return 'vertical';
    
    // Caso contrário, é diagonal
    return 'diagonal';
  };

  const getAlignmentColor = (type: string) => {
    switch (type) {
      case 'horizontal': return '#4ecdc4';
      case 'vertical': return '#ff6b6b';
      case 'diagonal': return '#ffe66d';
      default: return '#ffffff';
    }
  };

  return (
    <group>
      {/* Renderizar linhas de alinhamento */}
      {alignmentLines.map((line) => (
        <line key={line.id}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                line.start.x, line.start.y, line.start.z,
                line.end.x, line.end.y, line.end.z
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color={getAlignmentColor(line.type)} 
            linewidth={2} 
            transparent 
            opacity={0.7}
          />
        </line>
      ))}
      
      {/* Renderizar vértices selecionados */}
      {selectedVertices.map((vertexIndex, index) => {
        const position = getVertexPosition(vertexIndex);
        if (!position) return null;
        
        return (
          <mesh key={`selected-${vertexIndex}`} position={position}>
            <sphereGeometry args={[0.15]} />
            <meshBasicMaterial color="#4ecdc4" />
          </mesh>
        );
      })}
    </group>
  );
}

