import * as THREE from 'three';

export type GeometryType =
  | 'pyramid' 
  | 'cylinder' 
  | 'cone' 
  | 'cube' 
  | 'sphere' 
  | 'prism'
  | 'tetrahedron'
  | 'octahedron'
  | 'dodecahedron' 
  | 'icosahedron'
  | 'revolution-solids'
  | 'archimedean-solids'
  | 'cone-frustum'
  | 'pyramid-frustum';

export interface GeometryProperties {
  baseArea?: number;
  lateralArea?: number;
  totalArea?: number;
  surfaceArea?: number;
  volume: number;
  perimeter?: number;
  apothem?: number;
  lateralApothem?: number;
  inscribedRadius?: number;
  circumscribedRadius?: number;
}

export interface GeometryParams {
  type: GeometryType;
  height?: number;
  radius?: number;
  sideLength?: number;
  baseEdgeLength?: number;
  numSides?: number;
  isEquilateral?: boolean;
  // Parâmetros para sólidos de revolução
  revolutionType?: 'triangle' | 'rectangle' | 'semicircle' | 'trapezoid';
  revolutionAxis?: 'x' | 'y' | 'z';
  revolutionSpeed?: number;
  showRevolutionPath?: boolean;
  show2DShape?: boolean;
  revolutionProgress?: number; // 0 a 1 - progresso da revolução
  isAnimating?: boolean; // Estado da animação
  revolution2DColor?: string; // Cor da forma 2D
  revolution2DOpacity?: number; // Opacidade da forma 2D
  revolution3DColor?: string; // Cor do sólido 3D
  revolution3DOpacity?: number; // Opacidade do sólido 3D
  show3DSolid?: boolean; // Mostrar sólido 3D
  // Parâmetros específicos para formas
  triangleBase?: number;
  triangleHeight?: number;
  rectangleWidth?: number;
  rectangleHeight?: number;
  semicircleRadius?: number;
  trapezoidTopBase?: number;
  trapezoidBottomBase?: number;
  trapezoidHeight?: number;
  // Parâmetros para sólidos arquimedianos
  archimedeanType?: 'truncated-tetrahedron' | 'cuboctahedron' | 'truncated-cube' | 'truncated-octahedron' | 'rhombicuboctahedron' | 'icosidodecahedron' | 'truncated-dodecahedron' | 'truncated-icosahedron' | 'snub-cube' | 'snub-dodecahedron';
  archimedeanSize?: number;
  archimedeanOpacity?: number;
  archimedeanWireframe?: boolean;
  archimedeanColor?: string;
  archimedeanEdgeColor?: string;
  // Parâmetros para troncos
  frustumCutHeight?: number; // Altura do corte (0% a 90% da altura total)
  frustumBaseSides?: number; // Número de lados da base da pirâmide (3-12)
  frustumSeparable?: boolean; // Se as partes podem ser separadas
  frustumTopVisible?: boolean; // Se a parte superior cortada é visível
  frustumTopMovable?: boolean; // Se a parte superior pode ser movida
  frustumRotating?: boolean; // Se o tronco está rotacionando
  // Cores individuais para cada parte
  frustumBottomColor?: string; // Cor da parte inferior
  frustumTopColor?: string; // Cor da parte superior
  // Opacidades individuais
  frustumBottomOpacity?: number; // Opacidade da parte inferior
  frustumTopOpacity?: number; // Opacidade da parte superior
  // Alturas individuais
  frustumBottomHeight?: number; // Altura da parte inferior
  frustumTopHeight?: number; // Altura da parte superior
  // Segmentos de altura
  frustumShowHeightSegments?: boolean; // Mostrar segmentos de altura
  frustumBottomSegmentColor?: string; // Cor do segmento do tronco
  frustumTopSegmentColor?: string; // Cor do segmento da parte superior
  frustumBottomSegmentThickness?: number; // Espessura do segmento do tronco
  frustumTopSegmentThickness?: number; // Espessura do segmento da parte superior
}

