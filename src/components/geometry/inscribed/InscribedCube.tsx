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
          <group>
            {createThickEdges(geometry, style.inscribedEdgeThickness || 2).map((edge, index) => 
              React.cloneElement(edge, {
                key: `inscribed-cube-edge-${index}`,
                children: (
                  <meshBasicMaterial 
                    color={style.inscribedEdgeColor || style.inscribedCubeColor || style.inscribedShapeColor || "#ffaa00"}
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
      {renderInscribedCubeInSphere()}
    </>
  );
}