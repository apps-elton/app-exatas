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

interface InscribedCylinderProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
}

export default function InscribedCylinder({ params, options, style }: InscribedCylinderProps) {
  // Cilindro equilátero inscrito em esfera
  const renderInscribedCylinderInSphere = () => {
    if (params.type !== 'sphere' || !options.showInscribedCylinder) return null;
    
    const { radius = 2 } = params;
    // Para cilindro equilátero inscrito corretamente na esfera
    const cylRadius = radius / Math.sqrt(2);
    const cylHeight = 2 * cylRadius;
    
    // Sempre usar muitos segmentos para manter a base circular
    const geometry = new THREE.CylinderGeometry(cylRadius, cylRadius, cylHeight, 64);
    
    // Criar wireframe customizado com número controlado de geratrizes
    const createCylinderWireframe = () => {
      const lines: THREE.Vector3[] = [];
      const numGeneratrices = Math.min(style.cylinderGeneratrices || 8, 8); // Usar o valor do slider
      
      // Círculo superior (64 segmentos para manter circular)
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
        {options.inscribedCylinderShowFaces && (
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color={style.inscribedCylinderColor || style.inscribedShapeColor || "#ff6600"} 
              transparent 
              opacity={style.inscribedShapeOpacity || 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Edges - Wireframe customizado com geratrizes controladas */}
        {options.inscribedCylinderShowEdges && (
          <lineSegments geometry={edges}>
            <lineBasicMaterial 
              color={style.inscribedEdgeColor || style.inscribedCylinderColor || style.inscribedShapeColor || "#ff6600"}
              linewidth={style.inscribedEdgeThickness || 2}
            />
          </lineSegments>
        )}
      </group>
    );
  };

  return (
    <>
      {renderInscribedCylinderInSphere()}
    </>
  );
}