import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import * as THREE from 'three';
import { GeometryParams, VisualizationOptions, StyleOptions } from '@/types/geometry';
import { toast } from 'sonner';
import { PyramidApothems } from './geometry/PyramidApothems';
import { TetrahedronApothems } from './geometry/TetrahedronApothems';
import { TetrahedronRadii } from './geometry/TetrahedronRadii';
import { OctahedronApothems } from './geometry/OctahedronApothems';
import { GeometryCircles } from './geometry/GeometryCircles';
import { MeasurementLines } from './geometry/MeasurementLines';
import { CrossSection } from './geometry/CrossSection';
import { MeridianSection } from './geometry/MeridianSection';
import { MeridianSectionForVertices } from './geometry/MeridianSectionForVertices';
import { SectionIntersection } from './geometry/SectionIntersection';
import { DimensionLabels } from './geometry/DimensionLabels';
import InscribedShapes from './geometry/InscribedShapes';
import CircumscribedShapes from './geometry/CircumscribedShapes';
import SphericalSegments from './geometry/SphericalSegments';
import { VertexConnector } from './geometry/VertexConnector';
import { Unfolded } from './geometry/Unfolded';
import PlaneDefinition from './geometry/PlaneDefinition';
import GeometricConstructions from './geometry/GeometricConstructions';
import AutoRotatingGroup from './geometry/AutoRotatingGroup';

interface GeometryMeshProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
  onVertexSelect?: (vertexIndex: number) => void;
  onStyleChange?: (key: keyof StyleOptions, value: any) => void;
}

