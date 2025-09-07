import * as THREE from 'three';
import { GeometryParams, VisualizationOptions } from '@/types/geometry';
import { GeneratrixLine } from './GeneratrixLine';

interface MeasurementLinesProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: any; // StyleOptions
  showHeight: boolean;
  showBaseRadius: boolean;
  showInscribedRadius: boolean;
  showCircumscribedRadius: boolean;
  showGeneratrix: boolean;
}

export function MeasurementLines({ 
  params, 
  options,
  style,
  showHeight, 
  showBaseRadius, 
  showInscribedRadius, 
  showCircumscribedRadius,
  showGeneratrix 
}: MeasurementLinesProps) {
  return (
    <group>
      {/* Height line */}
      {showHeight && (
        <HeightLine params={params} isEquilateral={options.isEquilateral} style={style} />
      )}

      {/* Base radius for cylindrical shapes */}
      {showBaseRadius && params.radius && (
        <RadiusLine radius={params.radius} style={style} />
      )}

      {/* Inscribed and Circumscribed Radius for polygon-based shapes */}
      {showInscribedRadius && ['pyramid', 'prism', 'cube', 'tetrahedron'].includes(params.type) && (
        <InscribedRadiusLine params={params} style={style} />
      )}

      {showCircumscribedRadius && ['pyramid', 'prism', 'cube', 'tetrahedron'].includes(params.type) && (
        <CircumscribedRadiusLine params={params} style={style} />
      )}

      {/* Diagonal do cubo */}
      {params.type === 'cube' && options.showCubeDiagonal && (
        <CubeDiagonalLine params={params} style={style} />
      )}

      {/* Apótema da base para tetraedro */}
      {params.type === 'tetrahedron' && options.showBaseApothem && (
        <TetrahedronBaseApothem params={params} style={style} />
      )}

      {/* Segmento 2/3 da altura da base para tetraedro */}
      {params.type === 'tetrahedron' && options.showLateralApothem && (
        <TetrahedronTwoThirdsSegment params={params} style={style} />
      )}
    </group>
  );
}

function HeightLine({ params, isEquilateral, style }: { params: GeometryParams; isEquilateral?: boolean; style?: any }) {
  // Para cubo, usar função específica
  if (params.type === 'cube') {
    return <CubeHeightLine params={params} style={style} />;
  }
  
  // Para cilindro e cone, usar as novas funções específicas
  if (params.type === 'cylinder') {
    return <CylinderHeightLine params={params} isEquilateral={isEquilateral} style={style} />;
  }
  
  if (params.type === 'cone') {
    return <ConeHeightLine params={params} isEquilateral={isEquilateral} style={style} />;
  }
  
  // Para tetraedro
  if (params.type === 'tetrahedron') {
    return <TetrahedronHeightLine params={params} style={style} />;
  }

  // Para octaedro
  if (params.type === 'octahedron') {
    return <OctahedronHeightLine params={params} style={style} />;
  }

  const height = params.height || 4;
  const thickness = Math.max(0.01, (style?.heightThickness || 1) * 0.02);
  
  // Usar cilindro para criar linha com espessura real
  return (
    <group>
      <mesh position={[0, height/2, 0]}>
        <cylinderGeometry args={[thickness, thickness, height]} />
        <meshBasicMaterial color={style?.heightLineColor || "#ffff00"} />
      </mesh>
      {/* Arrow at top */}
      <mesh position={[0, height, 0]}>
        <coneGeometry args={[Math.max(0.05, thickness * 2), 0.1]} />
        <meshBasicMaterial color={style?.heightLineColor || "#ffff00"} />
      </mesh>
      {/* Arrow at bottom */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[Math.max(0.05, thickness * 2), 0.1]} />
        <meshBasicMaterial color={style?.heightLineColor || "#ffff00"} />
      </mesh>
    </group>
  );
}

