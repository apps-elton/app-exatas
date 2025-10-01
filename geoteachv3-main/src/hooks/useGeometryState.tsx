import { useState, useCallback, useEffect } from 'react';
import { GeometryParams, VisualizationOptions, StyleOptions, GeometryType } from '@/types/geometry';

// Estados padrão básicos (apenas arestas, vértices e faces) para quando trocar de geometria
const getBasicOptions = (): VisualizationOptions => ({
  showEdges: true,
  showVertices: true,
  fillFaces: true,
  showLateralApothem: false,
  showBaseApothem: false,
  showHeight: false,
  showBaseRadius: false,
  showInscribedRadius: false,
  showCircumscribedRadius: false,
  showInscribedCircle: false,
  showCircumscribedCircle: false,
  showGeneratrix: false,
  showLabels: false,
  wireframe: false,
  autoRotate: false,
  showGrid: true,
  showCrossSection: false,
  showMeridianSection: false,
  showDimensions: false,
  showShadow: false,
  isFrozen: false,
  showInscribedSphere: false,
  showCircumscribedSphere: false,
  showInscribedCube: false,
  showCircumscribedCube: false,
  showInscribedCone: false,
  showCircumscribedCone: false,
  showInscribedCylinder: false,
  showCircumscribedCylinder: false,
  showInscribedOctahedron: false,
  inscribedSphereShowEdges: false,
  inscribedSphereShowFaces: true,
  inscribedCubeShowEdges: true,
  inscribedCubeShowFaces: true,
  inscribedConeShowEdges: true,
  inscribedConeShowFaces: true,
  inscribedCylinderShowEdges: true,
  inscribedCylinderShowFaces: true,
  inscribedOctahedronShowEdges: true,
  inscribedOctahedronShowFaces: true,
  circumscribedSphereShowEdges: false,
  circumscribedSphereShowFaces: true,
  circumscribedCubeShowEdges: true,
  circumscribedCubeShowFaces: true,
  circumscribedConeShowEdges: true,
  circumscribedConeShowFaces: true,
  circumscribedCylinderShowEdges: true,
  circumscribedCylinderShowFaces: true,
  isEquilateral: false,
  sphereSegmentAngle: 90,
  showSphericalSegment: false,
  showSphericalSector: false,
  showVertexConnector: false,
  showVertexSelection: false,
  showCubeDiagonal: false,
  crossSectionHeight: 0.5,
  meridianSectionHeight: 1.0,
  sphereWidthSegments: 64,
  sphereHeightSegments: 32,
  showUnfolded: false,
  showPlaneDefinition: false,
  showGeometricConstructions: false
});

// Estados padrão para cada tipo de geometria (usa as configurações básicas)
const getDefaultOptions = (): VisualizationOptions => getBasicOptions();

