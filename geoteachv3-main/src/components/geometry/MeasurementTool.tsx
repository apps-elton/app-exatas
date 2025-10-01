import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { GeometryParams, StyleOptions } from '@/types/geometry';

interface MeasurementToolProps {
  params: GeometryParams;
  style: StyleOptions;
  onStyleChange: (key: keyof StyleOptions, value: any) => void;
  onVertexSelect?: (vertexIndex: number) => void;
}

export default function MeasurementTool({ params, style, onStyleChange, onVertexSelect }: MeasurementToolProps) {
  const [selectedVertices, setSelectedVertices] = useState<number[]>([]);
  const [measurements, setMeasurements] = useState<Array<{
    id: string;
    start: THREE.Vector3;
    end: THREE.Vector3;
    distance: number;
  }>>([]);

  // Limpar seleção quando a ferramenta muda
  useEffect(() => {
    if (style.activeTool !== 'measure') {
      setSelectedVertices([]);
    }
  }, [style.activeTool]);

  const handleVertexClick = (vertexIndex: number) => {
    if (style.activeTool !== 'measure') return;

    if (selectedVertices.length < 2) {
      const newSelection = [...selectedVertices, vertexIndex];
      setSelectedVertices(newSelection);
      
      if (newSelection.length === 2) {
        // Calcular distância
        const vertex1 = getVertexPosition(newSelection[0]);
        const vertex2 = getVertexPosition(newSelection[1]);
        
        if (vertex1 && vertex2) {
          const distance = vertex1.distanceTo(vertex2);
          
          const measurement = {
            id: `measure-${Date.now()}`,
            start: vertex1,
            end: vertex2,
            distance
          };
          
          setMeasurements(prev => [...prev, measurement]);
          
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

  return (
    <group>
      {/* Renderizar medições */}
      {measurements.map((measurement) => (
        <group key={measurement.id}>
          {/* Linha de medição */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([
                  measurement.start.x, measurement.start.y, measurement.start.z,
                  measurement.end.x, measurement.end.y, measurement.end.z
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#ff6b6b" linewidth={2} />
          </line>
          
          {/* Texto da distância */}
          <mesh position={measurement.start.clone().lerp(measurement.end, 0.5)}>
            <planeGeometry args={[0.5, 0.2]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
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

