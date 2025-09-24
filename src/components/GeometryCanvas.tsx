import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useLanguage } from '@/context/LanguageContext';
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
import { SimpleVertexConnector } from './geometry/SimpleVertexConnector';
import { Unfolded } from './geometry/Unfolded';
import PlaneDefinition from './geometry/PlaneDefinition';
import GeometricConstructions from './geometry/GeometricConstructions';
import AutoRotatingGroup from './geometry/AutoRotatingGroup';
import { getInscribedVertices, getCircumscribedVertices } from '@/lib/inscribed-circumscribed-vertices';

interface GeometryMeshProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
  onVertexSelect?: (vertexIndex: number) => void;
  onStyleChange?: (key: keyof StyleOptions, value: any) => void;
}

function GeometryMesh({ params, options, style, onVertexSelect, onStyleChange }: GeometryMeshProps) {
  const { t } = useLanguage();
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
          <lineBasicMaterial color={style.edgeColor} linewidth={style.edgeThickness || 1} />
        </lineSegments>
      )}

      {/* Vertices */}
      {options.showVertices && params.type === 'cube' && (
        <CubeVertices geometry={geometry} params={params} />
      )}
      {options.showVertices && params.type === 'tetrahedron' && (
        <TetrahedronVertices params={params} />
      )}
      {options.showVertices && params.type === 'octahedron' && (
        <OctahedronVertices 
          params={params} 
          selectedVertices={style.selectedVerticesForGeneral || []}
          onVertexSelect={(vertexIndex) => {
            console.log('=== CLIQUE NO VÉRTICE DO OCTAEDRO ===', vertexIndex);
            
            const currentSelection = style.selectedVerticesForGeneral || [];
            if (!onStyleChange) return;
            
            // Se já está selecionado, remover
            if (currentSelection.includes(vertexIndex)) {
              console.log('Removendo vértice da seleção');
              onStyleChange('selectedVerticesForGeneral', currentSelection.filter(i => i !== vertexIndex));
              return;
            }
            
            // Adicionar à seleção
            const newSelection = [...currentSelection, vertexIndex];
            console.log('Nova seleção:', newSelection);
            onStyleChange('selectedVerticesForGeneral', newSelection);
            
            // Se temos 2 vértices, criar conexão
            if (newSelection.length === 2) {
              console.log('CRIANDO CONEXÃO NO OCTAEDRO!');
              const newConnection = {
                id: `connection-${Date.now()}`,
                type: 'segmento-reta',
                vertices: [...newSelection],
                color: style.segmentColor || '#00ff00'
              };
              
              const currentConnections = style.connections || [];
              onStyleChange('connections', [...currentConnections, newConnection]);
              onStyleChange('selectedVerticesForGeneral', []); // Limpar seleção
              
              // toast.success('Conexão criada!');
            }
          }}
        />
      )}
      {options.showVertices && params.type === 'dodecahedron' && (
        <DodecahedronVertices 
          params={params} 
          selectedVertices={style.selectedVerticesForGeneral || []}
          onVertexSelect={(vertexIndex) => {
            console.log('=== CLIQUE NO VÉRTICE DO DODECAEDRO ===', vertexIndex);
            
            const currentSelection = style.selectedVerticesForGeneral || [];
            if (!onStyleChange) return;
            
            // Se já está selecionado, remover
            if (currentSelection.includes(vertexIndex)) {
              console.log('Removendo vértice da seleção');
              onStyleChange('selectedVerticesForGeneral', currentSelection.filter(i => i !== vertexIndex));
              return;
            }
            
            // Adicionar à seleção
            const newSelection = [...currentSelection, vertexIndex];
            console.log('Nova seleção:', newSelection);
            onStyleChange('selectedVerticesForGeneral', newSelection);
            
            // Se temos 2 vértices, criar conexão
            if (newSelection.length === 2) {
              console.log('CRIANDO CONEXÃO NO DODECAEDRO!');
              const newConnection = {
                id: `connection-${Date.now()}`,
                type: 'segmento-reta',
                vertices: [...newSelection],
                color: style.segmentColor || '#00ff00'
              };
              
              const currentConnections = style.connections || [];
              onStyleChange('connections', [...currentConnections, newConnection]);
              onStyleChange('selectedVerticesForGeneral', []); // Limpar seleção
              
              // toast.success('Conexão criada!');
            }
          }}
        />
      )}
      {options.showVertices && params.type === 'icosahedron' && (
        <IcosahedronVertices 
          params={params} 
          selectedVertices={style.selectedVerticesForGeneral || []}
          onVertexSelect={(vertexIndex) => {
            console.log('=== CLIQUE NO VÉRTICE DO ICOSAEDRO ===', vertexIndex);
            
            const currentSelection = style.selectedVerticesForGeneral || [];
            if (!onStyleChange) return;
            
            // Se já está selecionado, remover
            if (currentSelection.includes(vertexIndex)) {
              console.log('Removendo vértice da seleção');
              onStyleChange('selectedVerticesForGeneral', currentSelection.filter(i => i !== vertexIndex));
              return;
            }
            
            // Adicionar à seleção
            const newSelection = [...currentSelection, vertexIndex];
            console.log('Nova seleção:', newSelection);
            onStyleChange('selectedVerticesForGeneral', newSelection);
            
            // Se temos 2 vértices, criar conexão
            if (newSelection.length === 2) {
              console.log('CRIANDO CONEXÃO NO ICOSAEDRO!');
              const newConnection = {
                id: `connection-${Date.now()}`,
                type: 'segmento-reta',
                vertices: [...newSelection],
                color: style.segmentColor || '#00ff00'
              };
              
              const currentConnections = style.connections || [];
              onStyleChange('connections', [...currentConnections, newConnection]);
              onStyleChange('selectedVerticesForGeneral', []); // Limpar seleção
              
              // toast.success('Conexão criada!');
            }
          }}
        />
      )}
      {options.showVertices && params.type !== 'cylinder' && params.type !== 'cube' && params.type !== 'tetrahedron' && params.type !== 'octahedron' && params.type !== 'dodecahedron' && params.type !== 'icosahedron' && (
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
        baseApothemColor={style.baseApothemColor || "#00ffff"}
        lateralApothemColor={style.lateralApothemColor || "#ff0000"}
        lineWidth={style.lateralApothemThickness || 1}
        dashSize={0.1}
        gapSize={0.05}
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

      {/* Segmentos Criados - SEMPRE VISÍVEIS */}
      {(() => {
        console.log('=== SEGMENTOS SEMPRE VISÍVEIS DEBUG ===');
        console.log('style.connections:', style.connections);
        console.log('Array.isArray(style.connections):', Array.isArray(style.connections));
        console.log('style.connections.length:', style.connections?.length);
        console.log('activeVertexMode:', style.activeVertexMode);
        return Array.isArray(style.connections) && style.connections.length > 0;
      })() && (
        <SimpleVertexConnector
          params={params}
          selectedVertices={[]}
          connections={style.connections || []}
          edgeColor={style.segmentColor || '#00ff00'}
          lineWidth={style.segmentThickness || 1.0}
          onVertexSelect={() => {}} // Não faz nada, apenas renderiza
          onClearConnections={() => {}}
          onDeleteConnection={(connectionId) => {
            console.log('Deletando conexão:', connectionId);
            const updatedConnections = style.connections?.filter(c => c.id !== connectionId) || [];
            onStyleChange('connections', updatedConnections);
            toast.success('Segmento removido!');
          }}
        />
      )}

      {/* Conectores de Vértices - SISTEMA SIMPLIFICADO - APENAS NO MODO CONNECTION */}
      {options.showVertexConnector && style.activeVertexMode === 'connection' && (
        <SimpleVertexConnector
          params={params}
          selectedVertices={style.selectedVerticesForGeneral || []}
          connections={style.connections || []}
          edgeColor={style.segmentColor || '#00ff00'}
          lineWidth={style.segmentThickness || 1.0}
          inscribedVertices={getInscribedVertices(params, options)}
          circumscribedVertices={getCircumscribedVertices(params, options)}
          onVertexSelect={(vertexIndex) => {
            console.log('=== CLIQUE NO VÉRTICE ===', vertexIndex);
            
            const currentSelection = style.selectedVerticesForGeneral || [];
            if (!onStyleChange) return;
            
            // Se já está selecionado, remover
            if (currentSelection.includes(vertexIndex)) {
              console.log('Removendo vértice da seleção');
              onStyleChange('selectedVerticesForGeneral', currentSelection.filter(i => i !== vertexIndex));
              return;
            }
            
            // Adicionar à seleção
            const newSelection = [...currentSelection, vertexIndex];
            console.log('Nova seleção:', newSelection);
            onStyleChange('selectedVerticesForGeneral', newSelection);
            
            // Se temos 2 vértices, criar conexão
            if (newSelection.length === 2) {
              console.log('CRIANDO CONEXÃO!');
              const newConnection = {
                id: `connection-${Date.now()}`,
                type: 'segmento-reta',
                vertices: [...newSelection],
                color: style.segmentColor || '#00ff00'
              };
              
              const currentConnections = style.connections || [];
              onStyleChange('connections', [...currentConnections, newConnection]);
              onStyleChange('selectedVerticesForGeneral', []); // Limpar seleção
              
              toast.success('Conexão criada!');
            }
          }}
          onClearConnections={() => {
            onStyleChange('connections', []);
            onStyleChange('selectedVerticesForGeneral', []);
          }}
          onDeleteConnection={(connectionId) => {
            console.log('Deletando conexão:', connectionId);
            const updatedConnections = style.connections?.filter(c => c.id !== connectionId) || [];
            onStyleChange('connections', updatedConnections);
            toast.success('Segmento removido!');
          }}
        />
      )}

      {/* Seleção de Vértices para Seção Meridiana - APENAS NO MODO MERIDIAN */}
      {['cube', 'prism', 'tetrahedron', 'pyramid', 'cylinder', 'cone'].includes(params.type) && 
       options.showMeridianSection && 
       style.activeVertexMode === 'meridian' && (
        <VertexConnector
          params={params}
          showVertexConnections={options.showMeridianSection}
          selectedVertices={style.selectedVerticesForMeridian || []}
          onVertexSelect={(vertexIndex) => {
            if (!onStyleChange) return;
            
            const current = style.selectedVerticesForMeridian || [];
            if (current.length < 2) {
              onStyleChange('selectedVerticesForMeridian', [...current, vertexIndex]);
            } else {
              // Reset and start new selection
              onStyleChange('selectedVerticesForMeridian', [vertexIndex]);
            }
          }}
          edgeColor={style.meridianSectionColor}
          vertexColor="#ff8c00" // Laranja para seção meridiana
          selectedVertexColor="#ff4500" // Vermelho-laranja quando selecionado
          connectionType="meridian"
          onClearSelection={() => {
            if (!onStyleChange) return;
            onStyleChange('selectedVerticesForMeridian', []);
          }}
        />
      )}

      {/* Seleção de Vértices para Seção Meridiana em Prismas - APENAS quando explicitamente solicitado E NO MODO MERIDIAN */}
      {params.type === 'prism' && 
       options.showMeridianSection && 
       options.showVertexSelection && 
       options.showVertexConnector && 
       style.activeVertexMode === 'meridian' && (
        <VertexConnector
          params={params}
          showVertexConnections={true}
          selectedVertices={style.selectedVerticesForMeridian}
          onVertexSelect={(vertexIndex) => {
            // Handler específico para seção meridiana em prismas - não interfere com outras seleções
            if (!onStyleChange) return;
            
            const current = style.selectedVerticesForMeridian || [];
            if (current.length < 2) {
              onStyleChange('selectedVerticesForMeridian', [...current, vertexIndex]);
            } else {
              // Reset and start new selection
              onStyleChange('selectedVerticesForMeridian', [vertexIndex]);
            }
          }}
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

      {/* Planos Criados - SEMPRE VISÍVEIS - INDEPENDENTE DO MODO */}
      {(() => {
        console.log('=== PLANOS CRIADOS DEBUG ===');
        console.log('showPlaneDefinition:', options.showPlaneDefinition);
        console.log('params.type:', params.type);
        console.log('style.planes:', style.planes);
        console.log('style.planes.length:', style.planes?.length);
        console.log('activeVertexMode:', style.activeVertexMode);
        console.log('Should render planes:', params.type !== 'tetrahedron' && 
                   style.planes && 
                   style.planes.length > 0);
        return params.type !== 'tetrahedron' && 
               style.planes && 
               style.planes.length > 0;
      })() && (
        <PlaneDefinition
          params={params}
          style={style}
          isEquilateral={options.isEquilateral}
          selectedVertices={[]} // Não mostrar seleção quando apenas renderizando
          selectedPositions={[]}
          showPlane={false} // Não mostrar plano de seleção
          showSelectionInstructions={false} // Não mostrar instruções
          showNormalVector={false} // Não mostrar vetor normal
          showVerticesAlways={false} // Não mostrar vértices clicáveis
          planes={style.planes}
          onVertexSelect={() => {}} // Não fazer nada
          onClearSelection={() => {}}
          onCreatePlane={() => {}}
        />
      )}

      {/* Definição de Planos por 3 Vértices - APENAS NO MODO PLANE */}
      {(() => {
        console.log('=== PLANE INTERACTION DEBUG ===');
        console.log('showPlaneDefinition:', options.showPlaneDefinition);
        console.log('params.type:', params.type);
        console.log('activeVertexMode:', style.activeVertexMode);
        console.log('Should show plane interaction:', options.showPlaneDefinition && 
                   params.type !== 'tetrahedron' && 
                   style.activeVertexMode === 'plane');
        return options.showPlaneDefinition && 
               params.type !== 'tetrahedron' && 
               style.activeVertexMode === 'plane';
      })() && (
        <PlaneDefinition
          params={params}
          style={style}
          isEquilateral={options.isEquilateral}
          selectedVertices={style.selectedVerticesForPlane}
          selectedPositions={style.intersectionPositions || []}
          showPlane={style.selectedVerticesForPlane.length >= 3}
          showSelectionInstructions={true}
          showNormalVector={true}
          showVerticesAlways={true}
          planes={[]} // Não mostrar planos criados aqui (já renderizados acima)
          onVertexSelect={(vertexIndex, position) => {
            console.log('=== PLANE VERTEX SELECT DEBUG ===');
            console.log('Vertex clicked:', vertexIndex);
            console.log('Position:', position);
            console.log('Active mode:', style.activeVertexMode);
            console.log('Should process:', style.activeVertexMode === 'plane');
            
            // Apenas processar se o modo de planos estiver ativo
            if (style.activeVertexMode !== 'plane') {
              console.log('Not in plane mode, ignoring click');
              return;
            }
            
            // Handler específico para criação de planos - não interfere com outras seleções
            if (!onStyleChange) {
              console.log('No onStyleChange function available');
              return;
            }
            
            const currentSelection = style.selectedVerticesForPlane || [];
            console.log('Current selection:', currentSelection);
            console.log('Planes count:', style.planes.length);
            
            // Verificar limite de planos
            if (style.planes.length >= 5 && currentSelection.length === 0) {
              console.log('Plane limit reached, ignoring selection');
              return; // Não permitir nova seleção se já há 5 planos
            }
            
            if (currentSelection.includes(vertexIndex)) {
              // Remove vertex if already selected
              console.log('Removing vertex from selection');
              onStyleChange('selectedVerticesForPlane', currentSelection.filter(i => i !== vertexIndex));
            } else if (currentSelection.length < 3) {
              // Adicionar o vértice se não estiver na lista e ainda não temos 3
              console.log('Adding vertex to selection');
              const newSelection = [...currentSelection, vertexIndex];
              console.log('New selection:', newSelection);
              onStyleChange('selectedVerticesForPlane', newSelection);
            } else {
              console.log('Selection limit reached (3 vertices)');
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
              // Criar novo plano com nome único
              const planeNumber = currentPlanes.length + 1;
              const newPlane = {
                id: `plane-${Date.now()}-${planeNumber}`,
                name: `Plano ${planeNumber}`,
                vertices: [...currentSelection],
                color: style.planeColor,
                opacity: style.planeOpacity
              };
              
              console.log('Novo plano criado:', newPlane);
              
              // Garantir que preservamos os planos existentes
              const updatedPlanes = [...currentPlanes, newPlane];
              console.log('Lista final de planos:', updatedPlanes);
              console.log('Total de planos após criação:', updatedPlanes.length);
              
              // Usar uma única atualização de estado para evitar conflitos
              onStyleChange('planes', updatedPlanes);
              
              // Limpar seleção após criar plano
              setTimeout(() => {
                onStyleChange('selectedVerticesForPlane', []);
              }, 100);
              
              // Feedback visual
              toast.success(`${newPlane.name} criado com sucesso! (${updatedPlanes.length}/5 planos)`);
            } else if (currentSelection.length < 3) {
              toast.error('Selecione pelo menos 3 vértices para criar um plano');
            } else if (currentPlanes.length >= 5) {
              toast.error('Limite máximo de 5 planos atingido');
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
            // Apenas processar se o modo de construções estiver ativo
            if (style.activeVertexMode !== 'construction') return;
            
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
          {getGeometryName(params.type, t)}
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

// Componente específico para vértices do octaedro
function OctahedronVertices({ 
  params, 
  selectedVertices = [], 
  onVertexSelect 
}: { 
  params: GeometryParams;
  selectedVertices?: number[];
  onVertexSelect?: (index: number) => void;
}) {
  const { sideLength = 2 } = params;
  const a = sideLength;
  
  // Usar exatamente as mesmas coordenadas da função createOctahedronGeometry
  const d = a / Math.sqrt(2);
  
  const vertices = [
    new THREE.Vector3(d, d, 0),    // 0: +X
    new THREE.Vector3(-d, d, 0),   // 1: -X
    new THREE.Vector3(0, d + d, 0), // 2: +Y (superior)
    new THREE.Vector3(0, 0, 0),     // 3: -Y (inferior)
    new THREE.Vector3(0, d, d),     // 4: +Z
    new THREE.Vector3(0, d, -d)     // 5: -Z
  ];

  return (
    <group>
      {vertices.map((vertex, index) => {
        const isSelected = selectedVertices.includes(index);
        
        return (
          <mesh 
            key={index} 
            position={vertex}
            onClick={(e) => {
              e.stopPropagation();
              console.log(`Clique no vértice ${index} do octaedro`);
              onVertexSelect?.(index);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'default';
            }}
            renderOrder={4}
          >
            <sphereGeometry args={[0.08]} />
            <meshBasicMaterial 
              color={isSelected ? "#ffd700" : "#ffff00"}
              transparent
              opacity={0.9}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Componente específico para vértices do dodecaedro
function DodecahedronVertices({ 
  params, 
  selectedVertices = [], 
  onVertexSelect 
}: { 
  params: GeometryParams;
  selectedVertices?: number[];
  onVertexSelect?: (index: number) => void;
}) {
  const { sideLength = 2 } = params;
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

  return (
    <group>
      {vertices.map((vertex, index) => {
        const isSelected = selectedVertices.includes(index);
        
        return (
          <mesh 
            key={index} 
            position={vertex}
            onClick={(e) => {
              e.stopPropagation();
              console.log(`Clique no vértice ${index} do dodecaedro`);
              onVertexSelect?.(index);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'default';
            }}
            renderOrder={4}
          >
            <sphereGeometry args={[0.08]} />
            <meshBasicMaterial 
              color={isSelected ? "#ffd700" : "#ffff00"}
              transparent
              opacity={0.9}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Função centralizada para gerar vértices do icosaedro
function getIcosahedronVertices(sideLength: number): THREE.Vector3[] {
  const phi = (1 + Math.sqrt(5)) / 2; // Número áureo
  const radius = (sideLength * phi) / (2 * Math.sin(Math.PI / 5));
  
  // Usar vértices manuais para garantir consistência
  const scale = radius / Math.sqrt(phi * phi + 1);
  
  const vertices = [
    [0, 1, phi], [0, 1, -phi], [0, -1, phi], [0, -1, -phi],
    [1, phi, 0], [1, -phi, 0], [-1, phi, 0], [-1, -phi, 0],
    [phi, 0, 1], [phi, 0, -1], [-phi, 0, 1], [-phi, 0, -1]
  ];
  
  return vertices.map(([x, y, z]) => 
    new THREE.Vector3(x * scale, y * scale + radius, z * scale)
  );
}

// Componente específico para vértices do icosaedro
function IcosahedronVertices({ 
  params, 
  selectedVertices = [], 
  onVertexSelect 
}: { 
  params: GeometryParams;
  selectedVertices?: number[];
  onVertexSelect?: (index: number) => void;
}) {
  const { sideLength = 2 } = params;
  const vertices = getIcosahedronVertices(sideLength);

  return (
    <group>
      {vertices.map((vertex, index) => {
        const isSelected = selectedVertices.includes(index);
        
        return (
          <mesh 
            key={index} 
            position={vertex}
            onClick={(e) => {
              e.stopPropagation();
              console.log(`Clique no vértice ${index} do icosaedro`);
              onVertexSelect?.(index);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'default';
            }}
            renderOrder={4}
          >
            <sphereGeometry args={[0.08]} />
            <meshBasicMaterial 
              color={isSelected ? "#ffd700" : "#ffff00"}
              transparent
              opacity={0.9}
            />
          </mesh>
        );
      })}
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

function getGeometryName(type: string, t: (key: string) => string): string {
  const names = {
    pyramid: t('geometry.pyramid'),
    cylinder: t('geometry.cylinder'),
    cone: t('geometry.cone'),
    cube: t('geometry.cube'),
    sphere: t('geometry.sphere'),
    prism: t('geometry.prism'),
    tetrahedron: t('geometry.tetrahedron'),
    octahedron: t('geometry.octahedron'),
    dodecahedron: t('geometry.dodecahedron'),
    icosahedron: t('geometry.icosahedron')
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
            position: [6, 4, 6], 
            fov: 60,
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
            // Configurar câmera inicial para mostrar o sólido completo em tamanho maior
            camera.position.set(6, 4, 6);
            camera.lookAt(0, 1, 0);
            camera.updateProjectionMatrix();
          }}
        >
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[8, 8, 4]} 
          intensity={1.2}
          castShadow={options.showShadow}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-8, -8, -4]} intensity={0.4} />
        
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
          target={[0, 1, 0]}
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
            args={[20, 20]}
            position={[0, 0, 0]}
            cellColor="#555"
            sectionColor="#777"
            fadeDistance={12}
            fadeStrength={1.5}
            infiniteGrid={false}
          />
        )}
      </Canvas>
    </div>
  );
}