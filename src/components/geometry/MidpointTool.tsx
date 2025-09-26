import React, { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { GeometryParams, StyleOptions } from '@/types/geometry';

interface MidpointToolProps {
  params: GeometryParams;
  style: StyleOptions;
  onStyleChange: (key: keyof StyleOptions, value: any) => void;
  onVertexSelect?: (vertexIndex: number) => void;
}

export default function MidpointTool({ params, style, onStyleChange, onVertexSelect }: MidpointToolProps) {
  // Não renderizar pontos médios quando estamos no modo de criação de planos
  // MAS apenas se não estivermos na ferramenta de ponto médio
  if (style.activeVertexMode === 'plane' && style.activeTool !== 'midpoint') {
    console.log('MidpointTool: Não renderizando pontos médios - modo de criação de planos ativo (não é ferramenta midpoint)');
    return null;
  }

  const [selectedVertices, setSelectedVertices] = useState<number[]>([]);
  const [midpointPairs, setMidpointPairs] = useState<{vertex1: number, vertex2: number}[]>([]);
  
  // Memoizar as posições dos vértices para otimizar performance
  const vertexPositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    
    if (params.type === 'cube') {
      const sideLength = params.sideLength || 2;
      const half = sideLength / 2;
      
      // Vértices do cubo (8 vértices)
      positions.push(
        new THREE.Vector3(-half, 0, -half),      // 0: bottom-left-back
        new THREE.Vector3(half, 0, -half),        // 1: bottom-right-back  
        new THREE.Vector3(half, 0, half),         // 2: bottom-right-front
        new THREE.Vector3(-half, 0, half),        // 3: bottom-left-front
        new THREE.Vector3(-half, sideLength, -half),   // 4: top-left-back
        new THREE.Vector3(half, sideLength, -half),    // 5: top-right-back
        new THREE.Vector3(half, sideLength, half),     // 6: top-right-front
        new THREE.Vector3(-half, sideLength, half)     // 7: top-left-front
      );
    } else if (params.type === 'tetrahedron') {
      const { sideLength = 2 } = params;
      const a = sideLength;
      const height = a * Math.sqrt(2/3);
      const R = a / Math.sqrt(3);
      
      // Vértices do tetraedro (4 vértices)
      positions.push(
        new THREE.Vector3(R * Math.cos(0), 0, R * Math.sin(0)),                    // 0: frente-direita
        new THREE.Vector3(R * Math.cos(2 * Math.PI / 3), 0, R * Math.sin(2 * Math.PI / 3)), // 1: frente-esquerda
        new THREE.Vector3(R * Math.cos(4 * Math.PI / 3), 0, R * Math.sin(4 * Math.PI / 3)), // 2: traseira
        new THREE.Vector3(0, height, 0)                                            // 3: topo
      );
    } else if (params.type === 'octahedron') {
      const { sideLength = 2 } = params;
      const a = sideLength;
      const height = a * Math.sqrt(2);
      
      // Vértices do octaedro (6 vértices)
      positions.push(
        new THREE.Vector3(0, height/2, 0),    // 0: top
        new THREE.Vector3(a/2, 0, 0),        // 1: right
        new THREE.Vector3(0, 0, a/2),         // 2: front
        new THREE.Vector3(-a/2, 0, 0),       // 3: left
        new THREE.Vector3(0, 0, -a/2),       // 4: back
        new THREE.Vector3(0, -height/2, 0)    // 5: bottom
      );
    } else if (params.type === 'dodecahedron') {
      const { sideLength = 2 } = params;
      const a = sideLength;
      const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
      const invPhi = 1 / phi;
      
      // Vértices do dodecaedro (20 vértices) - implementação simplificada
      const vertices = [
        // 8 vértices com coordenadas (±1, ±1, ±1)
        new THREE.Vector3(1, 1, 1).multiplyScalar(a/2),
        new THREE.Vector3(1, 1, -1).multiplyScalar(a/2),
        new THREE.Vector3(1, -1, 1).multiplyScalar(a/2),
        new THREE.Vector3(1, -1, -1).multiplyScalar(a/2),
        new THREE.Vector3(-1, 1, 1).multiplyScalar(a/2),
        new THREE.Vector3(-1, 1, -1).multiplyScalar(a/2),
        new THREE.Vector3(-1, -1, 1).multiplyScalar(a/2),
        new THREE.Vector3(-1, -1, -1).multiplyScalar(a/2),
        
        // 12 vértices com coordenadas (0, ±phi, ±1/phi), (±1/phi, 0, ±phi), (±phi, ±1/phi, 0)
        new THREE.Vector3(0, phi, invPhi).multiplyScalar(a/2),
        new THREE.Vector3(0, phi, -invPhi).multiplyScalar(a/2),
        new THREE.Vector3(0, -phi, invPhi).multiplyScalar(a/2),
        new THREE.Vector3(0, -phi, -invPhi).multiplyScalar(a/2),
        new THREE.Vector3(invPhi, 0, phi).multiplyScalar(a/2),
        new THREE.Vector3(invPhi, 0, -phi).multiplyScalar(a/2),
        new THREE.Vector3(-invPhi, 0, phi).multiplyScalar(a/2),
        new THREE.Vector3(-invPhi, 0, -phi).multiplyScalar(a/2),
        new THREE.Vector3(phi, invPhi, 0).multiplyScalar(a/2),
        new THREE.Vector3(phi, -invPhi, 0).multiplyScalar(a/2),
        new THREE.Vector3(-phi, invPhi, 0).multiplyScalar(a/2),
        new THREE.Vector3(-phi, -invPhi, 0).multiplyScalar(a/2)
      ];
      
      positions.push(...vertices);
    } else if (params.type === 'icosahedron') {
      const { sideLength = 2 } = params;
      const a = sideLength;
      
      // Vértices do icosaedro (12 vértices) - implementação básica e funcional
      const vertices = [
        // Vértices superiores (6 vértices)
        new THREE.Vector3(0, a/2, 0),           // 0: topo
        new THREE.Vector3(a/3, a/6, 0),         // 1: direita
        new THREE.Vector3(a/6, a/6, a/3),       // 2: frente-direita
        new THREE.Vector3(-a/6, a/6, a/3),      // 3: frente-esquerda
        new THREE.Vector3(-a/3, a/6, 0),        // 4: esquerda
        new THREE.Vector3(-a/6, a/6, -a/3),     // 5: trás-esquerda
        new THREE.Vector3(a/6, a/6, -a/3),      // 6: trás-direita
        
        // Vértices inferiores (5 vértices)
        new THREE.Vector3(0, -a/2, 0),          // 7: base
        new THREE.Vector3(a/3, -a/6, 0),        // 8: direita
        new THREE.Vector3(a/6, -a/6, -a/3),     // 9: frente-direita
        new THREE.Vector3(-a/6, -a/6, -a/3),    // 10: frente-esquerda
        new THREE.Vector3(-a/3, -a/6, 0)        // 11: esquerda
      ];
      
      positions.push(...vertices);
      
      console.log('=== ICOSAEDRO VÉRTICES DEBUG ===');
      console.log('Total de vértices:', vertices.length);
      console.log('Vértices calculados:', vertices.map((v, i) => `[${i}]: (${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`));
    } else if (params.type === 'cylinder') {
      const height = params.height || 4;
      const radius = params.radius || 2;
      const segments = 8;
      
      // Bottom base vertices
      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        positions.push(new THREE.Vector3(
          radius * Math.cos(angle),
          0,
          radius * Math.sin(angle)
        ));
      }
      
      // Top base vertices
      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        positions.push(new THREE.Vector3(
          radius * Math.cos(angle),
          height,
          radius * Math.sin(angle)
        ));
      }
    } else if (params.type === 'cone') {
      const height = params.height || 4;
      const radius = params.radius || 2;
      const segments = 8;
      
      // Base vertices
      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        positions.push(new THREE.Vector3(
          radius * Math.cos(angle),
          0,
          radius * Math.sin(angle)
        ));
      }
      
      // Apex
      positions.push(new THREE.Vector3(0, height, 0));
    } else if (params.type === 'prism' || params.type === 'pyramid') {
      const height = params.height || 4;
      const baseEdgeLength = params.baseEdgeLength || 2;
      const numSides = params.numSides || 5;
      const r = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
      
      if (params.type === 'prism') {
        // Bottom base vertices
        for (let i = 0; i < numSides; i++) {
          const angle = (i * 2 * Math.PI) / numSides;
          positions.push(new THREE.Vector3(
            r * Math.cos(angle),
            0,
            r * Math.sin(angle)
          ));
        }
        
        // Top base vertices
        for (let i = 0; i < numSides; i++) {
          const angle = (i * 2 * Math.PI) / numSides;
          positions.push(new THREE.Vector3(
            r * Math.cos(angle),
            height,
            r * Math.sin(angle)
          ));
        }
      } else if (params.type === 'pyramid') {
        // Base vertices
        for (let i = 0; i < numSides; i++) {
          const angle = (i * 2 * Math.PI) / numSides;
          positions.push(new THREE.Vector3(
            r * Math.cos(angle),
            0,
            r * Math.sin(angle)
          ));
        }
        
        // Apex
        positions.push(new THREE.Vector3(0, height, 0));
      }
    }
    
    return positions;
  }, [params.type, params.height, params.baseEdgeLength, params.numSides, params.sideLength, params.radius]);
  
  // Calcular pontos médios dinamicamente baseado nos pares de vértices
  const midpoints = useMemo(() => {
    const calculatedMidpoints = midpointPairs.map(pair => {
      const vertex1 = vertexPositions[pair.vertex1];
      const vertex2 = vertexPositions[pair.vertex2];
      if (vertex1 && vertex2) {
        const midpoint = new THREE.Vector3()
          .addVectors(vertex1, vertex2)
          .multiplyScalar(0.5);
        
        console.log('=== PONTO MÉDIO CALCULADO ===');
        console.log('Vértice 1:', pair.vertex1, vertex1);
        console.log('Vértice 2:', pair.vertex2, vertex2);
        console.log('Ponto médio:', midpoint);
        
        return midpoint;
      }
      return new THREE.Vector3(0, 0, 0);
    });
    
    console.log('=== TODOS OS PONTOS MÉDIOS ===');
    console.log('Total de pontos médios:', calculatedMidpoints.length);
    console.log('Pontos médios:', calculatedMidpoints.map((m, i) => `[${i}]: (${m.x.toFixed(2)}, ${m.y.toFixed(2)}, ${m.z.toFixed(2)})`));
    
    return calculatedMidpoints;
  }, [midpointPairs, vertexPositions]);
  
  // Função otimizada para extrair posições dos vértices
  const getVertexPositionFromMemo = (vertexIndex: number): THREE.Vector3 | null => {
    return vertexPositions[vertexIndex] || null;
  };

  // Limpar apenas a seleção quando a ferramenta muda, mas manter os pontos médios
  useEffect(() => {
    if (style.activeTool !== 'midpoint') {
      setSelectedVertices([]);
    }
  }, [style.activeTool]);

  // Limpar pontos médios quando a geometria muda
  useEffect(() => {
    console.log('=== GEOMETRIA MUDOU - LIMPANDO PONTOS MÉDIOS ===');
    console.log('Parâmetros atuais:', params);
    console.log('Pontos médios antes da limpeza:', midpointPairs.length);
    
    // Limpar todos os pontos médios quando a geometria muda
    setMidpointPairs([]);
    setSelectedVertices([]);
    
    console.log('Pontos médios limpos!');
  }, [
    params.type, 
    params.numSides, 
    params.height, 
    params.baseEdgeLength, 
    params.sideLength, 
    params.radius
  ]);

  const handleVertexClick = (vertexIndex: number) => {
    if (style.activeTool !== 'midpoint') return;

    if (selectedVertices.length < 2) {
      const newSelection = [...selectedVertices, vertexIndex];
      setSelectedVertices(newSelection);
      
      if (newSelection.length === 2) {
        // Armazenar par de vértices para cálculo dinâmico
        setMidpointPairs(prev => [...prev, {
          vertex1: newSelection[0],
          vertex2: newSelection[1]
        }]);
        
        // Limpar seleção para próxima operação
        setSelectedVertices([]);
      }
    }
  };


  // Integrar com o sistema de seleção existente
  useEffect(() => {
    const startTime = performance.now();
    console.log('=== MIDPOINT TOOL DEBUG ===');
    console.log('activeTool:', style.activeTool);
    console.log('selectedVerticesForGeneral:', style.selectedVerticesForGeneral);
    console.log('midpoints count:', midpoints.length);
    console.log('params.type:', params.type);
    console.log('params completos:', params);
    console.log('onStyleChange disponível:', !!onStyleChange);
    
    if (style.activeTool === 'midpoint') {
      console.log('Ferramenta ponto médio está ativa!');
      // Usar o sistema de seleção existente
      const currentSelection = style.selectedVerticesForGeneral || [];
      console.log('currentSelection:', currentSelection);
      
      if (currentSelection.length >= 2) {
        console.log('🎯 TEMOS 2 OU MAIS VÉRTICES SELECIONADOS!');
        console.log('Vértices selecionados:', currentSelection);
        console.log('Calculando ponto médio...');
        
        // Usar os dois primeiros vértices selecionados
        const vertex1Index = currentSelection[0];
        const vertex2Index = currentSelection[1];
        console.log('Vértice 1 (índice):', vertex1Index);
        console.log('Vértice 2 (índice):', vertex2Index);
        
        // Medir tempo de cálculo dos vértices
        const vertex1Start = performance.now();
        const vertex1 = getVertexPosition(vertex1Index);
        const vertex1Time = performance.now() - vertex1Start;
        console.log(`Vértice 1 (${vertex1Index}) calculado em ${vertex1Time.toFixed(2)}ms:`, vertex1);
        
        const vertex2Start = performance.now();
        const vertex2 = getVertexPosition(vertex2Index);
        const vertex2Time = performance.now() - vertex2Start;
        console.log(`Vértice 2 (${vertex2Index}) calculado em ${vertex2Time.toFixed(2)}ms:`, vertex2);
        
        if (vertex1 && vertex2) {
          // Armazenar par de vértices para cálculo dinâmico
          setMidpointPairs(prev => {
            const newPairs = [...prev, {
              vertex1: vertex1Index,
              vertex2: vertex2Index
            }];
            console.log('🎯 NOVOS PARES DE VÉRTICES CRIADOS:', newPairs);
            console.log('Total de pares:', newPairs.length);
            return newPairs;
          });
          
          // Limpar apenas a seleção atual, mantendo os pontos médios
          onStyleChange('selectedVerticesForGeneral', []);
        } else {
          console.log('ERRO: Não foi possível obter posições dos vértices');
        }
      } else {
        console.log('Ainda não temos 2 vértices selecionados');
        console.log('Vértices selecionados até agora:', currentSelection);
        console.log('DICA: Clique em um vértice DIFERENTE para criar o ponto médio!');
        console.log('Vértices disponíveis no prisma: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 (base inferior + base superior)');
      }
    } else {
      console.log('Ferramenta ponto médio NÃO está ativa. activeTool:', style.activeTool);
    }
    
    const totalTime = performance.now() - startTime;
    console.log(`MidpointTool useEffect executado em ${totalTime.toFixed(2)}ms`);
  }, [style.selectedVerticesForGeneral, style.activeTool, onStyleChange, params.type]);

  // Manter pontos médios visíveis mesmo quando não está na ferramenta midpoint
  useEffect(() => {
    // Não limpar pontos médios quando muda de ferramenta
    // Apenas limpar a seleção atual
    if (style.activeTool !== 'midpoint') {
      setSelectedVertices([]);
    }
  }, [style.activeTool]);

  const getVertexPosition = (vertexIndex: number): THREE.Vector3 | null => {
    const startTime = performance.now();
    console.log('=== getVertexPosition DEBUG ===');
    console.log('vertexIndex:', vertexIndex);
    console.log('params.type:', params.type);
    console.log('params completos:', params);
    console.log('midpoints.length:', midpoints.length);
    console.log('vertexPositions.length:', vertexPositions.length);
    
    // Se for um ponto médio (índice >= baseVertexCount), retornar a posição do ponto médio
    const baseVertexCount = getBaseVertexCount();
    if (vertexIndex >= baseVertexCount) {
      const midpointIndex = vertexIndex - baseVertexCount;
      console.log('É um ponto médio, índice:', midpointIndex);
      const result = midpoints[midpointIndex] || null;
      console.log('Resultado do ponto médio:', result);
      return result;
    }

    // Para vértices normais, usar posições baseadas no tipo de geometria
    const { type } = params;
    console.log('Tipo de geometria:', type);

    if (type === 'cube') {
      const sideLength = params.sideLength || 2;
      const half = sideLength / 2;
      const vertices = [
        new THREE.Vector3(-half, 0, -half),      // 0: bottom-left-back
        new THREE.Vector3(half, 0, -half),       // 1: bottom-right-back
        new THREE.Vector3(half, 0, half),        // 2: bottom-right-front
        new THREE.Vector3(-half, 0, half),       // 3: bottom-left-front
        new THREE.Vector3(-half, sideLength, -half),   // 4: top-left-back
        new THREE.Vector3(half, sideLength, -half),    // 5: top-right-back
        new THREE.Vector3(half, sideLength, half),     // 6: top-right-front
        new THREE.Vector3(-half, sideLength, half)     // 7: top-left-front
      ];
      console.log('Vértice do cubo:', vertices[vertexIndex]);
      return vertices[vertexIndex] || null;
    }

    if (type === 'tetrahedron') {
      const a = params.sideLength || 2;
      const height = a * Math.sqrt(2/3);
      const R = a / Math.sqrt(3);
      
      const vertices = [
        new THREE.Vector3(R * Math.cos(0), 0, R * Math.sin(0)),
        new THREE.Vector3(R * Math.cos(2 * Math.PI / 3), 0, R * Math.sin(2 * Math.PI / 3)),
        new THREE.Vector3(R * Math.cos(4 * Math.PI / 3), 0, R * Math.sin(4 * Math.PI / 3)),
        new THREE.Vector3(0, height, 0)
      ];
      console.log('Vértice do tetraedro:', vertices[vertexIndex]);
      return vertices[vertexIndex] || null;
    }

    if (type === 'octahedron') {
      const a = params.sideLength || 2;
      const d = a / Math.sqrt(2);
      
      const vertices = [
        new THREE.Vector3(d, d, 0),    // 0: +X
        new THREE.Vector3(-d, d, 0),   // 1: -X
        new THREE.Vector3(0, d + d, 0), // 2: +Y (superior)
        new THREE.Vector3(0, 0, 0),     // 3: -Y (inferior)
        new THREE.Vector3(0, d, d),     // 4: +Z
        new THREE.Vector3(0, d, -d)     // 5: -Z
      ];
      console.log('Vértice do octaedro:', vertices[vertexIndex]);
      return vertices[vertexIndex] || null;
    }

    if (type === 'cylinder') {
      const radius = params.radius || 2;
      const height = params.height || 4;

      if (vertexIndex < 8) {
        // Base inferior
        const angle = (vertexIndex * 2 * Math.PI) / 8;
        const pos = new THREE.Vector3(
          radius * Math.cos(angle),
          0,
          radius * Math.sin(angle)
        );
        console.log('Vértice do cilindro (base):', pos);
        return pos;
      } else {
        // Base superior
        const angle = ((vertexIndex - 8) * 2 * Math.PI) / 8;
        const pos = new THREE.Vector3(
          radius * Math.cos(angle),
          height,
          radius * Math.sin(angle)
        );
        console.log('Vértice do cilindro (topo):', pos);
        return pos;
      }
    }

    if (type === 'cone') {
      const radius = params.radius || 2;
      const height = params.height || 4;

      if (vertexIndex < 8) {
        // Base circular
        const angle = (vertexIndex * 2 * Math.PI) / 8;
        const pos = new THREE.Vector3(
          radius * Math.cos(angle),
          0,
          radius * Math.sin(angle)
        );
        console.log('Vértice do cone (base):', pos);
        return pos;
      } else if (vertexIndex === 8) {
        // Ápice
        const pos = new THREE.Vector3(0, height, 0);
        console.log('Vértice do cone (ápice):', pos);
        return pos;
      }
    }

    if (type === 'dodecahedron') {
      const sideLength = params.sideLength || 2;
      const radius = sideLength * (Math.sqrt(3) * (1 + Math.sqrt(5))) / 4;
      const geometry = new THREE.DodecahedronGeometry(radius);
      geometry.translate(0, radius, 0);
      
      const uniqueVertices = new Map<string, THREE.Vector3>();
      const positions = geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const vertex = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
        const key = `${vertex.x.toFixed(4)},${vertex.y.toFixed(4)},${vertex.z.toFixed(4)}`;
        if (!uniqueVertices.has(key)) {
          uniqueVertices.set(key, vertex);
        }
      }
      
      const vertices = Array.from(uniqueVertices.values());
      console.log('Vértice do dodecaedro:', vertices[vertexIndex]);
      return vertices[vertexIndex] || null;
    }

    if (type === 'icosahedron') {
      const sideLength = params.sideLength || 2;
      const phi = (1 + Math.sqrt(5)) / 2; // Número áureo
      const radius = (sideLength * phi) / (2 * Math.sin(Math.PI / 5));
      
      // Usar vértices manuais para garantir consistência
      const scale = radius / Math.sqrt(phi * phi + 1);
      
      const verticesArray = [
        [0, 1, phi], [0, 1, -phi], [0, -1, phi], [0, -1, -phi],
        [1, phi, 0], [1, -phi, 0], [-1, phi, 0], [-1, -phi, 0],
        [phi, 0, 1], [phi, 0, -1], [-phi, 0, 1], [-phi, 0, -1]
      ];
      
      const vertices = verticesArray.map(([x, y, z]) => 
        new THREE.Vector3(x * scale, y * scale + radius, z * scale)
      );
      console.log('Vértice do icosaedro:', vertices[vertexIndex]);
      return vertices[vertexIndex] || null;
    }

    // Para prismas e pirâmides - usar a versão otimizada com memoização
    if (type === 'prism' || type === 'pyramid') {
      console.log('Usando posições memoizadas para', type);
      console.log('vertexPositions disponíveis:', vertexPositions.length);
      console.log('vertexIndex solicitado:', vertexIndex);
      
      const position = getVertexPositionFromMemo(vertexIndex);
      if (position) {
        console.log(`✅ Vértice ${vertexIndex} do ${type} encontrado:`, position);
        return position;
      } else {
        console.log(`❌ Vértice ${vertexIndex} do ${type} NÃO encontrado!`);
        console.log('Índices disponíveis: 0 até', vertexPositions.length - 1);
      }
    }

    // Fallback genérico
    const angle = (vertexIndex * 2 * Math.PI) / 8;
    const radius = 2;
    const pos = new THREE.Vector3(
      radius * Math.cos(angle),
      0,
      radius * Math.sin(angle)
    );
    
    const endTime = performance.now();
    console.log(`getVertexPosition executado em ${(endTime - startTime).toFixed(2)}ms`);
    console.log('Posição fallback:', pos);
    console.log('ERRO: Não foi possível encontrar posição para o vértice', vertexIndex);
    return pos;
  };

  // Função para obter o número base de vértices da geometria
  const getBaseVertexCount = (): number => {
    const { type } = params;
    
    switch (type) {
      case 'cube': return 8;
      case 'tetrahedron': return 4;
      case 'octahedron': return 6;
      case 'dodecahedron': return 20;
      case 'icosahedron': return 12;
      case 'cylinder': return 16; // 8 base + 8 topo
      case 'cone': return 9; // 8 base + 1 ápice
      case 'prism': {
        const numSides = params.numSides || 5;
        return numSides * 2; // base + topo
      }
      case 'pyramid': {
        const numSides = params.numSides || 5;
        return numSides + 1; // base + ápice
      }
      default: return 8;
    }
  };

  // Função para limpar todos os pontos médios
  const clearAllMidpoints = () => {
    setMidpoints([]);
  };

  // Expor função para limpeza externa e pontos médios para o sistema de vértices
  useEffect(() => {
    if (onStyleChange) {
      // Adicionar função de limpeza ao contexto se necessário
      onStyleChange('clearMidpoints', clearAllMidpoints);
      // Expor pontos médios para serem usados como vértices normais
      onStyleChange('midpoints', midpoints);
    }
  }, [onStyleChange, midpoints]);

  return (
    <group>
      {/* Renderizar pontos médios - sempre visíveis e clicáveis */}
      {midpoints.map((midpoint, index) => {
        console.log(`🎯 RENDERIZANDO PONTO MÉDIO ${index}:`, midpoint);
        return (
          <group key={`midpoint-${index}`}>
            <mesh 
              position={midpoint}
              onClick={(e) => {
                e.stopPropagation();
                console.log(`🎯 CLIQUE NO PONTO MÉDIO ${index}`);
                console.log('Posição do ponto médio:', midpoint);
                // Permitir que o ponto médio seja usado como vértice clicável
                // Usar índice baseado no número total de vértices da geometria + índice do ponto médio
                const baseVertexCount = getBaseVertexCount();
                const finalIndex = baseVertexCount + index;
                console.log('Base vertex count:', baseVertexCount);
                console.log('Índice final calculado:', finalIndex);
                console.log('onVertexSelect disponível:', !!onVertexSelect);
                onVertexSelect?.(finalIndex);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                console.log(`🎯 POINTER DOWN NO PONTO MÉDIO ${index}`);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'default';
              }}
              renderOrder={10} // Maior que vértices normais para ficar por cima
            >
              <sphereGeometry args={[0.08]} />
              <meshBasicMaterial 
                color="#ff0000" 
                transparent
                opacity={1.0}
              />
            </mesh>
          </group>
        );
      })}
      
      {/* Renderizar vértices selecionados apenas quando a ferramenta está ativa */}
      {style.activeTool === 'midpoint' && selectedVertices.map((vertexIndex, index) => {
        const position = getVertexPosition(vertexIndex);
        if (!position) return null;
        
        return (
           <mesh key={`selected-${vertexIndex}`} position={position}>
             <sphereGeometry args={[0.06]} />
             <meshBasicMaterial 
               color="#4ecdc4" 
               transparent
               opacity={0.9}
             />
           </mesh>
        );
      })}
    </group>
  );
}