function GeometryMesh({ params, options, style, onVertexSelect, onStyleChange }: GeometryMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);

  // Rotação é gerenciada pelo AutoRotatingGroup

  const createGeometry = (): THREE.BufferGeometry => {
    switch (params.type) {
      case 'pyramid':
        return createPyramidGeometry(params);
      case 'cylinder':
        const cylHeight = options.isEquilateral ? (params.radius || 2) * 2 : (params.height || 4);
        // Sempre usar 64 segmentos para manter a base circular
        const cylinderGeometry = new THREE.CylinderGeometry(
          params.radius || 2, 
          params.radius || 2, 
          cylHeight, 
          64 // Sempre circular, independente das geratrizes
        );
        // Mover o cilindro para que a base fique em y=0 (como outras geometrias)
        cylinderGeometry.translate(0, cylHeight / 2, 0);
        return cylinderGeometry;
      case 'cone':
        const coneHeight = options.isEquilateral ? (params.radius || 2) * 2 : (params.height || 4);
        // Sempre usar 64 segmentos para manter a base circular
        const coneGeometry = new THREE.ConeGeometry(
          params.radius || 2, 
          coneHeight, 
          64 // Sempre circular, independente das geratrizes
        );
        // Mover o cone para que a base fique em y=0
        coneGeometry.translate(0, coneHeight / 2, 0);
        return coneGeometry;
      case 'cube':
        const size = params.sideLength || 2;
        const cubeGeometry = new THREE.BoxGeometry(size, size, size);
        // Mover o cubo para que a base fique em y=0 (como outras geometrias)
        cubeGeometry.translate(0, size / 2, 0);
        return cubeGeometry;
      case 'sphere':
      // Geometria da esfera sempre perfeita (muitos segmentos)
        const sphereGeometry = new THREE.SphereGeometry(
          params.radius || 2, 
          Math.max(64, options.sphereWidthSegments * 4), // Muitos segmentos para manter forma circular
          Math.max(32, options.sphereHeightSegments * 2)  // Muitos segmentos para manter forma circular
        );
        // Mover a esfera para que a base fique em y=0 (como outras geometrias)
        sphereGeometry.translate(0, params.radius || 2, 0);
        return sphereGeometry;
      case 'prism':
        return createPrismGeometry(params);
      case 'tetrahedron':
        return createTetrahedronGeometry(params);
      case 'octahedron':
        return createOctahedronGeometry(params);
      case 'dodecahedron':
        return createDodecahedronGeometry(params);
      case 'icosahedron':
        return createIcosahedronGeometry(params);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  };

  const geometry = createGeometry();
  
  // Criar wireframe personalizado para diferentes geometrias
  const getWireframeGeometry = () => {
    if (params.type === 'sphere') {
      // Criar linhas de meridiano e paralelo controláveis para efeito de globo
      const radius = params.radius || 2;
      const sphereY = radius; // Centro da esfera
      const lines: THREE.Vector3[] = [];
      
      // Meridianos (linhas verticais) - número controlável de 2 a 30
      const numMeridians = options.sphereWidthSegments;
      const meridianResolution = 32; // Resolução de cada meridiano para suavidade
      
      for (let i = 0; i < numMeridians; i++) {
        const longitude = (i * 2 * Math.PI) / numMeridians;
        
        // Pontos do meridiano (do polo norte ao polo sul)
        for (let j = 0; j < meridianResolution; j++) {
          const latitude = (j * Math.PI) / (meridianResolution - 1); // De 0 a π
          const x = radius * Math.sin(latitude) * Math.cos(longitude);
          const y = radius * Math.cos(latitude) + sphereY;
          const z = radius * Math.sin(latitude) * Math.sin(longitude);
          lines.push(new THREE.Vector3(x, y, z));
          
          if (j < meridianResolution - 1) {
            const nextLatitude = ((j + 1) * Math.PI) / (meridianResolution - 1);
            const nextX = radius * Math.sin(nextLatitude) * Math.cos(longitude);
            const nextY = radius * Math.cos(nextLatitude) + sphereY;
            const nextZ = radius * Math.sin(nextLatitude) * Math.sin(longitude);
            lines.push(new THREE.Vector3(nextX, nextY, nextZ));
          }
        }
      }
      
      // Paralelos (linhas horizontais) - número controlável de 2 a 30
      const numParallels = options.sphereHeightSegments;
      const parallelResolution = 64; // Resolução de cada paralelo para suavidade
      
      for (let i = 1; i < numParallels + 1; i++) {
        const latitude = (i * Math.PI) / (numParallels + 1); // De 0 a π (excluindo polos)
        const circleRadius = radius * Math.sin(latitude);
        const y = radius * Math.cos(latitude) + sphereY;
        
        // Pontos do paralelo (círculo completo)
        for (let j = 0; j < parallelResolution; j++) {
          const longitude = (j * 2 * Math.PI) / parallelResolution;
          const x = circleRadius * Math.cos(longitude);
          const z = circleRadius * Math.sin(longitude);
          lines.push(new THREE.Vector3(x, y, z));
          
          const nextLongitude = ((j + 1) * 2 * Math.PI) / parallelResolution;
          const nextX = circleRadius * Math.cos(nextLongitude);
          const nextZ = circleRadius * Math.sin(nextLongitude);
          lines.push(new THREE.Vector3(nextX, y, nextZ));
        }
      }
      
      const wireframeGeometry = new THREE.BufferGeometry().setFromPoints(lines);
      return wireframeGeometry;
    }
    
    // Para cone e cilindro: criar wireframe customizado com número controlado de geratrizes
    if (params.type === 'cone' || params.type === 'cylinder') {
      const radius = params.radius || 2;
      const height = params.type === 'cone' 
        ? (options.isEquilateral ? radius * 2 : (params.height || 4))
        : (options.isEquilateral ? radius * 2 : (params.height || 4));
      const numGeneratrices = params.type === 'cone' ? (style.coneGeneratrices || 8) : (style.cylinderGeneratrices || 8);
      const lines: THREE.Vector3[] = [];
      
      // Círculo da base (sempre circular com muitos segmentos para suavidade)
      const baseCircleSegments = 64;
      for (let i = 0; i < baseCircleSegments; i++) {
        const angle1 = (i * 2 * Math.PI) / baseCircleSegments;
        const angle2 = ((i + 1) * 2 * Math.PI) / baseCircleSegments;
        const x1 = radius * Math.cos(angle1);
        const z1 = radius * Math.sin(angle1);
        const x2 = radius * Math.cos(angle2);
        const z2 = radius * Math.sin(angle2);
        lines.push(new THREE.Vector3(x1, 0, z1));
        lines.push(new THREE.Vector3(x2, 0, z2));
      }
      
      if (params.type === 'cylinder') {
        // Círculo do topo (sempre circular com muitos segmentos para suavidade)
        for (let i = 0; i < baseCircleSegments; i++) {
          const angle1 = (i * 2 * Math.PI) / baseCircleSegments;
          const angle2 = ((i + 1) * 2 * Math.PI) / baseCircleSegments;
          const x1 = radius * Math.cos(angle1);
          const z1 = radius * Math.sin(angle1);
          const x2 = radius * Math.cos(angle2);
          const z2 = radius * Math.sin(angle2);
          lines.push(new THREE.Vector3(x1, height, z1));
          lines.push(new THREE.Vector3(x2, height, z2));
        }
      }
      
      // Geratrizes visuais (apenas para exibição, não alteram a geometria)
      for (let i = 0; i < numGeneratrices; i++) {
        const angle = (i * 2 * Math.PI) / numGeneratrices;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        
        if (params.type === 'cone') {
          // Linha da base ao vértice (apenas visual)
          lines.push(new THREE.Vector3(x, 0, z));
          lines.push(new THREE.Vector3(0, height, 0));
        } else {
          // Linha vertical do cilindro (apenas visual)
          lines.push(new THREE.Vector3(x, 0, z));
          lines.push(new THREE.Vector3(x, height, z));
        }
      }
      
      const wireframeGeometry = new THREE.BufferGeometry().setFromPoints(lines);
      return wireframeGeometry;
    }
    
    return new THREE.EdgesGeometry(geometry);
  };
  
  const edges = getWireframeGeometry();

  return (
    <AutoRotatingGroup options={options} style={style}>
      {/* Main mesh */}
      {options.fillFaces && (
        <mesh ref={meshRef} geometry={geometry}>
          <meshStandardMaterial 
            color={style.faceColor}
            transparent
            opacity={style.faceOpacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Shadow receiver */}
      {options.showShadow && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
      )}
      
      {/* Wireframe */}
      {options.showEdges && (
        <lineSegments ref={edgesRef} geometry={edges}>
          <lineBasicMaterial color={style.edgeColor} linewidth={1} />
        </lineSegments>
      )}

      {/* Vertices */}
      {options.showVertices && params.type === 'cube' && (
        <CubeVertices geometry={geometry} params={params} />
      )}
      {options.showVertices && params.type === 'tetrahedron' && (
        <TetrahedronVertices params={params} />
      )}
      {options.showVertices && params.type !== 'cylinder' && params.type !== 'cube' && params.type !== 'tetrahedron' && (
        <VertexPoints geometry={geometry} geometryType={params.type} />
      )}

      {/* Measurement lines */}
      <MeasurementLines
        params={params}
        options={options}
        style={style}
        showHeight={options.showHeight}
        showBaseRadius={options.showBaseRadius}
        showInscribedRadius={options.showInscribedRadius}
        showCircumscribedRadius={options.showCircumscribedRadius}
        showGeneratrix={options.showGeneratrix}
      />

      {/* Pyramid Apothems */}
      <PyramidApothems
        params={params}
        showBaseApothem={options.showBaseApothem}
        showLateralApothem={options.showLateralApothem}
      />
      
      {/* Tetrahedron Apothems */}
      <TetrahedronApothems
        params={params}
        showBaseApothem={options.showBaseApothem}
      />
      
      {/* Tetrahedron Radii */}
      <TetrahedronRadii
        params={params}
        showInscribedRadius={options.showInscribedRadius}
        showCircumscribedRadius={options.showCircumscribedRadius}
        inscribedRadiusColor={style.inscribedRadiusColor}
        circumscribedRadiusColor={style.circumscribedCircleColor}
        inscribedRadiusThickness={style.inscribedRadiusThickness}
        circumscribedRadiusThickness={style.circumscribedRadiusThickness}
      />
      
      {/* Octahedron Apothems */}
      <OctahedronApothems
        params={params}
        showBaseApothem={options.showBaseApothem}
      />

      {/* Geometry Circles */}
      <GeometryCircles
        params={params}
        showInscribedCircle={options.showInscribedCircle}
        showCircumscribedCircle={options.showCircumscribedCircle}
        style={style}
      />

      {/* Cross Section */}
      <CrossSection
        params={params}
        showCrossSection={options.showCrossSection}
        sectionHeight={options.crossSectionHeight}
      />

      {/* Meridian Section */}
      {options.showMeridianSection && (
        <>
          {/* Seção meridiana para cubos, prismas, pirâmides, tetraedros, cilindros e cones - só mostra quando 2 vértices selecionados */}
          {['cube', 'prism', 'pyramid', 'tetrahedron', 'cylinder', 'cone'].includes(params.type) ? (
            style.selectedVerticesForMeridian && style.selectedVerticesForMeridian.length === 2 && (
              <MeridianSectionForVertices 
                params={params}
                style={style}
                options={options}
                selectedVertices={style.selectedVerticesForMeridian || []}
                vertices={[]}
              />
            )
          ) : (
            <MeridianSection
              params={params}
              showMeridianSection={options.showMeridianSection}
              sectionPercentage={options.meridianSectionHeight}
              style={style}
              selectedVertices={style.selectedVerticesForMeridian}
            />
          )}
        </>
      )}

      {/* Section Intersection */}
      <SectionIntersection
        params={params}
        showMeridianSection={options.showMeridianSection}
        showCrossSection={options.showCrossSection}
        crossSectionHeight={options.crossSectionHeight}
        meridianAngle={0}
        style={style}
      />

      {/* Dimension Labels */}
      <DimensionLabels
        params={params}
        showDimensions={options.showDimensions}
      />

      {/* Unfolded geometry */}
      <Unfolded params={params} showUnfolded={options.showUnfolded} style={style} />

      {/* Formas Inscritas */}
      <InscribedShapes
        params={params}
        options={options}
        style={style}
      />

      {/* Formas Circunscritas */}
      <CircumscribedShapes
        params={params}
        options={options}
        style={style}
      />

      {/* Segmentos Esféricos */}
      <SphericalSegments
        params={params}
        options={options}
        style={style}
      />

      {/* Conectores de Vértices Gerais - excluir para tetraedro */}
      {options.showVertexConnector && params.type !== 'tetrahedron' && (
        <VertexConnector
          params={params}
          showVertexConnections={true}
          selectedVertices={style.selectedVerticesForGeneral || []}
          onVertexSelect={(vertexIndex, position) => {
            const currentSelection = style.selectedVerticesForGeneral || [];
            if (!onStyleChange) return;
            
            // Se é uma intersecção (tem posição), armazenar a posição
            if (position) {
              const currentIntersections = style.intersectionPositions || [];
              if (!currentIntersections.some(pos => 
                Math.abs(pos.x - position.x) < 0.001 && 
                Math.abs(pos.y - position.y) < 0.001 && 
                Math.abs(pos.z - position.z) < 0.001
              )) {
                onStyleChange('intersectionPositions', [...currentIntersections, position]);
              }
            }
            
            // Permitir reutilização de vértices conectados - simplesmente adicionar
            onStyleChange('selectedVerticesForGeneral', [...currentSelection, vertexIndex]);
          }}
          edgeColor={style.edgeColor}
          vertexColor="#ffff00"
          selectedVertexColor={style.edgeColor}
          connectionType="general"
          lineWidth={style.rotationSpeed}
          onClearSelection={() => {
            if (!onStyleChange) return;
            onStyleChange('selectedVerticesForGeneral', []);
            onStyleChange('intersectionPositions', []);
          }}
          vertexPositions={style.intersectionPositions || []}
        />
      )}

      {/* Seleção de Vértices para Seção Meridiana - CUBOS, PRISMAS, TETRAEDROS, PIRÂMIDES, CILINDROS E CONES */}
      {['cube', 'prism', 'tetrahedron', 'pyramid', 'cylinder', 'cone'].includes(params.type) && options.showMeridianSection && options.showVertexSelection && (
        <VertexConnector
          params={params}
          showVertexConnections={true}
          selectedVertices={style.selectedVerticesForMeridian}
          onVertexSelect={onVertexSelect}
          edgeColor={style.meridianSectionColor}
          vertexColor="#ffff00"
          selectedVertexColor="#ff6b6b"
          connectionType="meridian"
          onClearSelection={() => {
            if (!onStyleChange) return;
            onStyleChange('selectedVerticesForMeridian', []);
          }}
        />
      )}

      {/* Seleção de Vértices para Seção Meridiana em Prismas - APENAS quando explicitamente solicitado */}
      {params.type === 'prism' && options.showMeridianSection && options.showVertexSelection && options.showVertexConnector && (
        <VertexConnector
          params={params}
          showVertexConnections={true}
          selectedVertices={style.selectedVerticesForMeridian}
          onVertexSelect={onVertexSelect}
          edgeColor={style.meridianSectionColor}
          vertexColor="#ffff00"
          selectedVertexColor={style.meridianSectionColor}
          connectionType="meridian"
          onClearSelection={() => {
            if (!onStyleChange) return;
            onStyleChange('selectedVerticesForMeridian', []);
          }}
        />
      )}

      {/* Definição de Planos por 3 Vértices - excluir para tetraedro */}
      {options.showPlaneDefinition && params.type !== 'tetrahedron' && (
        <PlaneDefinition
          params={params}
          style={style}
          isEquilateral={options.isEquilateral}
          selectedVertices={style.selectedVerticesForPlane}
          selectedPositions={style.intersectionPositions || []}
          showPlane={style.selectedVerticesForPlane.length >= 3}
          showSelectionInstructions={true}
          showNormalVector={true}
          planes={style.planes}
          onVertexSelect={(vertexIndex, position) => {
            if (!onStyleChange) return;
            
            const currentSelection = style.selectedVerticesForPlane || [];
            
            // Verificar limite de planos
            if (style.planes.length >= 5 && currentSelection.length === 0) {
              return; // Não permitir nova seleção se já há 5 planos
            }
            
            if (currentSelection.includes(vertexIndex)) {
              // Remove vertex if already selected
              onStyleChange('selectedVerticesForPlane', currentSelection.filter(i => i !== vertexIndex));
            } else if (currentSelection.length < 3) {
              // Adicionar o vértice se não estiver na lista e ainda não temos 3
              onStyleChange('selectedVerticesForPlane', [...currentSelection, vertexIndex]);
            }
          }}
          onClearSelection={() => {
            if (!onStyleChange) return;
            onStyleChange('selectedVerticesForPlane', []);
          }}
          onCreatePlane={() => {
            if (!onStyleChange) return;
            
            const currentSelection = style.selectedVerticesForPlane || [];
            const currentPlanes = Array.isArray(style.planes) ? style.planes : [];
            
            console.log('=== CRIANDO NOVO PLANO (GeometryCanvas) ===');
            console.log('Planos existentes:', currentPlanes);
            console.log('Seleção atual:', currentSelection);
            
            if (currentSelection.length >= 3 && currentPlanes.length < 5) {
              const newPlane = {
                id: `plane-${Date.now()}`,
                name: `Plano ${currentPlanes.length + 1}`,
                vertices: currentSelection.slice(0, 3),
                color: style.planeColor,
                opacity: style.planeOpacity
              };
              
              console.log('Novo plano:', newPlane);
              
              // Garantir que preservamos os planos existentes
              const updatedPlanes = [...currentPlanes, newPlane];
              console.log('Lista final de planos:', updatedPlanes);
              
              // Usar uma única atualização de estado para evitar conflitos
              onStyleChange('planes', updatedPlanes);
              
              // Limpar seleção após criar plano
              setTimeout(() => {
                onStyleChange('selectedVerticesForPlane', []);
              }, 100);
              
              // Feedback visual
              toast.success(`${newPlane.name} criado com sucesso!`);
            }
          }}
        />
      )}

      {/* Construções Geométricas - excluir para tetraedro */}
      {options.showGeometricConstructions && params.type !== 'tetrahedron' && (
        <GeometricConstructions
          params={params}
          style={style}
          selectedVertices={style.selectedVerticesForConstruction}
          constructionType={style.constructionType}
          showConstruction={true}
          constructions={style.constructions}
          onVertexSelect={(vertexIndex, position) => {
            if (!onStyleChange) return;
            
            const current = style.selectedVerticesForConstruction || [];
            const requiredPoints = {
              'mediatriz': 2,
              'ponto-medio': 2,
              'segmento-reta': 2,
              'reta-perpendicular': 3,
              'reta-paralela': 3,
              'bissetriz': 3,
              'reta-tangente': 2
            }[style.constructionType || 'mediatriz'] || 2;

            if (current.length < requiredPoints) {
              onStyleChange('selectedVerticesForConstruction', [...current, vertexIndex]);
            } else {
              // Reset e começar nova seleção
              onStyleChange('selectedVerticesForConstruction', [vertexIndex]);
            }
          }}
          onClearSelection={() => {
            if (!onStyleChange) return;
            onStyleChange('selectedVerticesForConstruction', []);
          }}
        />
      )}

      {/* Labels */}
      {options.showLabels && (
        <Text
          position={[0, getCameraTarget(params)[1] + 2.5, 0]}
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="bottom"
        >
          {getGeometryName(params.type)}
        </Text>
      )}
    </AutoRotatingGroup>
  );
}

function VertexPoints({ geometry, geometryType }: { geometry: THREE.BufferGeometry; geometryType: string }) {
  const positions = geometry.attributes.position.array;
  const vertices: THREE.Vector3[] = [];
  
  // Limit vertices shown based on geometry type
  const getVertexLimit = (type: string): number => {
    switch (type) {
      case 'cylinder': return 24; // Only show base vertices
      case 'cone': return 17; // Base vertices + apex
      case 'sphere': return 32; // Limited vertices for sphere
      case 'cube': return 8; // Only corner vertices
      default: return positions.length / 3; // All vertices for other shapes
    }
  };

  const vertexLimit = getVertexLimit(geometryType);
  const step = geometryType === 'sphere' ? Math.floor(positions.length / 3 / 32) : 1;
  
  for (let i = 0; i < Math.min(positions.length, vertexLimit * 3); i += 3 * step) {
    vertices.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
  }

  return (
    <group>
      {vertices.map((vertex, index) => (
        <mesh key={index} position={vertex}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
      ))}
    </group>
  );
}

// Componente específico para vértices do cubo
function CubeVertices({ geometry, params }: { geometry: THREE.BufferGeometry; params?: GeometryParams }) {
  const sideLength = params?.sideLength || 2;
  const half = sideLength / 2;
  
  // Vértices específicos do cubo (8 vértices) - ALINHADOS COM A GEOMETRIA REAL
  // A geometria do cubo é transladada para y=0 (base) até y=sideLength (topo)
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

  return (
    <group>
      {vertices.map((vertex, index) => (
        <mesh key={index} position={vertex}>
          <sphereGeometry args={[0.08]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
      ))}
    </group>
  );
}

// Componente específico para vértices do tetraedro
function TetrahedronVertices({ params }: { params: GeometryParams }) {
  const { sideLength = 2 } = params;
  const a = sideLength;
  
  // Usar exatamente as mesmas coordenadas da função createTetrahedronGeometry
  const height = a * Math.sqrt(2/3);
  const R = a / Math.sqrt(3); // raio circunscrito
  
  // Vértices exatamente como definidos na geometria
  const vertices = [
    // Vértice 0: frente-direita
    new THREE.Vector3(R * Math.cos(0), 0, R * Math.sin(0)),
    // Vértice 1: frente-esquerda  
    new THREE.Vector3(R * Math.cos(2 * Math.PI / 3), 0, R * Math.sin(2 * Math.PI / 3)),
    // Vértice 2: traseira
    new THREE.Vector3(R * Math.cos(4 * Math.PI / 3), 0, R * Math.sin(4 * Math.PI / 3)),
    // Vértice 3: topo (centrado horizontalmente)
    new THREE.Vector3(0, height, 0)
  ];

  return (
    <group>
      {vertices.map((vertex, index) => (
        <mesh key={index} position={vertex}>
          <sphereGeometry args={[0.08]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
      ))}
    </group>
  );
}


function createPyramidGeometry(params: GeometryParams): THREE.BufferGeometry {
  const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
  const n = numSides;
  const r = baseEdgeLength / (2 * Math.sin(Math.PI / n));
  
  const vertices: number[] = [];
  const indices: number[] = [];
  
  // Base vertices
  for (let i = 0; i < n; i++) {
    const angle = (i * 2 * Math.PI) / n;
    vertices.push(r * Math.cos(angle), 0, r * Math.sin(angle));
  }
  
  // Apex
  vertices.push(0, height, 0);
  
  // Base triangulation
  for (let i = 1; i < n - 1; i++) {
    indices.push(0, i, i + 1);
  }
  
  // Lateral faces
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    indices.push(i, next, n);
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setFromPoints(vertices.map((_, i) => 
    new THREE.Vector3(vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2])
  ).filter((_, i) => i < vertices.length / 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}

function createPrismGeometry(params: GeometryParams): THREE.BufferGeometry {
  const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
  const n = numSides;
  const r = baseEdgeLength / (2 * Math.sin(Math.PI / n));
  
  const vertices: number[] = [];
  const indices: number[] = [];
  
  // Bottom base vertices
  for (let i = 0; i < n; i++) {
    const angle = (i * 2 * Math.PI) / n;
    vertices.push(r * Math.cos(angle), 0, r * Math.sin(angle));
  }
  
  // Top base vertices
  for (let i = 0; i < n; i++) {
    const angle = (i * 2 * Math.PI) / n;
    vertices.push(r * Math.cos(angle), height, r * Math.sin(angle));
  }
  
  // Bottom base triangulation
  for (let i = 1; i < n - 1; i++) {
    indices.push(0, i, i + 1);
  }
  
  // Top base triangulation
  for (let i = 1; i < n - 1; i++) {
    indices.push(n, n + i + 1, n + i);
  }
  
  // Lateral faces
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    // Two triangles per face
    indices.push(i, next, n + i);
    indices.push(next, n + next, n + i);
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}

function createTetrahedronGeometry(params: GeometryParams): THREE.BufferGeometry {
  const { sideLength = 2 } = params;
  const a = sideLength;
  
  // Para um tetraedro regular com aresta a, vamos usar coordenadas padrão
  // Base no plano y=0, vértice superior centralizado
  
  // Altura do tetraedro regular
  const height = a * Math.sqrt(2/3);
  
  // Para um triângulo equilátero de lado a, a distância do centro ao vértice é:
  const R = a / Math.sqrt(3); // raio circunscrito
  
  const vertices: number[] = [];
  const indices: number[] = [];
  
  // Vértices da base (triângulo equilátero centrado na origem)
  // Vértice 0: frente-direita
  vertices.push(R * Math.cos(0), 0, R * Math.sin(0));
  // Vértice 1: frente-esquerda  
  vertices.push(R * Math.cos(2 * Math.PI / 3), 0, R * Math.sin(2 * Math.PI / 3));
  // Vértice 2: traseira
  vertices.push(R * Math.cos(4 * Math.PI / 3), 0, R * Math.sin(4 * Math.PI / 3));
  
  // Vértice 3: topo (centrado horizontalmente)
  vertices.push(0, height, 0);
  
  // Faces do tetraedro (4 triângulos)
  // Base (vista de baixo - ordem horária)
  indices.push(0, 1, 2);
  
  // Faces laterais (vistas de fora - ordem anti-horária)
  indices.push(0, 3, 1);
  indices.push(1, 3, 2);
  indices.push(2, 3, 0);
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}

function createOctahedronGeometry(params: GeometryParams): THREE.BufferGeometry {
  const { sideLength = 2 } = params;
  const a = sideLength;
  
  // Octaedro regular: 6 vértices, 8 faces triangulares
  // Distância do centro aos vértices: a/√2
  const d = a / Math.sqrt(2);
  
  const vertices: number[] = [
    // Vértices nos eixos coordenados
     d,  0,  0,  // 0: +X
    -d,  0,  0,  // 1: -X
     0,  d,  0,  // 2: +Y (superior)
     0, -d,  0,  // 3: -Y (inferior)
     0,  0,  d,  // 4: +Z
     0,  0, -d   // 5: -Z
  ];
  
  // Mover para que o vértice inferior fique em y=0
  for (let i = 1; i < vertices.length; i += 3) {
    vertices[i] += d; // Adicionar d ao eixo Y
  }
  
  const indices: number[] = [
    // Faces da pirâmide superior (vértice 2 = topo)
    2, 0, 4,  // Face 1
    2, 4, 1,  // Face 2
    2, 1, 5,  // Face 3
    2, 5, 0,  // Face 4
    
    // Faces da pirâmide inferior (vértice 3 = base)
    3, 4, 0,  // Face 5
    3, 1, 4,  // Face 6
    3, 5, 1,  // Face 7
    3, 0, 5   // Face 8
  ];
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}

function createDodecahedronGeometry(params: GeometryParams): THREE.BufferGeometry {
  // Usar a geometria built-in do Three.js para o dodecaedro
  const { sideLength = 2 } = params;
  
  // O raio da esfera circunscrita para um dodecaedro regular
  const radius = sideLength * (Math.sqrt(3) * (1 + Math.sqrt(5))) / 4;
  
  const geometry = new THREE.DodecahedronGeometry(radius);
  
  // Mover para que a base fique em y=0
  geometry.translate(0, radius, 0);
  
  return geometry;
}

function createIcosahedronGeometry(params: GeometryParams): THREE.BufferGeometry {
  // Usar a geometria built-in do Three.js para o icosaedro
  const { sideLength = 2 } = params;
  
  // O raio da esfera circunscrita para um icosaedro regular
  const phi = (1 + Math.sqrt(5)) / 2; // Número áureo
  const radius = (sideLength * phi) / (2 * Math.sin(Math.PI / 5));
  
  const geometry = new THREE.IcosahedronGeometry(radius);
  
  // Mover para que a base fique em y=0
  geometry.translate(0, radius, 0);
  
  return geometry;
}

function getMinDistance(params: GeometryParams): number {
  // Distância mínima que permite zoom muito próximo
  return 0.5;
}

function getMaxDistance(params: GeometryParams): number {
  // Distância máxima que permite zoom out muito amplo
  return 100;
}

function getCameraTarget(params: GeometryParams): [number, number, number] {
  // Centralizar todas as geometrias no mesmo ponto (meio da altura)
  let height = params.height || 4;
  
  // Para esfera, usar o diâmetro como altura
  if (params.type === 'sphere') {
    height = (params.radius || 2) * 2;
  }
  
  return [0, height / 2, 0];
}

function getGeometryName(type: string): string {
  const names = {
    pyramid: 'Pirâmide',
    cylinder: 'Cilindro',
    cone: 'Cone',
    cube: 'Cubo',
    sphere: 'Esfera',
    prism: 'Prisma',
    tetrahedron: 'Tetraedro',
    octahedron: 'Octaedro',
    dodecahedron: 'Dodecaedro',
    icosahedron: 'Icosaedro'
  };
  return names[type as keyof typeof names] || type;
}

interface GeometryCanvasProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
  onVertexSelect?: (vertexIndex: number) => void;
  onStyleChange?: (key: keyof StyleOptions, value: any) => void;
}

export default function GeometryCanvas({ params, options, style, onVertexSelect, onStyleChange }: GeometryCanvasProps) {
  return (
    <div className="w-full h-full relative">
        <Canvas 
          camera={{ 
            position: [8, 6, 8], 
            fov: 50,
            near: 0.01,
            far: 1000
          }}
          style={{ 
            width: '100%', 
            height: '100%',
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
          gl={{ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: true,
            failIfMajorPerformanceCaveat: false
          }}
          onCreated={({ gl, camera }) => {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            gl.outputColorSpace = 'srgb';
            // Configurar câmera inicial fixa
            camera.position.set(8, 6, 8);
            camera.lookAt(0, 2, 0);
            camera.updateProjectionMatrix();
          }}
        >
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow={options.showShadow}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-10, -10, -5]} intensity={0.3} />
        
        <GeometryMesh 
          params={params}
          options={options}
          style={style}
          onVertexSelect={onVertexSelect}
          onStyleChange={onStyleChange}
        />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
          minDistance={params.type === 'tetrahedron' ? 0.5 : 1}
          maxDistance={params.type === 'tetrahedron' ? 20 : 50}
          enableDamping={true}
          dampingFactor={0.05}
          target={params.type === 'tetrahedron' ? [0, 1, 0] : [0, 2, 0]}
          maxPolarAngle={Math.PI * 0.95}
          minPolarAngle={Math.PI * 0.05}
          zoomSpeed={1}
          rotateSpeed={0.5}
          panSpeed={0.8}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
          }}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
          }}
          screenSpacePanning={false}
          makeDefault={false}
        />
        
        {options.showGrid && (
          <Grid 
            args={[30, 30]}
            position={[0, -0.2, 0]}
            cellColor="#444"
            sectionColor="#666"
            fadeDistance={15}
            fadeStrength={2}
            infiniteGrid={false}
          />
        )}
      </Canvas>
    </div>
  );
}