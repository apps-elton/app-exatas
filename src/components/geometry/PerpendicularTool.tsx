import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { GeometryParams, StyleOptions } from '@/types/geometry';

interface PerpendicularToolProps {
  params: GeometryParams;
  style: StyleOptions;
  onStyleChange: (key: keyof StyleOptions, value: any) => void;
  onVertexSelect?: (vertexIndex: number) => void;
}

export default function PerpendicularTool({ params, style, onStyleChange, onVertexSelect }: PerpendicularToolProps) {
  const [selectedVertices, setSelectedVertices] = useState<number[]>([]);
  const [perpendicularLines, setPerpendicularLines] = useState<Array<{
    id: string;
    start: THREE.Vector3;
    end: THREE.Vector3;
    baseLine: THREE.Vector3[];
  }>>([]);

  // Limpar seleção quando a ferramenta muda
  useEffect(() => {
    if (style.activeTool !== 'perpendicular') {
      setSelectedVertices([]);
    }
  }, [style.activeTool]);

  // Integrar com o sistema de seleção existente
  useEffect(() => {
    if (style.activeTool === 'perpendicular') {
      const currentSelection = style.selectedVerticesForGeneral || [];
      
      if (currentSelection.length >= 2) {
        // Criar linha perpendicular
        const vertex1 = getVertexPosition(currentSelection[currentSelection.length - 2]);
        const vertex2 = getVertexPosition(currentSelection[currentSelection.length - 1]);
        
        if (vertex1 && vertex2) {
          const perpendicularLine = createPerpendicularLine(vertex1, vertex2);
          
          setPerpendicularLines(prev => [...prev, perpendicularLine]);
          
          // Limpar seleção
          onStyleChange('selectedVerticesForGeneral', []);
        }
      }
    }
  }, [style.selectedVerticesForGeneral, style.activeTool, onStyleChange]);

  const getVertexPosition = (vertexIndex: number): THREE.Vector3 | null => {
    // Esta função deve ser implementada para obter a posição do vértice
    // Por enquanto, retorna uma posição genérica baseada no índice
    const angle = (vertexIndex * 2 * Math.PI) / 8; // Para 8 vértices
    const radius = 2;
    return new THREE.Vector3(
      radius * Math.cos(angle),
      0,
      radius * Math.sin(angle)
    );
  };

  const createPerpendicularLine = (point1: THREE.Vector3, point2: THREE.Vector3) => {
    // Calcular vetor da linha base
    const baseVector = new THREE.Vector3().subVectors(point2, point1).normalize();
    
    // Calcular vetor perpendicular (rotação de 90 graus no plano XY)
    const perpendicularVector = new THREE.Vector3(-baseVector.z, 0, baseVector.x).normalize();
    
    // Criar linha perpendicular
    const perpendicularStart = point1.clone();
    const perpendicularEnd = point1.clone().add(perpendicularVector.multiplyScalar(2));
    
    return {
      id: `perpendicular-${Date.now()}`,
      start: perpendicularStart,
      end: perpendicularEnd,
      baseLine: [point1, point2]
    };
  };

  return (
    <group>
      {/* Renderizar linhas perpendiculares */}
      {perpendicularLines.map((line) => (
        <group key={line.id}>
          {/* Linha perpendicular */}
          <line>
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
            <lineBasicMaterial color="#ff6b6b" linewidth={3} />
          </line>
          
          {/* Linha base (mais sutil) */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([
                  line.baseLine[0].x, line.baseLine[0].y, line.baseLine[0].z,
                  line.baseLine[1].x, line.baseLine[1].y, line.baseLine[1].z
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#4ecdc4" linewidth={2} transparent opacity={0.7} />
          </line>
        </group>
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