export interface VisualizationOptions {
  showEdges: boolean;
  showVertices: boolean;
  fillFaces: boolean;
  showLateralApothem: boolean;
  showBaseApothem: boolean;
  showHeight: boolean;
  showBaseRadius: boolean;
  showInscribedRadius: boolean;
  showCircumscribedRadius: boolean;
  showInscribedCircle: boolean;
  showCircumscribedCircle: boolean;
  showGeneratrix: boolean;
  showLabels: boolean;
  wireframe: boolean;
  autoRotate: boolean;
  showGrid: boolean;
  showCrossSection: boolean;
  showMeridianSection: boolean;
  showDimensions: boolean;
  showShadow: boolean;
  isFrozen: boolean;
  // Ferramenta ativa para evitar conflitos entre modos
  activeTool?: 'none' | 'cross-section' | 'meridian-section' | 'vertex-connector' | 'plane-definition' | 'construction' | 'pan' | 'midpoint' | 'parallel' | 'angle' | 'measure' | 'align' | 'independent-text' | 'text-select';
  // Formas inscritas e circunscritas
  showInscribedSphere: boolean;
  showCircumscribedSphere: boolean;
  showInscribedCube: boolean;
  showCircumscribedCube: boolean;
  showInscribedCone: boolean;
  showCircumscribedCone: boolean;
  showInscribedCylinder: boolean;
  showCircumscribedCylinder: boolean;
  showInscribedOctahedron: boolean;
  // Controles individuais para formas inscritas
  inscribedSphereShowEdges: boolean;
  inscribedSphereShowFaces: boolean;
  inscribedCubeShowEdges: boolean;
  inscribedCubeShowFaces: boolean;
  inscribedConeShowEdges: boolean;
  inscribedConeShowFaces: boolean;
  inscribedCylinderShowEdges: boolean;
  inscribedCylinderShowFaces: boolean;
  inscribedOctahedronShowEdges: boolean;
  inscribedOctahedronShowFaces: boolean;
  // Controles individuais para formas circunscritas
  circumscribedSphereShowEdges: boolean;
  circumscribedSphereShowFaces: boolean;
  circumscribedCubeShowEdges: boolean;
  circumscribedCubeShowFaces: boolean;
  circumscribedConeShowEdges: boolean;
  circumscribedConeShowFaces: boolean;
  circumscribedCylinderShowEdges: boolean;
  circumscribedCylinderShowFaces: boolean;
  // Formas equiláteras
  isEquilateral: boolean;
  // Esferas com ângulo personalizado
  sphereSegmentAngle: number;
  showSphericalSegment: boolean;
  showSphericalSector: boolean;
  // Conectores de vértices
  showVertexConnector: boolean;
  // Seleção de vértices para seção meridiana em prismas
  showVertexSelection: boolean;
  // Diagonal do cubo
  showCubeDiagonal: boolean;
  // Altura da seção transversal (0-1)
  crossSectionHeight: number;
  // Altura da seção meridiana (0-1)
  meridianSectionHeight: number;
  // Número de segmentos das esferas
  sphereWidthSegments: number;
  sphereHeightSegments: number;
  // Planificação das figuras
  showUnfolded: boolean;
  // Definição de planos por 3 pontos
  showPlaneDefinition: boolean;
  // Construções geométricas
  showGeometricConstructions: boolean;
}

