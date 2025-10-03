import * as THREE from 'three';
import { GeometryParams, VisualizationOptions } from '@/types/geometry';

export function getInscribedVertices(params: GeometryParams, options: VisualizationOptions): THREE.Vector3[] {
  const vertices: THREE.Vector3[] = [];
  
  if (params.type === 'sphere') {
    const { radius = 2 } = params;
    
    // Vértices do cubo inscrito
    if (options.showInscribedCube && options.inscribedCubeShowFaces) {
      const sideLength = (2 * radius) / Math.sqrt(3);
      const halfSide = sideLength / 2;
      vertices.push(
        new THREE.Vector3(-halfSide, radius - halfSide, -halfSide),
        new THREE.Vector3(halfSide, radius - halfSide, -halfSide),
        new THREE.Vector3(halfSide, radius - halfSide, halfSide),
        new THREE.Vector3(-halfSide, radius - halfSide, halfSide),
        new THREE.Vector3(-halfSide, radius + halfSide, -halfSide),
        new THREE.Vector3(halfSide, radius + halfSide, -halfSide),
        new THREE.Vector3(halfSide, radius + halfSide, halfSide),
        new THREE.Vector3(-halfSide, radius + halfSide, halfSide)
      );
    }
    
    // Vértices do octaedro inscrito
    if (options.showInscribedOctahedron && options.inscribedOctahedronShowFaces) {
      vertices.push(
        new THREE.Vector3(0, radius, 0),     // Top vertex
        new THREE.Vector3(radius, 0, 0),     // Right
        new THREE.Vector3(0, 0, radius),     // Front
        new THREE.Vector3(-radius, 0, 0),    // Left
        new THREE.Vector3(0, 0, -radius),    // Back
        new THREE.Vector3(0, -radius, 0)     // Bottom vertex
      );
    }
    
    // Vértices do cone inscrito
    if (options.showInscribedCone && options.inscribedConeShowFaces) {
      const coneHeight = radius * 1.6;
      const coneRadius = radius * 0.6;
      const coneY = radius + 0.3;
      
      // Vértice do cone
      vertices.push(new THREE.Vector3(0, coneY + coneHeight / 2, 0));
      
      // Vértices da base do cone - apenas 4 para reduzir vértices extras
      const baseSegments = 4;
      for (let i = 0; i < baseSegments; i++) {
        const angle = (i / baseSegments) * Math.PI * 2;
        vertices.push(new THREE.Vector3(
          coneRadius * Math.cos(angle),
          coneY - coneHeight / 2,
          coneRadius * Math.sin(angle)
        ));
      }
    }
    
    // Vértices do cilindro inscrito
    if (options.showInscribedCylinder && options.inscribedCylinderShowFaces) {
      const cylRadius = radius / Math.sqrt(2);
      const cylHeight = 2 * cylRadius;
      
      // Vértices da base superior (8 vértices) - centrados na esfera
      const topSegments = 8;
      for (let i = 0; i < topSegments; i++) {
        const angle = (i / topSegments) * Math.PI * 2;
        vertices.push(new THREE.Vector3(
          cylRadius * Math.cos(angle),
          cylHeight / 2, // Centrado na esfera
          cylRadius * Math.sin(angle)
        ));
      }
      
      // Vértices da base inferior (8 vértices) - centrados na esfera
      for (let i = 0; i < topSegments; i++) {
        const angle = (i / topSegments) * Math.PI * 2;
        vertices.push(new THREE.Vector3(
          cylRadius * Math.cos(angle),
          -cylHeight / 2, // Centrado na esfera
          cylRadius * Math.sin(angle)
        ));
      }
    }
  }
  
  return vertices;
}

export function getCircumscribedVertices(params: GeometryParams, options: VisualizationOptions): THREE.Vector3[] {
  const vertices: THREE.Vector3[] = [];
  
  if (params.type === 'sphere') {
    const { radius = 2 } = params;
    
    // Vértices do cubo circunscrito
    if (options.showCircumscribedCube && options.circumscribedCubeShowFaces) {
      const sideLength = 2 * radius;
      const halfSide = sideLength / 2;
      // Vértices do cubo circunscrito (centrado na esfera)
      vertices.push(
        new THREE.Vector3(-halfSide, -halfSide, -halfSide),  // Vértice inferior esquerdo traseiro
        new THREE.Vector3(halfSide, -halfSide, -halfSide),   // Vértice inferior direito traseiro
        new THREE.Vector3(halfSide, -halfSide, halfSide),    // Vértice inferior direito frontal
        new THREE.Vector3(-halfSide, -halfSide, halfSide),   // Vértice inferior esquerdo frontal
        new THREE.Vector3(-halfSide, halfSide, -halfSide),   // Vértice superior esquerdo traseiro
        new THREE.Vector3(halfSide, halfSide, -halfSide),    // Vértice superior direito traseiro
        new THREE.Vector3(halfSide, halfSide, halfSide),     // Vértice superior direito frontal
        new THREE.Vector3(-halfSide, halfSide, halfSide)      // Vértice superior esquerdo frontal
      );
    }
    
    // Vértices do cone circunscrito
    if (options.showCircumscribedCone && options.circumscribedConeShowFaces) {
      const sphereRadius = radius;
      const coneHeight = 4 * sphereRadius;
      const coneBaseRadius = 2 * sphereRadius;
      const coneY = coneHeight / 2;
      
      // Vértice do cone
      vertices.push(new THREE.Vector3(0, coneY + coneHeight / 2, 0));
      
      // Vértices da base do cone - apenas 4 para reduzir vértices extras
      const baseSegments = 4;
      for (let i = 0; i < baseSegments; i++) {
        const angle = (i / baseSegments) * Math.PI * 2;
        vertices.push(new THREE.Vector3(
          coneBaseRadius * Math.cos(angle),
          coneY - coneHeight / 2,
          coneBaseRadius * Math.sin(angle)
        ));
      }
    }
    
    // Vértices do cilindro circunscrito
    if (options.showCircumscribedCylinder && options.circumscribedCylinderShowFaces) {
      const cylRadius = radius;
      const cylHeight = 2 * radius;
      
      // Vértices da base superior (8 vértices) - posição correta do cilindro
      const topSegments = 8;
      for (let i = 0; i < topSegments; i++) {
        const angle = (i / topSegments) * Math.PI * 2;
        vertices.push(new THREE.Vector3(
          cylRadius * Math.cos(angle),
          cylHeight / 2, // Topo do cilindro
          cylRadius * Math.sin(angle)
        ));
      }
      
      // Vértices da base inferior (8 vértices) - posição correta do cilindro
      for (let i = 0; i < topSegments; i++) {
        const angle = (i / topSegments) * Math.PI * 2;
        vertices.push(new THREE.Vector3(
          cylRadius * Math.cos(angle),
          -cylHeight / 2, // Base do cilindro
          cylRadius * Math.sin(angle)
        ));
      }
    }
  }
  
  return vertices;
}
