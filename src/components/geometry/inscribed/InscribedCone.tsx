import React from 'react';
import { GeometryParams, VisualizationOptions, StyleOptions } from '@/types/geometry';
import * as THREE from 'three';

interface InscribedConeProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
}

export default function InscribedCone({ params, options, style }: InscribedConeProps) {
  // Cone inscrito em esfera
  const renderInscribedConeInSphere = () => {
    if (params.type !== 'sphere' || !options.showInscribedCone) return null;
    
    const { radius = 2 } = params;
    
    // CONE INSCRITO MATEMÁTICO CORRETO:
    // Esfera: centro em (0, radius, 0), raio = radius  
    // Cone inscrito: deve estar inteiramente dentro da esfera
    const coneHeight = radius * 1.6;     // altura para ficar dentro da esfera
    const coneRadius = radius * 0.6;     // raio limitado para ficar dentro da esfera
    
    // Sempre usar muitos segmentos para manter a base circular
    const geometry = new THREE.ConeGeometry(coneRadius, coneHeight, 64);
    
    // Criar wireframe customizado com número controlado de geratrizes
    const createConeWireframe = () => {
      const lines: THREE.Vector3[] = [];
      const numGeneratrices = style.coneGeneratrices || 8;
      
      // Círculo da base (sempre circular)
      const baseSegments = 64;
      for (let i = 0; i < baseSegments; i++) {
        const angle1 = (i * 2 * Math.PI) / baseSegments;
        const angle2 = ((i + 1) * 2 * Math.PI) / baseSegments;
        const x1 = coneRadius * Math.cos(angle1);
        const z1 = coneRadius * Math.sin(angle1);
        const x2 = coneRadius * Math.cos(angle2);
        const z2 = coneRadius * Math.sin(angle2);
        lines.push(new THREE.Vector3(x1, -coneHeight / 2, z1));
        lines.push(new THREE.Vector3(x2, -coneHeight / 2, z2));
      }
      
      // Geratrizes (linhas da base ao vértice)
      for (let i = 0; i < numGeneratrices; i++) {
        const angle = (i * 2 * Math.PI) / numGeneratrices;
        const x = coneRadius * Math.cos(angle);
        const z = coneRadius * Math.sin(angle);
        lines.push(new THREE.Vector3(x, -coneHeight / 2, z));
        lines.push(new THREE.Vector3(0, coneHeight / 2, 0));
      }
      
      return new THREE.BufferGeometry().setFromPoints(lines);
    };

    const edges = createConeWireframe();
    const coneY = radius + 0.3; // Posicionar dentro da esfera
    
    return (
      <group position={[0, coneY, 0]}>
        {/* Faces */}
        {options.inscribedConeShowFaces && (
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color={style.inscribedConeColor || style.inscribedShapeColor || "#aa00ff"}
              transparent 
              opacity={style.inscribedConeOpacity ?? style.inscribedShapeOpacity ?? 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Edges */}
        {options.inscribedConeShowEdges && (
          <lineSegments geometry={edges}>
            <lineBasicMaterial 
              color={style.inscribedConeColor || style.inscribedShapeColor || "#aa00ff"}
            />
          </lineSegments>
        )}
      </group>
    );
  };

  return (
    <>
      {renderInscribedConeInSphere()}
    </>
  );
}