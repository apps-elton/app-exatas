import React from 'react';
import { GeometryParams, VisualizationOptions, StyleOptions } from '@/types/geometry';
import * as THREE from 'three';

interface InscribedCubeProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
}

export default function InscribedCube({ params, options, style }: InscribedCubeProps) {
  // Cubo inscrito na esfera
  const renderInscribedCubeInSphere = () => {
    if (params.type !== 'sphere' || !options.showInscribedCube) return null;
    
    const { radius = 2 } = params;
    const sideLength = (2 * radius) / Math.sqrt(3); // Diagonal da esfera = diagonal espacial do cubo
    
    const geometry = new THREE.BoxGeometry(sideLength, sideLength, sideLength);
    const edges = new THREE.EdgesGeometry(geometry);
    
    return (
      <group position={[0, radius, 0]}>
        {/* Faces */}
        {options.inscribedCubeShowFaces && (
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color={style.inscribedCubeColor || style.inscribedShapeColor || "#ffaa00"} 
              transparent 
              opacity={style.inscribedShapeOpacity || 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Edges */}
        {options.inscribedCubeShowEdges && (
            <lineSegments geometry={edges}>
              <lineBasicMaterial 
                color={style.inscribedCubeColor || style.inscribedShapeColor || "#ffaa00"} 
                // Note: linewidth may not work on all platforms due to WebGL limitations
              />
            </lineSegments>
        )}
      </group>
    );
  };

  return (
    <>
      {renderInscribedCubeInSphere()}
    </>
  );
}