import React from 'react';
import { GeometryParams, VisualizationOptions, StyleOptions } from '@/types/geometry';
import * as THREE from 'three';

interface CircumscribedCylinderProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
}

export default function CircumscribedCylinder({ params, options, style }: CircumscribedCylinderProps) {
  // Cilindro equilátero circunscrito à esfera
  const renderCircumscribedCylinderForSphere = () => {
    if (params.type !== 'sphere' || !options.showCircumscribedCylinder) return null;
    
    const { radius = 2 } = params;
    const cylRadius = radius;
    const cylHeight = 2 * radius; // Cilindro equilátero
    
    // Sempre usar muitos segmentos para manter a base circular
    const geometry = new THREE.CylinderGeometry(cylRadius, cylRadius, cylHeight, 64);
    
    // Criar wireframe customizado com número controlado de geratrizes
    const createCylinderWireframe = () => {
      const lines: THREE.Vector3[] = [];
      const numGeneratrices = style.cylinderGeneratrices || 8;
      
      // Círculo superior (sempre circular)
      const topSegments = 64;
      for (let i = 0; i < topSegments; i++) {
        const angle1 = (i * 2 * Math.PI) / topSegments;
        const angle2 = ((i + 1) * 2 * Math.PI) / topSegments;
        const x1 = cylRadius * Math.cos(angle1);
        const z1 = cylRadius * Math.sin(angle1);
        const x2 = cylRadius * Math.cos(angle2);
        const z2 = cylRadius * Math.sin(angle2);
        lines.push(new THREE.Vector3(x1, cylHeight / 2, z1));
        lines.push(new THREE.Vector3(x2, cylHeight / 2, z2));
      }
      
      // Círculo inferior (sempre circular)
      for (let i = 0; i < topSegments; i++) {
        const angle1 = (i * 2 * Math.PI) / topSegments;
        const angle2 = ((i + 1) * 2 * Math.PI) / topSegments;
        const x1 = cylRadius * Math.cos(angle1);
        const z1 = cylRadius * Math.sin(angle1);
        const x2 = cylRadius * Math.cos(angle2);
        const z2 = cylRadius * Math.sin(angle2);
        lines.push(new THREE.Vector3(x1, -cylHeight / 2, z1));
        lines.push(new THREE.Vector3(x2, -cylHeight / 2, z2));
      }
      
      // Geratrizes (linhas verticais)
      for (let i = 0; i < numGeneratrices; i++) {
        const angle = (i * 2 * Math.PI) / numGeneratrices;
        const x = cylRadius * Math.cos(angle);
        const z = cylRadius * Math.sin(angle);
        lines.push(new THREE.Vector3(x, -cylHeight / 2, z));
        lines.push(new THREE.Vector3(x, cylHeight / 2, z));
      }
      
      return new THREE.BufferGeometry().setFromPoints(lines);
    };
    
    const edges = createCylinderWireframe();
    
    return (
      <group position={[0, radius, 0]}>
        {/* Faces */}
        {options.circumscribedCylinderShowFaces && (
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color={style.circumscribedCylinderColor || style.circumscribedShapeColor || "#ff6600"} 
              transparent 
              opacity={style.circumscribedShapeOpacity || 0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Edges */}
        {options.circumscribedCylinderShowEdges && (
          <lineSegments geometry={edges}>
            <lineBasicMaterial 
              color={style.circumscribedCylinderColor || style.circumscribedShapeColor || "#ff6600"} 
              linewidth={2} 
            />
          </lineSegments>
        )}
      </group>
    );
  };

  return (
    <>
      {renderCircumscribedCylinderForSphere()}
    </>
  );
}