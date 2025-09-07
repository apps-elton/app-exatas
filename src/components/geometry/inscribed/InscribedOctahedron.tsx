import React from 'react';
import { GeometryParams, VisualizationOptions, StyleOptions } from '@/types/geometry';
import * as THREE from 'three';

interface InscribedOctahedronProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
}

export default function InscribedOctahedron({ params, options, style }: InscribedOctahedronProps) {
  // Octaedro inscrito em esfera
  const renderInscribedOctahedronInSphere = () => {
    if (params.type !== 'sphere' || !options.showInscribedOctahedron) return null;
    
    const { radius = 2 } = params;
    const vertices = new Float32Array([
      // Top pyramid
      0, radius, 0,     // Top vertex
      radius, 0, 0,     // Right
      0, 0, radius,     // Front
      
      0, radius, 0,     // Top vertex
      0, 0, radius,     // Front  
      -radius, 0, 0,    // Left
      
      0, radius, 0,     // Top vertex
      -radius, 0, 0,    // Left
      0, 0, -radius,    // Back
      
      0, radius, 0,     // Top vertex
      0, 0, -radius,    // Back
      radius, 0, 0,     // Right
      
      // Bottom pyramid
      0, -radius, 0,    // Bottom vertex
      0, 0, radius,     // Front
      radius, 0, 0,     // Right
      
      0, -radius, 0,    // Bottom vertex
      -radius, 0, 0,    // Left
      0, 0, radius,     // Front
      
      0, -radius, 0,    // Bottom vertex
      0, 0, -radius,    // Back
      -radius, 0, 0,    // Left
      
      0, -radius, 0,    // Bottom vertex
      radius, 0, 0,     // Right
      0, 0, -radius     // Back
    ]);
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    
    const edges = new THREE.EdgesGeometry(geometry);
    
    return (
      <group position={[0, radius, 0]}>
        {/* Faces */}
        {options.inscribedOctahedronShowFaces && (
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color={style.inscribedOctahedronColor || style.inscribedShapeColor || "#ff0088"} 
              transparent 
              opacity={style.inscribedShapeOpacity || 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Edges */}
        {options.inscribedOctahedronShowEdges && (
          <lineSegments geometry={edges}>
            <lineBasicMaterial 
              color={style.inscribedOctahedronColor || style.inscribedShapeColor || "#ff0088"} 
              linewidth={2} 
            />
          </lineSegments>
        )}
      </group>
    );
  };

  return (
    <>
      {renderInscribedOctahedronInSphere()}
    </>
  );
}