export interface StyleOptions {
  edgeColor: string;
  faceColor: string;
  faceOpacity: number;
  rotationSpeed: number;
  heightLineColor: string;
  inscribedShapeColor: string;
  circumscribedShapeColor: string;
  inscribedShapeOpacity: number;
  circumscribedShapeOpacity: number;
  sphericalSegmentColor: string;
  sphericalSegmentOpacity: number;
  // Cores individuais para formas inscritas
  inscribedSphereColor: string;
  inscribedCubeColor: string;
  inscribedConeColor: string;
  inscribedCylinderColor: string;
  inscribedOctahedronColor: string;
  // Cores individuais para formas circunscritas
  circumscribedSphereColor: string;
  circumscribedCubeColor: string;
  circumscribedConeColor: string;
  circumscribedCylinderColor: string;
  // Opacidades individuais para formas inscritas
  inscribedSphereOpacity: number;
  inscribedCubeOpacity: number;
  inscribedConeOpacity: number;
  inscribedCylinderOpacity: number;
  inscribedOctahedronOpacity: number;
  // Opacidades individuais para formas circunscritas
  circumscribedSphereOpacity: number;
  circumscribedCubeOpacity: number;
  circumscribedConeOpacity: number;
  circumscribedCylinderOpacity: number;
  // Conectores de vértices
  showVertexConnector: boolean;
  // Cores das arestas para formas inscritas/circunscritas
  inscribedEdgeColor: string;
  circumscribedEdgeColor: string;
  // Cor da seção meridiana
  meridianSectionColor: string;
  // Opacidade da seção meridiana
  meridianSectionOpacity: number;
  // Número de geratrizes para cilindros e cones
  cylinderGeneratrices: number;
  coneGeneratrices: number;
  // Vértices selecionados para seção meridiana em prismas
  selectedVerticesForMeridian: number[];
  // Vértices selecionados para conexão geral
  selectedVerticesForGeneral: number[];
  // Posições de intersecção geradas
  intersectionPositions: THREE.Vector3[];
  // Cores para circunferências
  inscribedCircleColor: string;
  circumscribedCircleColor: string;
  // Definição de planos por 3 pontos
  selectedVerticesForPlane: number[];
  planeColor: string;
  planeOpacity: number;
  planes: PlaneDefinition[];
  // Configurações para múltiplos planos
  maxPlanes?: number;
  activePlaneIndex?: number;
  planeConfigs?: Array<{
    id: number;
    color: string;
    opacity: number;
    vertices: number[];
    created: boolean;
  }>;
  // Construções geométricas
  selectedVerticesForConstruction: number[];
  constructionType: 'reta-perpendicular' | 'reta-paralela' | 'mediatriz' | 'bissetriz' | 'reta-tangente' | 'ponto-medio' | 'segmento-reta' | null;
  constructionColor: string;
  constructions: GeometricConstruction[];
  // Cores separadas para raio inscrito e circunferência inscrita
  inscribedRadiusColor: string;
  // Espessuras para diferentes elementos
  heightThickness: number;
  baseRadiusThickness: number;
  inscribedRadiusThickness: number;
  circumscribedRadiusThickness: number;
  inscribedCircleThickness: number;
  circumscribedCircleThickness: number;
  lateralApothemThickness: number;
  baseApothemThickness: number;
  // Cores para apótemas
  baseApothemColor: string;
  lateralApothemColor: string;
  // Modo ativo de seleção de vértices
  activeVertexMode: 'none' | 'meridian' | 'plane' | 'connection' | 'construction';
  // Conexões entre vértices
  connections: GeometricConstruction[];
  // Espessura dos segmentos
  segmentThickness: number;
  // Espessura das arestas
  edgeThickness: number;
  // Cor dos segmentos
  segmentColor: string;
  // Controles de arestas para sólidos inscritos
  inscribedEdgeThickness: number;
  inscribedEdgeColor: string;
  // Controles de arestas para sólidos circunscritos
  circumscribedEdgeThickness: number;
  circumscribedEdgeColor: string;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PlaneDefinition {
  id: string;
  name?: string;
  vertices: number[];
  color: string;
  opacity: number;
}

export interface GeometricConstruction {
  id: string;
  type: 'reta-perpendicular' | 'reta-paralela' | 'mediatriz' | 'bissetriz' | 'reta-tangente' | 'ponto-medio' | 'segmento-reta';
  vertices: number[];
  color: string;
}