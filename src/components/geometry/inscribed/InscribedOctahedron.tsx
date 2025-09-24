import React from 'react';
import { GeometryParams, VisualizationOptions, StyleOptions } from '@/types/geometry';
import * as THREE from 'three';

// Função para criar arestas com espessura real usando TubeGeometry
const createThickEdges = (geometry: THREE.BufferGeometry, thickness: number = 2) => {
  const edges = new THREE.EdgesGeometry(geometry);
  const positions = edges.attributes.position.array;
  const thickEdges: JSX.Element[] = [];
  
  for (let i = 0; i < positions.length; i += 6) {
    const start = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
    const end = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
    
    const curve = new THREE.LineCurve3(start, end);
    const tubeRadius = Math.max(thickness * 0.01, 0.005);
    const tubeGeometry = new THREE.TubeGeometry(curve, 2, tubeRadius, 8, false);
    
    thickEdges.push(
      <mesh key={`edge-${i}`} geometry={tubeGeometry}>
        <meshBasicMaterial />
      </mesh>
    );
  }
  
  return thickEdges;
};

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
          <group>
            {createThickEdges(geometry, style.inscribedEdgeThickness || 2).map((edge, index) => 
              React.cloneElement(edge, {
                key: `inscribed-octahedron-edge-${index}`,
                children: (
                  <meshBasicMaterial 
                    color={style.inscribedEdgeColor || style.inscribedOctahedronColor || style.inscribedShapeColor || "#ff0088"}
                  />
                )
              })
            )}
          </group>
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