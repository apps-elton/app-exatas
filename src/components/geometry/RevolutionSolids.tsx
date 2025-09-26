import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GeometryParams, VisualizationOptions, StyleOptions } from '@/types/geometry';

interface RevolutionSolidsProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
  onVertexSelect?: (vertexIndex: number) => void;
  onStyleChange?: (key: keyof StyleOptions, value: any) => void;
}

export default function RevolutionSolids({ 
  params, 
  options, 
  style, 
  onVertexSelect, 
  onStyleChange 
}: RevolutionSolidsProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [revolutionAngle, setRevolutionAngle] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastAxis, setLastAxis] = useState(params.revolutionAxis || 'y');

  // Detectar mudança de eixo e resetar rotação
  useEffect(() => {
    const currentAxis = params.revolutionAxis || 'y';
    if (currentAxis !== lastAxis) {
      setRevolutionAngle(0);
      setLastAxis(currentAxis);
      if (meshRef.current) {
        meshRef.current.rotation.set(0, 0, 0);
      }
    }
  }, [params.revolutionAxis, lastAxis]);

  // Criar geometria base para revolução
  const createBaseGeometry = (): THREE.BufferGeometry => {
    switch (params.revolutionType) {
      case 'triangle':
        return createTriangleGeometry();
      case 'rectangle':
        return createRectangleGeometry();
      case 'semicircle':
        return createSemicircleGeometry();
      case 'trapezoid':
        return createTrapezoidGeometry();
      default:
        return createTriangleGeometry(); // Default para triângulo
    }
  };

  // Triângulo retângulo
  const createTriangleGeometry = (): THREE.BufferGeometry => {
    const base = params.triangleBase || 2;
    const height = params.triangleHeight || 2;
    
    const geometry = new THREE.BufferGeometry();
    const vertices = [
      // Vértices do triângulo retângulo
      new THREE.Vector3(0, 0, 0),           // Vértice do ângulo reto
      new THREE.Vector3(base, 0, 0),        // Base do triângulo
      new THREE.Vector3(0, height, 0),      // Altura do triângulo
    ];
    
    const indices = [0, 1, 2]; // Triângulo
    geometry.setFromPoints(vertices);
    geometry.setIndex(indices);
    
    return geometry;
  };

  // Retângulo
  const createRectangleGeometry = (): THREE.BufferGeometry => {
    const width = params.rectangleWidth || 2;
    const height = params.rectangleHeight || 1;
    
    const geometry = new THREE.BufferGeometry();
    const vertices = [
      new THREE.Vector3(0, 0, 0),           // Canto inferior esquerdo
      new THREE.Vector3(width, 0, 0),        // Canto inferior direito
      new THREE.Vector3(width, height, 0),   // Canto superior direito
      new THREE.Vector3(0, height, 0),       // Canto superior esquerdo
    ];
    
    const indices = [
      0, 1, 2,  // Primeiro triângulo
      0, 2, 3   // Segundo triângulo
    ];
    geometry.setFromPoints(vertices);
    geometry.setIndex(indices);
    
    return geometry;
  };

  // Semicírculo
  const createSemicircleGeometry = (): THREE.BufferGeometry => {
    const radius = params.semicircleRadius || 2;
    const segments = 32;
    
    const geometry = new THREE.BufferGeometry();
    const vertices: THREE.Vector3[] = [];
    const indices: number[] = [];
    
    // Centro do semicírculo para preenchimento
    vertices.push(new THREE.Vector3(0, radius, 0));
    
    // Semicírculo no plano XY: diâmetro ao longo do eixo Y (vertical)
    // Uma extremidade em (0, 0, 0) e outra em (0, 2*radius, 0)
    for (let i = 0; i <= segments; i++) {
      const angle = (i * Math.PI) / segments; // 0 a π
      const x = radius * Math.sin(angle);  // Coordenada X para a curva
      const y = radius * Math.cos(angle) + radius; // Coordenada Y, deslocada para cima
      vertices.push(new THREE.Vector3(x, y, 0));
    }
    
    // Criar triângulos para preencher o semicírculo
    for (let i = 1; i <= segments; i++) {
      indices.push(0, i, i + 1);
    }
    
    geometry.setFromPoints(vertices);
    geometry.setIndex(indices);
    return geometry;
  };

  // Trapézio
  const createTrapezoidGeometry = (): THREE.BufferGeometry => {
    const topBase = params.trapezoidTopBase || 1;
    const bottomBase = params.trapezoidBottomBase || 2;
    const height = params.trapezoidHeight || 1;
    
    const geometry = new THREE.BufferGeometry();
    const vertices = [
      new THREE.Vector3(-bottomBase/2, 0, 0),        // Canto inferior esquerdo
      new THREE.Vector3(bottomBase/2, 0, 0),         // Canto inferior direito
      new THREE.Vector3(topBase/2, height, 0),       // Canto superior direito
      new THREE.Vector3(-topBase/2, height, 0),      // Canto superior esquerdo
    ];
    
    const indices = [
      0, 1, 2,  // Primeiro triângulo
      0, 2, 3   // Segundo triângulo
    ];
    geometry.setFromPoints(vertices);
    geometry.setIndex(indices);
    
    return geometry;
  };

  // Criar sólido de revolução com progresso e animação de construção
  const createRevolutionSolid = (): THREE.BufferGeometry => {
    const baseGeometry = createBaseGeometry();
    const axis = params.revolutionAxis || 'y';
    const segments = 32;
    const progress = params.revolutionProgress || 0;
    
    // Criar geometria de revolução usando LatheGeometry
    const points: THREE.Vector3[] = [];
    
    // Extrair pontos da geometria base
    const positions = baseGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      points.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
    }
    
    // Criar geometria de revolução com progresso limitado
    const revolutionGeometry = new THREE.LatheGeometry(points, segments, 0, Math.PI * 2 * progress);
    
    return revolutionGeometry;
  };

  // Criar efeito de construção progressiva
  const createConstructionEffect = (): THREE.BufferGeometry => {
    const baseGeometry = createBaseGeometry();
    const progress = params.revolutionProgress || 0;
    const segments = 32;
    
    // Criar pontos da geometria base
    const points: THREE.Vector3[] = [];
    const positions = baseGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      points.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
    }
    
    // Calcular quantos segmentos mostrar baseado no progresso
    const visibleSegments = Math.floor(segments * progress);
    
    // Criar geometria com segmentos limitados para efeito de construção
    const constructionGeometry = new THREE.LatheGeometry(
      points, 
      segments, 
      0, 
      Math.PI * 2 * progress,
      visibleSegments
    );
    
    return constructionGeometry;
  };

  // Animação de revolução
  useFrame((state, delta) => {
    const shouldAnimate = params.isAnimating || isAnimating;
    if (shouldAnimate && meshRef.current) {
      const speed = (params.revolutionSpeed || 1) * 2; // Dobrar a velocidade
      const newAngle = revolutionAngle + delta * speed;
      setRevolutionAngle(newAngle);
      
      // Atualizar progresso da revolução (mais rápido)
      const progress = Math.min((newAngle % (Math.PI * 2)) / (Math.PI * 2), 1);
      if (onStyleChange) {
        onStyleChange('revolutionProgress', progress);
      }
      
      // Rotacionar o mesh baseado no eixo atual
      const axis = params.revolutionAxis || 'y';
      if (axis === 'x') {
        meshRef.current.rotation.x = newAngle;
        meshRef.current.rotation.y = 0;
        meshRef.current.rotation.z = 0;
      } else if (axis === 'y') {
        meshRef.current.rotation.x = 0;
        meshRef.current.rotation.y = newAngle;
        meshRef.current.rotation.z = 0;
      } else if (axis === 'z') {
        meshRef.current.rotation.x = 0;
        meshRef.current.rotation.y = 0;
        meshRef.current.rotation.z = newAngle;
      }
    }
  });

  // Controles de animação
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  const resetRevolution = () => {
    setRevolutionAngle(0);
    if (meshRef.current) {
      meshRef.current.rotation.set(0, 0, 0);
    }
  };

  const geometry = createRevolutionSolid();
  const constructionGeometry = createConstructionEffect();

  return (
    <group scale={[2, 2, 2]} position={[0, 0, 0]}>
      {/* Forma 2D (se habilitada) */}
      {params.show2DShape !== false && (
        <mesh geometry={createBaseGeometry()} position={params.revolutionType === 'semicircle' && params.revolutionAxis === 'y' ? [0, 2, 0] : [0, 0, 0]}>
          <meshBasicMaterial 
            color={params.revolution2DColor || '#ff6600'}
            transparent
            opacity={params.revolution2DOpacity || 0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Sólido de revolução com efeito de construção */}
      {options.fillFaces && params.show3DSolid !== false && (
        <mesh ref={meshRef} geometry={constructionGeometry} position={params.revolutionType === 'semicircle' && params.revolutionAxis === 'y' ? [0, 2, 0] : [0, 0, 0]}>
          <meshStandardMaterial 
            color={params.revolution3DColor || style.faceColor}
            transparent
            opacity={params.revolution3DOpacity || style.faceOpacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Arestas */}
      {options.showEdges && (
        <lineSegments geometry={new THREE.EdgesGeometry(constructionGeometry)}>
          <lineBasicMaterial color={style.edgeColor} linewidth={style.edgeThickness || 1} />
        </lineSegments>
      )}

      {/* Efeito de construção - linhas de construção */}
      {params.showRevolutionPath && params.revolutionProgress && params.revolutionProgress > 0 && (
        <ConstructionLines 
          baseGeometry={createBaseGeometry()} 
          progress={params.revolutionProgress}
          axis={params.revolutionAxis || 'y'}
        />
      )}
      
      {/* Vértices */}
      {options.showVertices && (
        <VertexPoints geometry={geometry} />
      )}
      
      {/* Caminho de revolução (opcional) */}
      {params.showRevolutionPath && (
        <RevolutionPath 
          baseGeometry={createBaseGeometry()} 
          axis={params.revolutionAxis || 'y'}
          angle={revolutionAngle}
        />
      )}
      
      {/* Controles de animação */}
      <AnimationControls 
        isAnimating={isAnimating}
        onToggle={toggleAnimation}
        onReset={resetRevolution}
        speed={params.revolutionSpeed || 1}
        onSpeedChange={(speed) => {
          if (onStyleChange) {
            onStyleChange('revolutionSpeed', speed);
          }
        }}
      />
    </group>
  );
}

// Componente para mostrar pontos de vértices
function VertexPoints({ geometry }: { geometry: THREE.BufferGeometry }) {
  const positions = geometry.attributes.position.array;
  const vertices: THREE.Vector3[] = [];
  
  // Limitar número de vértices para performance
  const step = Math.max(1, Math.floor(positions.length / 3 / 50));
  
  for (let i = 0; i < positions.length; i += 3 * step) {
    vertices.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
  }
  
  return (
    <group>
      {vertices.map((vertex, index) => (
        <mesh key={index} position={vertex}>
          <sphereGeometry args={[0.01]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
      ))}
    </group>
  );
}

// Componente para mostrar o caminho de revolução
function RevolutionPath({ 
  baseGeometry, 
  axis, 
  angle 
}: { 
  baseGeometry: THREE.BufferGeometry; 
  axis: 'x' | 'y' | 'z'; 
  angle: number; 
}) {
  const points: THREE.Vector3[] = [];
  
  // Extrair pontos da geometria base
  const positions = baseGeometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    points.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
  }
  
  return (
    <group>
      {points.map((point, index) => {
        const rotationMatrix = new THREE.Matrix4();
        if (axis === 'x') {
          rotationMatrix.makeRotationX(angle);
        } else if (axis === 'y') {
          rotationMatrix.makeRotationY(angle);
        } else if (axis === 'z') {
          rotationMatrix.makeRotationZ(angle);
        }
        
        const rotatedPoint = point.clone().applyMatrix4(rotationMatrix);
        
        return (
          <mesh key={index} position={rotatedPoint}>
            <sphereGeometry args={[0.005]} />
            <meshBasicMaterial color="#ff6600" transparent opacity={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

// Componente para linhas de construção
function ConstructionLines({ 
  baseGeometry, 
  progress, 
  axis 
}: { 
  baseGeometry: THREE.BufferGeometry; 
  progress: number; 
  axis: 'x' | 'y' | 'z'; 
}) {
  // Verificações de segurança
  if (!baseGeometry || !baseGeometry.attributes.position || !baseGeometry.attributes.position.array) {
    return null;
  }
  
  if (progress <= 0) {
    return null;
  }
  
  const points: THREE.Vector3[] = [];
  
  // Extrair pontos da geometria base
  const positions = baseGeometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    points.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
  }
  
  if (points.length === 0) {
    return null;
  }
  
  // Calcular quantas linhas mostrar baseado no progresso
  const numLines = Math.floor(points.length * progress);
  
  if (numLines === 0) {
    return null;
  }
  
  // Criar geometria de linhas
  const lineGeometry = new THREE.BufferGeometry();
  const linePositions: number[] = [];
  
  points.slice(0, numLines).forEach((point) => {
    const rotationMatrix = new THREE.Matrix4();
    if (axis === 'x') {
      rotationMatrix.makeRotationX(progress * Math.PI * 2);
    } else if (axis === 'y') {
      rotationMatrix.makeRotationY(progress * Math.PI * 2);
    } else if (axis === 'z') {
      rotationMatrix.makeRotationZ(progress * Math.PI * 2);
    }
    
    const rotatedPoint = point.clone().applyMatrix4(rotationMatrix);
    
    // Adicionar pontos da linha
    linePositions.push(point.x, point.y, point.z);
    linePositions.push(rotatedPoint.x, rotatedPoint.y, rotatedPoint.z);
  });
  
  if (linePositions.length === 0) {
    return null;
  }
  
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  
  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial color="#00ff00" transparent opacity={0.6} />
    </lineSegments>
  );
}

// Componente para controles de animação
function AnimationControls({ 
  isAnimating, 
  onToggle, 
  onReset, 
  speed, 
  onSpeedChange 
}: {
  isAnimating: boolean;
  onToggle: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}) {
  return (
    <group position={[0, 0, 0]}>
      {/* Controles visuais podem ser adicionados aqui */}
    </group>
  );
}
