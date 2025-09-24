import * as THREE from 'three';
import { GeometryParams } from '@/types/geometry';
import { TetrahedronApothems } from './TetrahedronApothems';

interface PyramidApothemsProps {
  params: GeometryParams;
  showBaseApothem: boolean;
  showLateralApothem: boolean;
  // Novas props para customização
  baseApothemColor?: string;
  lateralApothemColor?: string;
  lineWidth?: number;
  dashSize?: number;
  gapSize?: number;
}

export function PyramidApothems({ 
  params, 
  showBaseApothem, 
  showLateralApothem,
  baseApothemColor = "#00ffff",
  lateralApothemColor = "#ff0000",
  lineWidth = 1,
  dashSize = 0.1,
  gapSize = 0.05
}: PyramidApothemsProps) {
  const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
  
  if (params.type !== 'pyramid' && params.type !== 'tetrahedron') return null;

  if (params.type === 'tetrahedron') {
    // Usar componente específico para tetraedro
    return (
      <TetrahedronApothems 
        params={params} 
        showBaseApothem={showBaseApothem}
        baseApothemColor={baseApothemColor}
        lineWidth={lineWidth}
        dashSize={dashSize}
        gapSize={gapSize}
      />
    );
  }

  return (
    <group>
      {/* Base Apothem - linha do centro até o meio de uma aresta da base */}
      {showBaseApothem && (
        <BaseApothemLine 
          params={params}
          color={baseApothemColor}
          lineWidth={lineWidth}
          dashSize={dashSize}
          gapSize={gapSize}
        />
      )}

      {/* Apótema da Pirâmide - linha do ápice até o meio da aresta da base */}
      {showLateralApothem && (
        <LateralApothemLine 
          params={params}
          color={lateralApothemColor}
          lineWidth={lineWidth}
          dashSize={dashSize * 2} // Dash maior para apótema lateral
          gapSize={gapSize * 2}
        />
      )}
    </group>
  );
}

interface ApothemLineProps {
  params: GeometryParams;
  color: string;
  lineWidth: number;
  dashSize: number;
  gapSize: number;
}

function BaseApothemLine({ params, color, lineWidth, dashSize, gapSize }: ApothemLineProps) {
  const { baseEdgeLength = 2, numSides = 5 } = params;
  const circumscribedRadius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));
  const apothem = baseEdgeLength / (2 * Math.tan(Math.PI / numSides));
  
  // Calcular o ponto no meio da primeira aresta da base
  const firstVertexAngle = 0;
  const secondVertexAngle = 2 * Math.PI / numSides;
  
  const firstVertex = new THREE.Vector3(
    circumscribedRadius * Math.cos(firstVertexAngle), 
    0, 
    circumscribedRadius * Math.sin(firstVertexAngle)
  );
  const secondVertex = new THREE.Vector3(
    circumscribedRadius * Math.cos(secondVertexAngle), 
    0, 
    circumscribedRadius * Math.sin(secondVertexAngle)
  );
  
  // Ponto médio da aresta
  const edgeMidpoint = new THREE.Vector3().lerpVectors(firstVertex, secondVertex, 0.5);
  
  // Apótema da base: linha do centro perpendicular à aresta
  const centerToMidpoint = edgeMidpoint.clone().normalize().multiplyScalar(apothem);
  
  // Linha do centro da base até o ponto do apótema (perpendicular à aresta)
  const points = [
    new THREE.Vector3(0, 0, 0),
    centerToMidpoint
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <lineSegments geometry={geometry}>
      <lineDashedMaterial 
        color={color}
        linewidth={lineWidth} // Para sistemas que suportam
        dashSize={dashSize}
        gapSize={gapSize}
        transparent={true}
        opacity={0.8}
      />
    </lineSegments>
  );
}

function LateralApothemLine({ params, color, lineWidth, dashSize, gapSize }: ApothemLineProps) {
  const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
  const circumscribedRadius = baseEdgeLength / (2 * Math.sin(Math.PI / numSides));

  // Ápice da pirâmide
  const apex = new THREE.Vector3(0, height, 0);

  // Calcular o meio da primeira aresta da base corretamente
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
  
  // Ponto médio da aresta entre vertex1 e vertex2
  const edgeMidpoint = new THREE.Vector3().lerpVectors(vertex1, vertex2, 0.5);

  return (
    <group>
      {/* Se lineWidth > 1, usar TubeGeometry para linha grossa */}
      {lineWidth > 1 ? (
        <mesh>
          <tubeGeometry 
            args={[
              new THREE.CatmullRomCurve3([apex, edgeMidpoint]), 
              20, 
              lineWidth * 0.02, 
              8, 
              false
            ]} 
          />
          <meshBasicMaterial 
            color={color}
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      ) : (
        <lineSegments geometry={new THREE.BufferGeometry().setFromPoints([apex, edgeMidpoint])}>
          <lineDashedMaterial 
            color={color}
            dashSize={dashSize}
            gapSize={gapSize}
            transparent={true}
            opacity={0.8}
          />
        </lineSegments>
      )}

      {/* Marcação no ponto médio da aresta */}
      <mesh position={edgeMidpoint}>
        <sphereGeometry args={[Math.max(0.05, lineWidth * 0.01)]} />
        <meshBasicMaterial 
          color={color}
          transparent={true}
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

// Alternativa para linhas mais grossas usando TubeGeometry
function ThickApothemLine({ 
  startPoint, 
  endPoint, 
  color, 
  thickness = 0.02,
  segments = 8 
}: {
  startPoint: THREE.Vector3;
  endPoint: THREE.Vector3;
  color: string;
  thickness?: number;
  segments?: number;
}) {
  const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
  const length = direction.length();
  const curve = new THREE.CatmullRomCurve3([startPoint, endPoint]);
  
  return (
    <mesh>
      <tubeGeometry args={[curve, segments, thickness, segments, false]} />
      <meshBasicMaterial 
        color={color}
        transparent={true}
        opacity={0.8}
      />
    </mesh>
  );
}