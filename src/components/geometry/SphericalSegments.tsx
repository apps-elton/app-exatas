import React from 'react';
import { GeometryParams, VisualizationOptions } from '@/types/geometry';
import * as THREE from 'three';

interface SphericalSegmentsProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: any; // StyleOptions
}

export default function SphericalSegments({ params, options, style }: SphericalSegmentsProps) {
  // Fuso esférico (spherical lune) - apenas superfície destacada entre dois meridianos
  const renderSphericalLune = () => {
    if (params.type !== 'sphere' || !options.showSphericalSegment) return null;
    
    const { radius = 2 } = params;
    const angle = (options.sphereSegmentAngle * Math.PI) / 180;
    
    // Criar geometria de esfera com alta resolução para superfície fluida (apenas a superfície)
    const geometry = new THREE.SphereGeometry(
      radius * 1.005, // Muito próximo da esfera para ficar destacado
      128, // Alta resolução para superfície fluida
      64,  // Alta resolução para superfície fluida
      0,   // thetaStart
      angle // thetaLength - ângulo do fuso
    );
    
    return (
      <mesh position={[0, radius, 0]}>
        <primitive object={geometry} />
        <meshStandardMaterial 
          color={style?.sphericalSegmentColor || "#6366f1"} 
          transparent 
          opacity={Math.min(style?.sphericalSegmentOpacity || 0.8, 0.9)}
          side={THREE.DoubleSide}
          roughness={0.0}
          metalness={0.1}
          emissive={style?.sphericalSegmentColor || "#6366f1"}
          emissiveIntensity={0.1}
        />
      </mesh>
    );
  };

  // Cunha esférica (spherical wedge) - gomo de laranja destacado
  const renderSphericalWedge = () => {
    if (params.type !== 'sphere' || !options.showSphericalSector) return null;
    
    const { radius = 2 } = params;
    const angle = (options.sphereSegmentAngle * Math.PI) / 180;
    
    // Criar grupo com múltiplas camadas para efeito de gomo
    const gomoGroup = [];
    
    // Camada externa (superfície brilhante)
    const outerGeometry = new THREE.SphereGeometry(
      radius * 1.01, // Maior que a esfera
      64, // Alta resolução
      32, // Alta resolução
      0, // thetaStart
      angle, // thetaLength - ângulo horizontal
      0, // phiStart
      Math.PI // phiLength - esfera completa verticalmente
    );
    
    gomoGroup.push(
      <mesh key="outer" position={[0, radius, 0]}>
        <primitive object={outerGeometry} />
        <meshStandardMaterial 
          color={style?.sphericalSegmentColor || "#ff8c00"} 
          transparent 
          opacity={Math.min(style?.sphericalSegmentOpacity || 0.85, 0.95)}
          side={THREE.DoubleSide}
          roughness={0.2}
          metalness={0.3}
          emissive={style?.sphericalSegmentColor || "#ff8c00"}
          emissiveIntensity={0.15}
        />
      </mesh>
    );
    
    // Camada interna (polpa do gomo)
    const innerGeometry = new THREE.SphereGeometry(
      radius * 0.98, // Menor que a esfera
      32, // Resolução menor
      16, // Resolução menor
      0, // thetaStart
      angle, // thetaLength
      0, // phiStart
      Math.PI // phiLength
    );
    
    gomoGroup.push(
      <mesh key="inner" position={[0, radius, 0]}>
        <primitive object={innerGeometry} />
        <meshStandardMaterial 
          color={style?.sphericalSegmentColor || "#ffa500"} 
          transparent 
          opacity={Math.min(style?.sphericalSegmentOpacity || 0.6, 0.8)}
          side={THREE.DoubleSide}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
    );
    
    return <group>{gomoGroup}</group>;
  };

  // Linhas demarcadoras do ângulo - melhoradas
  const renderAngleLines = () => {
    if (params.type !== 'sphere' || (!options.showSphericalSegment && !options.showSphericalSector)) return null;
    
    const { radius = 2 } = params;
    const angle = (options.sphereSegmentAngle * Math.PI) / 180;
    const sphereY = radius; // Centro da esfera
    
    // Linhas de meridiano mais elegantes
    const meridianLines: THREE.Vector3[] = [];
    const numMeridians = 8;
    
    for (let i = 0; i <= numMeridians; i++) {
      const currentAngle = (angle * i) / numMeridians;
      
      // Linha do meridiano do polo sul ao polo norte
      for (let j = 0; j <= 32; j++) {
        const phi = (j * Math.PI) / 32;
        const x = radius * Math.sin(phi) * Math.cos(currentAngle);
        const y = sphereY + radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(currentAngle);
        
        meridianLines.push(new THREE.Vector3(x, y, z));
        
        if (j < 32) {
          const phi2 = ((j + 1) * Math.PI) / 32;
          const x2 = radius * Math.sin(phi2) * Math.cos(currentAngle);
          const y2 = sphereY + radius * Math.cos(phi2);
          const z2 = radius * Math.sin(phi2) * Math.sin(currentAngle);
          meridianLines.push(new THREE.Vector3(x2, y2, z2));
        }
      }
    }
    
    // Paralelos para delimitar melhor o segmento
    const parallelLines: THREE.Vector3[] = [];
    const numParallels = 6;
    
    for (let i = 1; i < numParallels; i++) {
      const phi = (i * Math.PI) / numParallels;
      const y = sphereY + radius * Math.cos(phi);
      const parallelRadius = radius * Math.sin(phi);
      
      const segments = 32;
      for (let j = 0; j < segments; j++) {
        const currentAngle = (angle * j) / segments;
        const nextAngle = (angle * (j + 1)) / segments;
        
        const x1 = parallelRadius * Math.cos(currentAngle);
        const z1 = parallelRadius * Math.sin(currentAngle);
        const x2 = parallelRadius * Math.cos(nextAngle);
        const z2 = parallelRadius * Math.sin(nextAngle);
        
        parallelLines.push(new THREE.Vector3(x1, y, z1));
        parallelLines.push(new THREE.Vector3(x2, y, z2));
      }
    }
    
    const meridianGeometry = new THREE.BufferGeometry().setFromPoints(meridianLines);
    const parallelGeometry = new THREE.BufferGeometry().setFromPoints(parallelLines);
    
    return (
      <group>
        {/* Meridianos */}
        <lineSegments geometry={meridianGeometry}>
          <lineBasicMaterial 
            color={style?.sphericalSegmentColor || "#4f46e5"} 
            transparent 
            opacity={0.8}
          />
        </lineSegments>
        
        {/* Paralelos */}
        <lineSegments geometry={parallelGeometry}>
          <lineBasicMaterial 
            color={style?.sphericalSegmentColor || "#7c3aed"} 
            transparent 
            opacity={0.6}
          />
        </lineSegments>
        
        {/* Indicador do ângulo */}
        <mesh position={[radius * 0.6 * Math.cos(angle/2), sphereY + 0.3, radius * 0.6 * Math.sin(angle/2)]}>
          <sphereGeometry args={[0.03]} />
          <meshBasicMaterial color={style?.sphericalSegmentColor || "#fbbf24"} />
        </mesh>
      </group>
    );
  };

  return (
    <>
      {renderSphericalLune()}
      {renderSphericalWedge()}
      {renderAngleLines()}
    </>
  );
}

// Componente auxiliar para desenhar arco
function Arc({ center, radius, startAngle, endAngle, color }: {
  center: [number, number, number];
  radius: number;
  startAngle: number;
  endAngle: number;
  color: string;
}) {
  const points: THREE.Vector3[] = [];
  const segments = 32;
  
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / segments);
    points.push(new THREE.Vector3(
      center[0] + radius * Math.cos(angle),
      center[1],
      center[2] + radius * Math.sin(angle)
    ));
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} linewidth={2} />
    </lineSegments>
  );
}