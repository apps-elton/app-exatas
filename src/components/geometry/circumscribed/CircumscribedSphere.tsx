import React from 'react';
import { GeometryParams, VisualizationOptions, StyleOptions } from '@/types/geometry';
import * as THREE from 'three';

interface CircumscribedSphereProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
}

export default function CircumscribedSphere({ params, options, style }: CircumscribedSphereProps) {
  // Função para criar meridianos e paralelos
  const createMeridiansAndParallels = (radius: number) => {
    const meridians = [];
    const parallels = [];
    
    // Criar 8 meridianos (linhas verticais)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const points = [];
      for (let j = 0; j <= 32; j++) {
        const phi = (j / 32) * Math.PI; // De 0 a π
        const x = radius * Math.sin(phi) * Math.cos(angle);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(angle);
        points.push(new THREE.Vector3(x, y, z));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ 
        color: style.circumscribedSphereColor || style.circumscribedShapeColor || "#00aaff",
        opacity: 0.6,
        transparent: true
      }));
      meridians.push(<primitive key={`meridian-${i}`} object={line} />);
    }
    
    // Criar 6 paralelos (linhas horizontais)
    for (let i = 1; i < 6; i++) {
      const phi = (i / 6) * Math.PI; // De π/6 a 5π/6
      const points = [];
      const parallelRadius = radius * Math.sin(phi);
      const y = radius * Math.cos(phi);
      
      for (let j = 0; j <= 64; j++) {
        const theta = (j / 64) * Math.PI * 2;
        const x = parallelRadius * Math.cos(theta);
        const z = parallelRadius * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ 
        color: style.circumscribedSphereColor || style.circumscribedShapeColor || "#00aaff",
        opacity: 0.6,
        transparent: true
      }));
      parallels.push(<primitive key={`parallel-${i}`} object={line} />);
    }
    
    return [...meridians, ...parallels];
  };

  // Esfera circunscrita ao cubo
  const renderCircumscribedSphereForCube = () => {
    if (params.type !== 'cube' || !options.showCircumscribedSphere) return null;
    
    const { sideLength = 2 } = params;
    const radius = (sideLength * Math.sqrt(3)) / 2; // Diagonal espacial / 2
    
    const geometry = new THREE.SphereGeometry(radius, options.sphereWidthSegments || 64, options.sphereHeightSegments || 32);
    const edges = new THREE.EdgesGeometry(geometry);
    
    return (
      <group position={[0, sideLength / 2, 0]}>
        {/* Faces */}
        {options.circumscribedSphereShowFaces && (
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color={style.circumscribedSphereColor || style.circumscribedShapeColor || "#00aaff"} 
              transparent 
              opacity={style.circumscribedShapeOpacity || 0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Edges */}
        {options.circumscribedSphereShowEdges && (
        <lineSegments geometry={edges}>
          <lineBasicMaterial 
            color={style.circumscribedSphereColor || style.circumscribedShapeColor || "#00aaff"} 
            // Note: linewidth may not work on all platforms due to WebGL limitations
          />
        </lineSegments>
        )}
        
        {/* Meridianos e Paralelos */}
        {params.type === 'cube' && createMeridiansAndParallels(radius)}
      </group>
    );
  };

  // Esfera circunscrita ao cilindro - CORRIGIDA para formato esférico
  const renderCircumscribedSphereForCylinder = () => {
    if (params.type !== 'cylinder' || !options.showCircumscribedSphere) return null;
    
    const { radius = 2, height = 4 } = params;
    // Para um cilindro, a esfera circunscrita tem raio = sqrt((altura/2)² + raio²)
    const sphereRadius = Math.sqrt((height / 2) ** 2 + radius ** 2);
    
    // Usar SphereGeometry com segmentos adequados para manter formato esférico
    const geometry = new THREE.SphereGeometry(sphereRadius, options.sphereWidthSegments || 64, options.sphereHeightSegments || 32);
    const edges = new THREE.EdgesGeometry(geometry);
    
    return (
      <group position={[0, height / 2, 0]}>
        {/* Faces */}
        {options.circumscribedSphereShowFaces && (
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color={style.circumscribedSphereColor || style.circumscribedShapeColor || "#00aaff"} 
              transparent 
              opacity={style.circumscribedSphereOpacity || 0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Edges */}
        {options.circumscribedSphereShowEdges && (
          <lineSegments geometry={edges}>
            <lineBasicMaterial 
              color={style.circumscribedSphereColor || style.circumscribedShapeColor || "#00aaff"} 
              linewidth={2} 
            />
          </lineSegments>
        )}
      </group>
    );
  };

  // Esfera circunscrita ao cone
  const renderCircumscribedSphereForCone = () => {
    if (params.type !== 'cone' || !options.showCircumscribedSphere) return null;
    
    const { radius = 2, height = 4 } = params;
    // Fórmula correta para esfera circunscrita ao cone
    // R = (r² + h²) / (2h)
    const sphereRadius = (radius * radius + height * height) / (2 * height);
    // A esfera deve estar centrada de forma que toque o vértice e a circunferência da base
    const sphereY = sphereRadius;
    
    const geometry = new THREE.SphereGeometry(sphereRadius, options.sphereWidthSegments || 64, options.sphereHeightSegments || 32);
    const edges = new THREE.EdgesGeometry(geometry);
    
    return (
      <group position={[0, sphereY, 0]}>
        {/* Faces */}
        {options.circumscribedSphereShowFaces && (
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color={style.circumscribedSphereColor || style.circumscribedShapeColor || "#00aaff"} 
              transparent 
              opacity={style.circumscribedShapeOpacity || 0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Edges */}
        {options.circumscribedSphereShowEdges && (
        <lineSegments geometry={edges}>
          <lineBasicMaterial 
            color={style.circumscribedSphereColor || style.circumscribedShapeColor || "#00aaff"} 
            // Note: linewidth may not work on all platforms due to WebGL limitations
          />
        </lineSegments>
        )}
      </group>
    );
  };

  return (
    <>
      {renderCircumscribedSphereForCube()}
      {renderCircumscribedSphereForCylinder()}
      {renderCircumscribedSphereForCone()}
    </>
  );
}