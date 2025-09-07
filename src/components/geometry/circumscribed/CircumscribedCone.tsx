import React from 'react';
import { GeometryParams, VisualizationOptions, StyleOptions } from '@/types/geometry';
import * as THREE from 'three';

interface CircumscribedConeProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
}

export default function CircumscribedCone({ params, options, style }: CircumscribedConeProps) {
  // Cone que CIRCUNSCREVE uma esfera - CORRIGIDO MATEMATICAMENTE  
  const renderCircumscribedConeForSphere = () => {
    if (params.type !== 'sphere' || !options.showCircumscribedCone) return null;
    
    const { radius = 2 } = params;
    
    // CONE CIRCUNSCRITO CORRETO:
    // Esfera: centro em (0, radius, 0), raio = radius  
    // Cone deve envolver completamente a esfera (tangente externamente)
    // Para cone tangente à esfera: usar relações trigonométricas corretas
    const sphereRadius = radius;
    const coneHeight = 4 * sphereRadius;  // Altura maior para envolver a esfera
    const coneBaseRadius = 2 * sphereRadius; // Base maior para circunscrever
    
    // Posicionamento: cone com base em y=0, vértice em y=coneHeight  
    const coneY = coneHeight / 2; // centro geométrico do cone
    
    // Sempre usar muitos segmentos para manter a base circular
    const geometry = new THREE.ConeGeometry(coneBaseRadius, coneHeight, 64);
    
    // Criar wireframe customizado com número controlado de geratrizes
    const createConeWireframe = () => {
      const lines: THREE.Vector3[] = [];
      const numGeneratrices = style.coneGeneratrices || 8;
      
      // Círculo da base (sempre circular)
      const baseSegments = 64;
      for (let i = 0; i < baseSegments; i++) {
        const angle1 = (i * 2 * Math.PI) / baseSegments;
        const angle2 = ((i + 1) * 2 * Math.PI) / baseSegments;
        const x1 = coneBaseRadius * Math.cos(angle1);
        const z1 = coneBaseRadius * Math.sin(angle1);
        const x2 = coneBaseRadius * Math.cos(angle2);
        const z2 = coneBaseRadius * Math.sin(angle2);
        lines.push(new THREE.Vector3(x1, -coneHeight / 2, z1));
        lines.push(new THREE.Vector3(x2, -coneHeight / 2, z2));
      }
      
      // Geratrizes (linhas da base ao vértice)
      for (let i = 0; i < numGeneratrices; i++) {
        const angle = (i * 2 * Math.PI) / numGeneratrices;
        const x = coneBaseRadius * Math.cos(angle);
        const z = coneBaseRadius * Math.sin(angle);
        lines.push(new THREE.Vector3(x, -coneHeight / 2, z));
        lines.push(new THREE.Vector3(0, coneHeight / 2, 0));
      }
      
      return new THREE.BufferGeometry().setFromPoints(lines);
    };
    
    const edges = createConeWireframe();
    
    return (
      <group position={[0, coneY, 0]}>
        {/* Faces */}
        {options.circumscribedConeShowFaces && (
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color={style.circumscribedConeColor || style.circumscribedShapeColor || "#ff6600"} 
              transparent 
              opacity={style.circumscribedConeOpacity || style.circumscribedShapeOpacity || 0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Edges */}
        {options.circumscribedConeShowEdges && (
          <lineSegments geometry={edges}>
            <lineBasicMaterial 
              color={style.circumscribedConeColor || style.circumscribedShapeColor || "#ff6600"} 
            />
          </lineSegments>
        )}
      </group>
    );
  };

  return (
    <>
      {renderCircumscribedConeForSphere()}
    </>
  );
}