const getDefaultStyle = (): StyleOptions => ({
  edgeColor: '#3b82f6',
  faceColor: '#8b5cf6',
  faceOpacity: 0.7,
  rotationSpeed: 1.0,
  heightLineColor: '#ff0000',
  inscribedShapeColor: '#00ff88',
  circumscribedShapeColor: '#00aaff',
  inscribedShapeOpacity: 0.3,
  circumscribedShapeOpacity: 0.2,
  sphericalSegmentColor: '#8b5cf6',
  sphericalSegmentOpacity: 0.7,
  inscribedSphereColor: '#00ff88',
  inscribedCubeColor: '#ffaa00',
  inscribedConeColor: '#aa00ff',
  inscribedCylinderColor: '#ff6600',
  inscribedOctahedronColor: '#ff0088',
  circumscribedSphereColor: '#00aaff',
  circumscribedCubeColor: '#ffaa00',
  circumscribedConeColor: '#aa00ff',
  circumscribedCylinderColor: '#ff6600',
  inscribedSphereOpacity: 0.3,
  inscribedCubeOpacity: 0.3,
  inscribedConeOpacity: 0.3,
  inscribedCylinderOpacity: 0.3,
  inscribedOctahedronOpacity: 0.3,
  circumscribedSphereOpacity: 0.2,
  circumscribedCubeOpacity: 0.2,
  circumscribedConeOpacity: 0.2,
  circumscribedCylinderOpacity: 0.2,
  showVertexConnector: false,
  inscribedEdgeColor: '#00ff88',
  circumscribedEdgeColor: '#00aaff',
  meridianSectionColor: '#ff6600',
  // Opacidade da seção meridiana
  meridianSectionOpacity: 0.5,
  cylinderGeneratrices: 8,
  coneGeneratrices: 8,
  selectedVerticesForMeridian: [],
  selectedVerticesForGeneral: [],
  intersectionPositions: [],
  inscribedCircleColor: '#ff6600',
  circumscribedCircleColor: '#ff0066',
  selectedVerticesForPlane: [],
  planeColor: '#00ff00',
  planeOpacity: 0.3,
  selectedVerticesForConstruction: [],
  constructionType: null,
  constructionColor: '#ff6600',
  constructions: [],
  planes: [],
  inscribedRadiusColor: '#00ff00',
  heightThickness: 1.0,
  baseRadiusThickness: 1.0,
  inscribedRadiusThickness: 1.0,
  circumscribedRadiusThickness: 1.0,
  inscribedCircleThickness: 1.0,
  circumscribedCircleThickness: 1.0,
  lateralApothemThickness: 1.0,
  baseApothemThickness: 1.0,
  // Cores para apótemas
  baseApothemColor: '#00ff00',
  lateralApothemColor: '#00ff00',
  // Modo ativo de seleção de vértices
  activeVertexMode: 'none',
  // Conexões entre vértices
  connections: [],
  // Espessura dos segmentos
  segmentThickness: 1.0,
  // Espessura das arestas
  edgeThickness: 1,
  // Cor dos segmentos
  segmentColor: '#00ff00'
});

// Hook para gerenciar estados independentes por geometria
export function useGeometryState() {
  // Estados salvos para cada tipo de geometria
  const [geometryStates, setGeometryStates] = useState<Record<GeometryType, {
    options: VisualizationOptions;
    style: StyleOptions;
  }>>({} as any);

  // Estado atual
  const [currentGeometry, setCurrentGeometry] = useState<GeometryType>('prism');
  const [options, setOptions] = useState<VisualizationOptions>(getDefaultOptions());
  const [style, setStyle] = useState<StyleOptions>(getDefaultStyle());

  // Salvar estado atual quando geometria muda
  const saveCurrentState = useCallback(() => {
    setGeometryStates(prev => ({
      ...prev,
      [currentGeometry]: {
        options: { ...options },
        style: { ...style }
      }
    }));
  }, [currentGeometry, options, style]);

  // Carregar estado salvo ou usar configurações básicas para nova geometria
  const loadGeometryState = useCallback((geometryType: GeometryType) => {
    // Salvar estado atual antes de trocar
    if (currentGeometry !== geometryType) {
      setGeometryStates(prev => ({
        ...prev,
        [currentGeometry]: {
          options: { ...options },
          style: { ...style }
        }
      }));
    }
    
    // Sempre usar configurações básicas ao trocar de geometria
    // Isso garante que cada sólido comece zerado
    setOptions(getBasicOptions());
    setStyle(getDefaultStyle());
    
    setCurrentGeometry(geometryType);
  }, [currentGeometry, options, style]);

  // Atualizar opções e salvar automaticamente
  const updateOptions = useCallback((newOptions: VisualizationOptions) => {
    setOptions(newOptions);
    // Salvar automaticamente após pequeno delay
    setTimeout(() => {
      setGeometryStates(prev => ({
        ...prev,
        [currentGeometry]: {
          options: newOptions,
          style: style
        }
      }));
    }, 100);
  }, [currentGeometry, style]);

  // Atualizar estilo e salvar automaticamente
  const updateStyle = useCallback((newStyle: StyleOptions) => {
    setStyle(newStyle);
    // Salvar automaticamente após pequeno delay
    setTimeout(() => {
      setGeometryStates(prev => ({
        ...prev,
        [currentGeometry]: {
          options: options,
          style: newStyle
        }
      }));
    }, 100);
  }, [currentGeometry, options]);

  return {
    options,
    style,
    currentGeometry,
    updateOptions,
    updateStyle,
    loadGeometryState,
    saveCurrentState
  };
}