import React from 'react';
import * as THREE from 'three';
import { GeometryParams, StyleOptions, VisualizationOptions } from '../../types/geometry';

interface MeridianSectionForVerticesProps {
  params: GeometryParams;
  style: StyleOptions;
  options: VisualizationOptions;
  selectedVertices: number[];
  vertices: THREE.Vector3[];
}

export function MeridianSectionForVertices({ 
  params, 
  style, 
  options,
  selectedVertices, 
  vertices 
}: MeridianSectionForVerticesProps) {
  // Seção meridiana permanece visível independente da ferramenta ativa
  // Só some se não tiver 2 vértices selecionados ou geometria não suportada
  if (selectedVertices.length !== 2 || !['cube', 'prism', 'pyramid', 'cylinder', 'cone'].includes(params.type)) {
    return null;
  }

  // Obter posições dos vértices baseado no tipo de geometria
  let vertexPositions: THREE.Vector3[] = [];
  
  if (params.type === 'cube') {
    const side = params.sideLength || 2;
    const half = side / 2;
    vertexPositions = [
      new THREE.Vector3(-half, 0, -half),      // 0: base frente esquerda
      new THREE.Vector3(half, 0, -half),       // 1: base frente direita  
      new THREE.Vector3(half, 0, half),        // 2: base tras direita
      new THREE.Vector3(-half, 0, half),       // 3: base tras esquerda
      new THREE.Vector3(-half, side, -half),   // 4: topo frente esquerda
      new THREE.Vector3(half, side, -half),    // 5: topo frente direita
      new THREE.Vector3(half, side, half),     // 6: topo tras direita
      new THREE.Vector3(-half, side, half),    // 7: topo tras esquerda
    ];
  } else if (params.type === 'prism') {
    const sides = params.numSides || 6;
    const radius = params.radius || 1;
    const height = params.height || 3;
    
    vertexPositions = [];
    // Base inferior
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      vertexPositions.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }
    // Base superior
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      vertexPositions.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      ));
    }
  } else if (params.type === 'pyramid') {
    const sides = params.numSides || 4;
    const baseEdgeLength = params.baseEdgeLength || 2;
    const height = params.height || 3;
    const baseRadius = baseEdgeLength / (2 * Math.sin(Math.PI / sides));
    
    vertexPositions = [];
    // Base da pirâmide
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      vertexPositions.push(new THREE.Vector3(
        baseRadius * Math.cos(angle),
        0,
        baseRadius * Math.sin(angle)
      ));
    }
    // Ápice da pirâmide
    vertexPositions.push(new THREE.Vector3(0, height, 0));
  } else if (params.type === 'cylinder') {
    const radius = params.radius || 1;
    const height = params.height || 3;
    const segments = 8; // 8 vértices virtuais na base
    
    vertexPositions = [];
    // Base inferior
    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      vertexPositions.push(new THREE.Vector3(
        radius * Math.cos(angle),
        0,
        radius * Math.sin(angle)
      ));
    }
    // Base superior
    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      vertexPositions.push(new THREE.Vector3(
        radius * Math.cos(angle),
        height,
        radius * Math.sin(angle)
      ));
    }
  } else if (params.type === 'cone') {
    const radius = params.radius || 1;
    const height = params.height || 3;
    const segments = 8; // 8 vértices virtuais na base
    
    vertexPositions = [];
    // Base do cone
    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      vertexPositions.push(new THREE.Vector3(
        radius * Math.cos(angle),
        0,
        radius * Math.sin(angle)
      ));
    }
    // Ápice do cone
    vertexPositions.push(new THREE.Vector3(0, height, 0));
  }

  const vertex1 = vertexPositions[selectedVertices[0]];
  const vertex2 = vertexPositions[selectedVertices[1]];
  
  if (!vertex1 || !vertex2) return null;

  // Calcular o centro entre os dois vértices baseado na altura da seção meridiana
  const heightFactor = options.meridianSectionHeight;
  const geometryHeight = params.type === 'cube' ? (params.sideLength || 2) : (params.height || 3);
  const sectionY = geometryHeight * heightFactor;
  
  // Centro do plano na altura especificada
  const center = new THREE.Vector3()
    .addVectors(vertex1, vertex2)
    .multiplyScalar(0.5);
  center.y = sectionY;

  // Direção entre os dois vértices
  const direction = new THREE.Vector3().subVectors(vertex2, vertex1).normalize();
  
  // Normal do plano base (sempre Y para cima)
  const baseNormal = new THREE.Vector3(0, 1, 0);
  
  // Normal do plano meridiano (perpendicular à base e contém os dois vértices)
  const planeNormal = new THREE.Vector3().crossVectors(direction, baseNormal);
  
  // Se a normal é muito pequena, usar direção X como fallback
  if (planeNormal.length() < 0.001) {
    planeNormal.set(1, 0, 0);
  } else {
    planeNormal.normalize();
  }

  // Tamanho do plano similar à seção transversal
  const size = params.type === 'cube' 
    ? (params.sideLength || 2) * 2.2 
    : params.type === 'pyramid'
    ? ((params.baseEdgeLength || 2) / (2 * Math.sin(Math.PI / (params.numSides || 4)))) * 2.5
    : (params.radius || 1) * 4;
  
  // Altura do plano - vai da altura selecionada até a base
  const planeHeight = sectionY + 0.1; // Um pouco extra para garantir que chegue à base
  
  // Ajustar o centro para que o plano vá da altura selecionada até a base
  const adjustedCenter = center.clone();
  adjustedCenter.y = sectionY / 2;

  // Quaternion para orientar o plano
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    planeNormal
  );

  return (
    <group>
      {/* Plano meridiano */}
      <mesh 
        position={adjustedCenter} 
        quaternion={quaternion}
      >
        <planeGeometry args={[size, planeHeight]} />
        <meshBasicMaterial 
          color={style.meridianSectionColor || "#00ffff"}
          opacity={0.4}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Contorno do plano */}
      <lineSegments position={adjustedCenter} quaternion={quaternion}>
        <edgesGeometry args={[new THREE.PlaneGeometry(size, planeHeight)]} />
        <lineBasicMaterial 
          color={style.meridianSectionColor || "#00ffff"} 
          linewidth={2}
        />
      </lineSegments>
      
      {/* Linha de referência entre os vértices selecionados */}
      <lineSegments>
        <bufferGeometry>
          {(() => {
            const points = [vertex1, vertex2];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            return <primitive object={geometry} />;
          })()}
        </bufferGeometry>
        <lineBasicMaterial 
          color="#ffffff" 
          linewidth={3}
        />
      </lineSegments>
      
      
    </group>
  );
}