function CubeHeightLine({ params, style }: { params: GeometryParams; style?: any }) {
  const { sideLength = 2 } = params;
  
  if (params.type !== 'cube') return null;
  
  const thickness = Math.max(0.01, (style?.heightThickness || 1) * 0.02);
  
  return (
    <group>
      <mesh position={[0, sideLength/2, 0]}>
        <cylinderGeometry args={[thickness, thickness, sideLength]} />
        <meshBasicMaterial color={style?.heightLineColor || "#ffff00"} />
      </mesh>
      
      {/* Marcadores nos pontos */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[Math.max(0.04, thickness * 2)]} />
        <meshBasicMaterial color="#00ff00" /> {/* Verde para base */}
      </mesh>
      <mesh position={[0, sideLength, 0]}>
        <sphereGeometry args={[Math.max(0.04, thickness * 2)]} />
        <meshBasicMaterial color="#ff0000" /> {/* Vermelho para topo */}
      </mesh>
    </group>
  );
}

// Altura do cilindro
function CylinderHeightLine({ params, isEquilateral, style }: { params: GeometryParams; isEquilateral?: boolean; style?: any }) {
  const { radius = 2, height = 4 } = params;
  
  if (params.type !== 'cylinder') return null;
  
  // Para cilindro equilátero, altura = 2 * raio
  const actualHeight = isEquilateral ? radius * 2 : height;
  const thickness = Math.max(0.01, (style?.heightThickness || 1) * 0.02);
  
  return (
    <group>
      <mesh position={[0, actualHeight/2, 0]}>
        <cylinderGeometry args={[thickness, thickness, actualHeight]} />
        <meshBasicMaterial color={style?.heightLineColor || "#ffff00"} />
      </mesh>
      
      {/* Marcadores nos pontos */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[Math.max(0.03, thickness * 1.5)]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      <mesh position={[0, actualHeight, 0]}>
        <sphereGeometry args={[Math.max(0.03, thickness * 1.5)]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
}

// Altura do cone
function ConeHeightLine({ params, isEquilateral, style }: { params: GeometryParams; isEquilateral?: boolean; style?: any }) {
  const { radius = 2, height = 4 } = params;
  
  if (params.type !== 'cone') return null;
  
  // Para cone equilátero, altura = 2 * raio
  const actualHeight = isEquilateral ? radius * 2 : height;
  const thickness = Math.max(0.01, (style?.heightThickness || 1) * 0.02);
  
  return (
    <group>
      <mesh position={[0, actualHeight/2, 0]}>
        <cylinderGeometry args={[thickness, thickness, actualHeight]} />
        <meshBasicMaterial color={style?.heightLineColor || "#ffff00"} />
      </mesh>
      
      {/* Marcadores nos pontos */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[Math.max(0.03, thickness * 1.5)]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      <mesh position={[0, actualHeight, 0]}>
        <sphereGeometry args={[Math.max(0.03, thickness * 1.5)]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
}

// Geratriz do cone
function ConeGeneratrixLine({ params, isEquilateral }: { params: GeometryParams; isEquilateral?: boolean }) {
  if (params.type !== 'cone') return null;
  
  const { radius = 2, height = 4 } = params;
  
  // Para cone equilátero, altura = 2 * raio
  const actualHeight = isEquilateral ? radius * 2 : height;
  
  // A geratriz vai do ápice (topo) até a borda da base
  const apex = new THREE.Vector3(0, actualHeight, 0); // Ápice do cone
  const baseEdge = new THREE.Vector3(radius, 0, 0);   // Ponto na borda da base
  
  const points = [apex, baseEdge];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineDashedMaterial color="#00ffff" dashSize={0.15} gapSize={0.08} />
      </lineSegments>
      
      {/* Marcador no ápice */}
      <mesh position={apex}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
      
      {/* Marcador na base */}
      <mesh position={baseEdge}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
    </group>
  );
}

function RadiusLine({ radius, style }: { radius: number; style?: any }) {
  // Raio vai do centro até a borda na base (y=0 para cilindros)
  const displayRadius = Math.min(radius, 6);
  const thickness = Math.max(0.01, (style?.baseRadiusThickness || 1) * 0.02);
  
  return (
    <group>
      <mesh position={[displayRadius/2, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
        <cylinderGeometry args={[thickness, thickness, displayRadius]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      {/* Pequeno ponto no final do raio */}
      <mesh position={[displayRadius, 0, 0]}>
        <sphereGeometry args={[Math.max(0.03, thickness * 1.5)]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      {/* Pequeno ponto no centro */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[Math.max(0.02, thickness * 1.2)]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
    </group>
  );
}

function InscribedRadiusLine({ params, style }: { params: GeometryParams; style?: any }) {
  const { baseEdgeLength = 2, numSides = 5, sideLength = 2 } = params;
  
  // Para cubo, o raio inscrito vai do centro até o centro de uma face (raio da esfera inscrita)
  if (params.type === 'cube') {
    const inscribedRadius = sideLength / 2; // Distância do centro até o centro de uma face
    const thickness = Math.max(0.01, (style?.inscribedRadiusThickness || 1) * 0.02);
    
    return (
      <group>
        {/* Raio inscrito: do centro do cubo até o centro da face frontal */}
        <mesh position={[0, 0, inscribedRadius/2]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[thickness, thickness, inscribedRadius]} />
          <meshBasicMaterial color={style?.inscribedRadiusColor || "#ff6600"} />
        </mesh>
        {/* Ponto no centro da face */}
        <mesh position={[0, 0, inscribedRadius]}>
          <sphereGeometry args={[Math.max(0.02, thickness * 1.5)]} />
          <meshBasicMaterial color={style?.inscribedRadiusColor || "#ff6600"} />
        </mesh>
        {/* Ponto no centro do cubo */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[Math.max(0.02, thickness * 1.2)]} />
          <meshBasicMaterial color={style?.inscribedRadiusColor || "#ff6600"} />
        </mesh>
      </group>
    );
  }
  
  // Para tetraedro, usar raio inscrito = a/(2√6)  
  if (params.type === 'tetrahedron') {
    const { sideLength = 2 } = params;
    const inscribedRadius = sideLength / (2 * Math.sqrt(6));
    const height = sideLength * Math.sqrt(2/3);
    const centerY = height / 4; // Centro de massa do tetraedro
    const thickness = Math.max(0.01, (style?.inscribedRadiusThickness || 1) * 0.02);
    
    const distance = Math.sqrt(inscribedRadius * inscribedRadius + centerY * centerY);
    const angle = Math.atan2(centerY, inscribedRadius);
    
    return (
      <group>
        <mesh position={[inscribedRadius/2, centerY/2, 0]} rotation={[0, 0, -angle]}>
          <cylinderGeometry args={[thickness, thickness, distance]} />
          <meshBasicMaterial color={style?.inscribedRadiusColor || "#ff6600"} />
        </mesh>
        <mesh position={[inscribedRadius, 0, 0]}>
          <sphereGeometry args={[Math.max(0.02, thickness * 1.5)]} />
          <meshBasicMaterial color={style?.inscribedRadiusColor || "#ff6600"} />
        </mesh>
        <mesh position={[0, centerY, 0]}>
          <sphereGeometry args={[Math.max(0.02, thickness * 1.2)]} />
          <meshBasicMaterial color={style?.inscribedRadiusColor || "#ff6600"} />
        </mesh>
      </group>
    );
  }
  
  // Calcular o raio inscrito (apótema) - do centro até o meio de uma aresta perpendicularmente
  const circumscribedRadius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
  const inscribedRadius = baseEdgeLength / (2 * Math.tan(Math.PI / numSides));
  const thickness = Math.max(0.01, (style?.inscribedRadiusThickness || 1) * 0.02);
  
  // Calcular o ponto médio de uma aresta da base
  const vertex1 = new THREE.Vector3(
    circumscribedRadius * Math.cos(0), 
    0, 
    circumscribedRadius * Math.sin(0)
  );
  const vertex2 = new THREE.Vector3(
    circumscribedRadius * Math.cos(2 * Math.PI / numSides), 
    0, 
    circumscribedRadius * Math.sin(2 * Math.PI / numSides)
  );
  const edgeMidpoint = new THREE.Vector3().lerpVectors(vertex1, vertex2, 0.5);
  
  // Direção do centro até o meio da aresta (no plano da base)
  const dir = edgeMidpoint.clone().normalize();
  // Quaternion que alinha o eixo Y do cilindro com a direção desejada
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

  return (
    <group>
      {/* Raio inscrito perfeitamente perpendicular à aresta (apótema) */}
      <mesh position={[dir.x * inscribedRadius / 2, 0, dir.z * inscribedRadius / 2]} quaternion={quaternion}>
        <cylinderGeometry args={[thickness, thickness, inscribedRadius]} />
        <meshBasicMaterial color={style?.inscribedRadiusColor || "#ff6600"} />
      </mesh>
      {/* Ponto no meio da aresta */}
      <mesh position={[edgeMidpoint.x, 0, edgeMidpoint.z]}>
        <sphereGeometry args={[Math.max(0.02, thickness * 1.5)]} />
        <meshBasicMaterial color={style?.inscribedRadiusColor || "#ff6600"} />
      </mesh>
      {/* Centro da base */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[Math.max(0.02, thickness * 1.2)]} />
        <meshBasicMaterial color={style?.inscribedRadiusColor || "#ff6600"} />
      </mesh>
    </group>
  );
}

function CircumscribedRadiusLine({ params, style }: { params: GeometryParams; style?: any }) {
  const { baseEdgeLength = 2, numSides = 5, sideLength = 2 } = params;
  
  // Para cubos, o raio circunscrito vai do centro da base até um vértice (metade da diagonal da base)
  const circumscribedRadius = params.type === 'cube'
    ? (sideLength * Math.sqrt(2)) / 2
    : params.type === 'tetrahedron'
    ? sideLength / Math.sqrt(3) // Raio circunscrito da base triangular
    : Math.min(baseEdgeLength / (2 * Math.sin(Math.PI / numSides)), 5);
  
  const thickness = Math.max(0.01, (style?.circumscribedRadiusThickness || 1) * 0.02);

  return (
    <group>
      <mesh position={[circumscribedRadius/2, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
        <cylinderGeometry args={[thickness, thickness, circumscribedRadius]} />
        <meshBasicMaterial color="#ff0066" />
      </mesh>
      <mesh position={[circumscribedRadius, 0, 0]}>
        <sphereGeometry args={[Math.max(0.02, thickness * 1.5)]} />
        <meshBasicMaterial color="#ff0066" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[Math.max(0.02, thickness * 1.2)]} />
        <meshBasicMaterial color="#ff0066" />
      </mesh>
    </group>
  );
}

// Diagonal do cubo
function CubeDiagonalLine({ params, style }: { params: GeometryParams; style?: any }) {
  const { sideLength = 2 } = params;
  
  if (params.type !== 'cube') return null;
  
  // Diagonal espacial do cubo vai de um vértice inferior até o vértice oposto superior
  const corner1 = new THREE.Vector3(-sideLength/2, 0, -sideLength/2); // Canto inferior
  const corner2 = new THREE.Vector3(sideLength/2, sideLength, sideLength/2); // Canto superior oposto
  
  const points = [corner1, corner2];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineDashedMaterial color="#ff00ff" dashSize={0.15} gapSize={0.08} />
      </lineSegments>
      
      {/* Marcadores nos pontos */}
      <mesh position={corner1}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="#ff00ff" />
      </mesh>
      <mesh position={corner2}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="#ff00ff" />
      </mesh>
    </group>
  );
}

// Altura do tetraedro
function TetrahedronHeightLine({ params, style }: { params: GeometryParams; style?: any }) {
  const { sideLength = 2 } = params;
  
  if (params.type !== 'tetrahedron') return null;
  
  // Altura do tetraedro regular - do centro da base ao vértice superior
  const height = sideLength * Math.sqrt(2/3);
  const thickness = Math.max(0.01, (style?.heightThickness || 1) * 0.02);
  
  return (
    <group>
      <mesh position={[0, height/2, 0]}>
        <cylinderGeometry args={[thickness, thickness, height]} />
        <meshBasicMaterial color={style?.heightLineColor || "#ffff00"} />
      </mesh>
      
      {/* Marcadores nos pontos */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[Math.max(0.03, thickness * 1.5)]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      <mesh position={[0, height, 0]}>
        <sphereGeometry args={[Math.max(0.03, thickness * 1.5)]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
}

// Altura do octaedro - conecta vértices opostos superior e inferior
function OctahedronHeightLine({ params, style }: { params: GeometryParams; style?: any }) {
  const { sideLength = 2 } = params;
  
  if (params.type !== 'octahedron') return null;
  
  // Altura do octaedro regular (distância entre vértices opostos)
  const d = sideLength / Math.sqrt(2);
  const height = 2 * d; // Altura total do octaedro
  const thickness = Math.max(0.01, (style?.heightThickness || 1) * 0.02);
  
  return (
    <group>
      <mesh position={[0, height/2, 0]}>
        <cylinderGeometry args={[thickness, thickness, height]} />
        <meshBasicMaterial color={style?.heightLineColor || "#ffff00"} />
      </mesh>
      
      {/* Marcadores nos pontos */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[Math.max(0.03, thickness * 1.5)]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      <mesh position={[0, height, 0]}>
        <sphereGeometry args={[Math.max(0.03, thickness * 1.5)]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
}

// Apótema da base para tetraedro
function TetrahedronBaseApothem({ params, style }: { params: GeometryParams; style?: any }) {
  const { sideLength = 2 } = params;
  
  if (params.type !== 'tetrahedron') return null;
  
  // Apótema da base triangular (distância do centro ao meio de uma aresta)
  const apothem = sideLength / (2 * Math.sqrt(3));
  
  // Do centro da base até o meio da aresta frontal
  const points = [
    new THREE.Vector3(0, 0, 0), // Centro da base
    new THREE.Vector3(0, 0, apothem) // Meio da aresta frontal
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineDashedMaterial 
          color={style?.baseApothemColor || "#00ffff"} 
          dashSize={0.12} 
          gapSize={0.06}
          linewidth={style?.baseApothemThickness || 1}
        />
      </lineSegments>
      
      {/* Marcadores */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[Math.max(0.03, (style?.baseApothemThickness || 1) * 0.03)]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
      <mesh position={[0, 0, apothem]}>
        <sphereGeometry args={[Math.max(0.03, (style?.baseApothemThickness || 1) * 0.03)]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
    </group>
  );
}

// Apótema lateral do tetraedro (do vértice superior ao meio de uma aresta da base)
function TetrahedronTwoThirdsSegment({ params, style }: { params: GeometryParams; style?: any }) {
  const { sideLength = 2 } = params;
  
  if (params.type !== 'tetrahedron') return null;
  
  // Altura do tetraedro
  const height = sideLength * Math.sqrt(2/3);
  
  // Apótema da base
  const baseApothem = sideLength / (2 * Math.sqrt(3));
  
  // Apótema lateral: do vértice superior ao meio de uma aresta da base
  const points = [
    new THREE.Vector3(0, height, 0), // Vértice superior
    new THREE.Vector3(0, 0, baseApothem) // Meio da aresta da base
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineDashedMaterial 
          color={style?.lateralApothemColor || "#ff00ff"} 
          dashSize={0.1} 
          gapSize={0.05}
          linewidth={style?.lateralApothemThickness || 1}
        />
      </lineSegments>
      
      {/* Marcadores */}
      <mesh position={[0, height, 0]}>
        <sphereGeometry args={[Math.max(0.03, (style?.lateralApothemThickness || 1) * 0.03)]} />
        <meshBasicMaterial color="#ff00ff" />
      </mesh>
      <mesh position={[0, 0, baseApothem]}>
        <sphereGeometry args={[Math.max(0.03, (style?.lateralApothemThickness || 1) * 0.03)]} />
        <meshBasicMaterial color="#ff00ff" />
      </mesh>
    </group>
  );
}