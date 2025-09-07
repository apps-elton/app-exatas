import React from 'react';
import { GeometryParams, VisualizationOptions, StyleOptions } from '@/types/geometry';
import * as THREE from 'three';

interface CircumscribedCubeProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
}

export default function CircumscribedCube({ params, options, style }: CircumscribedCubeProps) {
  // Cubo circunscrito à esfera
  const renderCircumscribedCubeForSphere = () => {
    if (params.type !== 'sphere' || !options.showCircumscribedCube) return null;
    
    const { radius = 2 } = params;
    const sideLength = 2 * radius; // Diâmetro da esfera
    
    const geometry = new THREE.BoxGeometry(sideLength, sideLength, sideLength);
    const edges = new THREE.EdgesGeometry(geometry);
    
    return (
      <group position={[0, radius, 0]}>
        {/* Faces */}
        {options.circumscribedCubeShowFaces && (
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color={style.circumscribedCubeColor || style.circumscribedShapeColor || "#ffaa00"} 
              transparent 
              opacity={style.circumscribedShapeOpacity || 0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Edges */}
        {options.circumscribedCubeShowEdges && (
          <lineSegments geometry={edges}>
            <lineBasicMaterial 
              color={style.circumscribedCubeColor || style.circumscribedShapeColor || "#ffaa00"} 
              linewidth={2} 
            />
          </lineSegments>
        )}
      </group>
    );
  };

  return (
    <>
      {renderCircumscribedCubeForSphere()}
    </>
  );
}