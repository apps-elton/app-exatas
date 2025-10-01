import React from 'react';
import * as THREE from 'three';
import { GeometryParams, StyleOptions, VisualizationOptions } from '../../types/geometry';

interface CubeVertexSelectorProps {
  params: GeometryParams;
  style: StyleOptions;
  options: VisualizationOptions;
  onVertexSelect: (vertexIndex: number) => void;
}

export function CubeVertexSelector({ 
  params, 
  style, 
  options,
  onVertexSelect 
}: CubeVertexSelectorProps) {
  if (params.type !== 'cube' || !options.showVertexSelection) {
    return null;
  }

  const sideLength = params.sideLength || 2;
  const half = sideLength / 2;

  // Vértices do cubo
  const vertices = [
    new THREE.Vector3(-half, 0, -half),      // 0: base frente esquerda
    new THREE.Vector3(half, 0, -half),       // 1: base frente direita  
    new THREE.Vector3(half, 0, half),        // 2: base tras direita
    new THREE.Vector3(-half, 0, half),       // 3: base tras esquerda
    new THREE.Vector3(-half, sideLength, -half),   // 4: topo frente esquerda
    new THREE.Vector3(half, sideLength, -half),    // 5: topo frente direita
    new THREE.Vector3(half, sideLength, half),     // 6: topo tras direita
    new THREE.Vector3(-half, sideLength, half),    // 7: topo tras esquerda
  ];

  const selectedVertices = style.selectedVerticesForMeridian || [];

  return (
    <group>
      {vertices.map((vertex, index) => {
        const isSelected = selectedVertices.includes(index);
        
        return (
          <mesh
            key={index}
            position={vertex}
            onClick={(e) => {
              e.stopPropagation();
              onVertexSelect(index);
            }}
          >
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial 
              color={isSelected ? "#ff0000" : "#ffffff"}
              transparent
              opacity={isSelected ? 1.0 : 0.8}
            />
          </mesh>
        );
      })}
      
      {/* Indicador visual quando menos de 2 vértices estão selecionados */}
      {selectedVertices.length < 2 && (
        <mesh position={[0, sideLength + 0.5, 0]}>
          <planeGeometry args={[2, 0.3]} />
          <meshBasicMaterial 
            color="#ffffff"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}