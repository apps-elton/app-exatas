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

interface InscribedSphereProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
}

export default function InscribedSphere({ params, options, style }: InscribedSphereProps) {
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
        color: style.inscribedSphereColor || style.inscribedShapeColor || "#00ff88",
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
        color: style.inscribedSphereColor || style.inscribedShapeColor || "#00ff88",
        opacity: 0.6,
        transparent: true
      }));
      parallels.push(<primitive key={`parallel-${i}`} object={line} />);
    }
    
    return [...meridians, ...parallels];
  };

  // Esfera inscrita no cubo
  const renderInscribedSphereInCube = () => {
    if (params.type !== 'cube' || !options.showInscribedSphere) return null;
    
    const { sideLength = 2 } = params;
    const radius = sideLength / 2; // Raio da esfera inscrita = metade da aresta
    
    const geometry = new THREE.SphereGeometry(radius, options.sphereWidthSegments || 64, options.sphereHeightSegments || 32);
    const edges = new THREE.EdgesGeometry(geometry);
    
    return (
      <group position={[0, sideLength / 2, 0]}>
        {/* Faces */}
        {options.inscribedSphereShowFaces && (
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color={style.inscribedSphereColor || style.inscribedShapeColor || "#00ff88"} 
              transparent 
              opacity={style.inscribedShapeOpacity || 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Edges */}
        {options.inscribedSphereShowEdges && (
          <group>
            {createThickEdges(geometry, style.inscribedEdgeThickness || 2).map((edge, index) => 
              React.cloneElement(edge, {
                key: `inscribed-sphere-edge-${index}`,
                children: (
                  <meshBasicMaterial 
                    color={style.inscribedEdgeColor || style.inscribedSphereColor || style.inscribedShapeColor || "#00ff88"}
                  />
                )
              })
            )}
          </group>
        )}
        
        {/* Meridianos e Paralelos */}
        {params.type === 'cube' && createMeridiansAndParallels(radius)}
      </group>
    );
  };

  // Esfera inscrita no cilindro
  const renderInscribedSphereInCylinder = () => {
    if (params.type !== 'cylinder' || !options.showInscribedSphere) return null;
    
    const { radius = 2, height = 4 } = params;
    // Para cilindro, a esfera inscrita tem raio igual ao menor entre raio_base e altura/2
    const sphereRadius = Math.min(radius, height / 2);
    // A esfera deve estar centrada no meio da altura do cilindro
    const sphereY = height / 2;
    
    const geometry = new THREE.SphereGeometry(sphereRadius, options.sphereWidthSegments || 64, options.sphereHeightSegments || 32);
    const edges = new THREE.EdgesGeometry(geometry);
    
    return (
      <group position={[0, sphereY, 0]}>
        {/* Faces */}
        {options.inscribedSphereShowFaces && (
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color={style.inscribedSphereColor || style.inscribedShapeColor || "#00ff88"} 
              transparent 
              opacity={style.inscribedShapeOpacity || 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Edges */}
        {options.inscribedSphereShowEdges && (
          <group>
            {createThickEdges(geometry, style.inscribedEdgeThickness || 2).map((edge, index) => 
              React.cloneElement(edge, {
                key: `inscribed-sphere-edge-${index}`,
                children: (
                  <meshBasicMaterial 
                    color={style.inscribedEdgeColor || style.inscribedSphereColor || style.inscribedShapeColor || "#00ff88"}
                  />
                )
              })
            )}
          </group>
        )}
      </group>
    );
  };

  // Esfera inscrita no cone
  const renderInscribedSphereInCone = () => {
    if (params.type !== 'cone' || !options.showInscribedSphere) return null;
    
    const { radius = 2, height = 4 } = params;
    // Fórmula correta para esfera inscrita no cone
    // r_inscrito = (r_base * h) / (r_base + √(r_base² + h²))
    const slantHeight = Math.sqrt(radius * radius + height * height);
    const sphereRadius = (radius * height) / (radius + slantHeight);
    // A esfera deve estar na posição correta no cone
    const sphereY = sphereRadius;
    
    const geometry = new THREE.SphereGeometry(sphereRadius, options.sphereWidthSegments || 64, options.sphereHeightSegments || 32);
    const edges = new THREE.EdgesGeometry(geometry);
    
    return (
      <group position={[0, sphereY, 0]}>
        {/* Faces */}
        {options.inscribedSphereShowFaces && (
          <mesh geometry={geometry}>
            <meshStandardMaterial 
              color={style.inscribedSphereColor || style.inscribedShapeColor || "#00ff88"} 
              transparent 
              opacity={style.inscribedShapeOpacity || 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Edges */}
        {options.inscribedSphereShowEdges && (
          <group>
            {createThickEdges(geometry, style.inscribedEdgeThickness || 2).map((edge, index) => 
              React.cloneElement(edge, {
                key: `inscribed-sphere-edge-${index}`,
                children: (
                  <meshBasicMaterial 
                    color={style.inscribedEdgeColor || style.inscribedSphereColor || style.inscribedShapeColor || "#00ff88"}
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
      {renderInscribedSphereInCube()}
      {renderInscribedSphereInCylinder()}
      {renderInscribedSphereInCone()}
    </>
  );
}