import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GeometryParams, VisualizationOptions, StyleOptions, GeometryType } from '@/types/geometry';
import { GeometryCalculator } from '@/lib/geometry-calculations';
import { useGeometryState } from '@/hooks/useGeometryState';
import GeometryCanvas from './GeometryCanvas';
import ControlPanel from './ControlPanel';
import { FabricDrawingCanvas, FabricDrawingCanvasRef } from './FabricDrawingCanvas';
import { FrozenCanvas } from './FrozenCanvas';
import { Button } from '@/components/ui/button';
import { Camera, Unlock, Download, Undo2, Redo2 } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from './ThemeToggle';
import EquationRenderer from './EquationRenderer';
import ImageDownloadMenu from './ImageDownloadMenu';
import { ConstructionType } from './geometry/GeometricConstructions';
import { ActiveToolProvider, useActiveTool } from '@/context/ActiveToolContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import ToolBar from '@/components/ui/ToolBar';
import StatusBar from '@/components/ui/StatusBar';
import { LanguageToggle } from './LanguageToggle';
import DrawingOverlayWrapper from './DrawingOverlayWrapper';
import { DrawingStroke } from './DrawingTablet';
import TopToolbar from './TopToolbar';

// Componente interno que usa o contexto de ferramenta ativa
function SpaceSculptorContent() {
  const { activeTool, setActiveTool } = useActiveTool();
  const { t } = useLanguage();
  const geometryCanvasRef = useRef<HTMLDivElement>(null);
  const drawingOverlayRef = useRef<FabricDrawingCanvasRef>(null);
  const [frozenImage, setFrozenImage] = useState<string | null>(null);
  const [hasAnnotations, setHasAnnotations] = useState(false);
  
  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'select' | 'pen' | 'eraser' | 'text'>('select');
  const [drawingStrokeColor, setDrawingStrokeColor] = useState('#ff0000');
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(4);
  const [drawingOpacity, setDrawingOpacity] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  // Sistema de histórico para o sólido 3D (5 operações)
  const [geometryHistory, setGeometryHistory] = useState<GeometryParams[]>([]);
  const [geometryHistoryIndex, setGeometryHistoryIndex] = useState(-1);
  const [canUndoGeometry, setCanUndoGeometry] = useState(false);
  const [canRedoGeometry, setCanRedoGeometry] = useState(false);

  const [options, setOptions] = useState<VisualizationOptions>({
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
    // Formas inscritas e circunscritas
    showInscribedSphere: false,
    showCircumscribedSphere: false,
    showInscribedCube: false,
    showCircumscribedCube: false,
    showInscribedCone: false,
    showCircumscribedCone: false,
    showInscribedCylinder: false,
    showCircumscribedCylinder: false,
    showInscribedOctahedron: false,
    // Controles individuais para formas inscritas
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
    // Controles individuais para formas circunscritas
    circumscribedSphereShowEdges: false,
    circumscribedSphereShowFaces: true,
    circumscribedCubeShowEdges: true,
    circumscribedCubeShowFaces: true,
    circumscribedConeShowEdges: true,
    circumscribedConeShowFaces: true,
    circumscribedCylinderShowEdges: true,
    circumscribedCylinderShowFaces: true,
    // Formas equiláteras
    isEquilateral: false,
    // Esferas com ângulo personalizado
    sphereSegmentAngle: 90,
    showSphericalSegment: false,
    showSphericalSector: false,
    // Conectores de vértices
    showVertexConnector: false,
    // Seleção de vértices para seção meridiana em prismas
    showVertexSelection: false,
    // Diagonal do cubo
    showCubeDiagonal: false,
    // Altura da seção transversal
    crossSectionHeight: 0.5,
    // Altura da seção meridiana
    meridianSectionHeight: 1.0,
    // Número de segmentos das esferas
    sphereWidthSegments: 64,
    sphereHeightSegments: 32,
    // Planificação das figuras
    showUnfolded: false,
    // Definição de planos por 3 pontos
    showPlaneDefinition: false,
    // Construções geométricas
    showGeometricConstructions: true
  });

  const [style, setStyle] = useState<StyleOptions>({
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
    // Cores individuais para formas inscritas
    inscribedSphereColor: '#00ff88',
    inscribedCubeColor: '#ffaa00',
    inscribedConeColor: '#aa00ff',
    inscribedCylinderColor: '#ff6600',
    inscribedOctahedronColor: '#ff0088',
    // Cores individuais para formas circunscritas
    circumscribedSphereColor: '#00aaff',
    circumscribedCubeColor: '#ffaa00',
    circumscribedConeColor: '#aa00ff',
    circumscribedCylinderColor: '#ff6600',
    // Opacidades individuais para formas inscritas
    inscribedSphereOpacity: 0.3,
    inscribedCubeOpacity: 0.3,
    inscribedConeOpacity: 0.3,
    inscribedCylinderOpacity: 0.3,
    inscribedOctahedronOpacity: 0.3,
    // Opacidades individuais para formas circunscritas
    circumscribedSphereOpacity: 0.2,
    circumscribedCubeOpacity: 0.2,
    circumscribedConeOpacity: 0.2,
    circumscribedCylinderOpacity: 0.2,
    // Conectores de vértices
    showVertexConnector: false,
    // Novas propriedades
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
    // Cores para circunferências
    inscribedCircleColor: '#ff6600',
    circumscribedCircleColor: '#ff0066',
    // Definição de planos por 3 pontos
    selectedVerticesForPlane: [],
    planeColor: '#00ff00',
    planeOpacity: 0.3,
    // Construções geométricas
    selectedVerticesForConstruction: [],
    constructionType: null,
    constructionColor: '#ff6600',
    constructions: [],
    planes: [],
    // Cores separadas para raio inscrito e circunferência inscrita
    inscribedRadiusColor: '#00ff00',
    // Espessuras para diferentes elementos
    heightThickness: 1.0,
    baseRadiusThickness: 1.0,
    inscribedRadiusThickness: 1.0,
    circumscribedRadiusThickness: 1.0,
    inscribedCircleThickness: 1.0,
    circumscribedCircleThickness: 1.0,
    lateralApothemThickness: 1.0,
    baseApothemThickness: 1.0,
    // Cores para apótemas
    baseApothemColor: '#00ffff',
    lateralApothemColor: '#ff0000',
    // Modo ativo de seleção
    activeVertexMode: 'none' as const,
    // Conexões entre vértices
    connections: [],
    // Espessura dos segmentos
    segmentThickness: 1.0,
    // Espessura das arestas
    edgeThickness: 1,
    // Cor dos segmentos
    segmentColor: '#00ff00',
    // Ferramenta ativa (integrada com options.activeTool)
    activeTool: 'none'
  });
  
  // Remove unused equations state since we're now using Fabric.js
  // const [equations, setEquations] = useState<Equation[]>([]);

  // Remove unused equation handlers
  // const handleRemoveEquation = useCallback((id: string) => {
  //   setEquations(prev => prev.filter(eq => eq.id !== id));
  // }, []);

  // const handleMoveEquation = useCallback((id: string, position: { x: number; y: number }) => {
  //   setEquations(prev => prev.map(eq => 
  //     eq.id === id ? { ...eq, position } : eq
  //   ));
  // }, []);

  const [params, setParams] = useState<GeometryParams>({
    type: 'prism' as GeometryType,
    height: 4,
    radius: 2,
    sideLength: 2,
    baseEdgeLength: 2,
    numSides: 5,
    isEquilateral: false
  });

  const [drawingOptions, setDrawingOptions] = useState({
    tool: 'pen' as const,
    color: '#ff0000',
    strokeWidth: 4,
    opacity: 1
  });

  // Função para salvar estado na história da geometria
  const saveGeometryState = useCallback((newParams: GeometryParams) => {
    setGeometryHistory(prev => {
      const newHistory = prev.slice(0, geometryHistoryIndex + 1);
      newHistory.push(newParams);
      // Manter apenas as últimas 5 operações
      if (newHistory.length > 5) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setGeometryHistoryIndex(prev => {
      const newIndex = Math.min(prev + 1, 4);
      setCanUndoGeometry(newIndex > 0);
      setCanRedoGeometry(false);
      return newIndex;
    });
  }, [geometryHistoryIndex]);

  // Função para atualizar params com histórico
  const updateParams = useCallback((newParams: GeometryParams) => {
    // Se o tipo mudou, resetar completamente as opções/estilo para começar zerado
    if (newParams.type !== params.type) {
      setOptions((prev) => ({
        ...prev,
        // Básico visível - vértices sempre habilitados por padrão
        showEdges: true,
        showVertices: true, // Sempre habilitar vértices por padrão em todos os sólidos
        fillFaces: true,
        // Tudo o resto desativado
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
        // Formas inscritas/circunscritas
        showInscribedSphere: false,
        showCircumscribedSphere: false,
        showInscribedCube: false,
        showCircumscribedCube: false,
        showInscribedCone: false,
        showCircumscribedCone: false,
        showInscribedCylinder: false,
        showCircumscribedCylinder: false,
        showInscribedOctahedron: false,
        // Esferas parciais
        showSphericalSegment: false,
        showSphericalSector: false,
        // Seleções e conectores
        showVertexConnector: false,
        showVertexSelection: false,
        // Outros
        showCubeDiagonal: false,
        showUnfolded: false,
        showPlaneDefinition: false,
        showGeometricConstructions: false,
      }));

      setStyle((prev) => ({
        ...prev,
        // Garantir independência entre sólidos limpando seleções e construções
        showVertexConnector: false,
        selectedVerticesForMeridian: [],
        selectedVerticesForGeneral: [],
        intersectionPositions: [],
        selectedVerticesForPlane: [],
        planes: [],
        selectedVerticesForConstruction: [],
        constructionType: null,
        constructions: [],
        connections: [], // Limpar conexões ao mudar de sólido
      }));
    }

    setParams(newParams);
    saveGeometryState(newParams);
  }, [saveGeometryState, params.type]);

  // Undo geometry
  const handleUndoGeometry = useCallback(() => {
    if (geometryHistoryIndex > 0) {
      const prevIndex = geometryHistoryIndex - 1;
      const prevState = geometryHistory[prevIndex];
      setParams(prevState);
      setGeometryHistoryIndex(prevIndex);
      setCanUndoGeometry(prevIndex > 0);
      setCanRedoGeometry(true);
      toast.success('Geometria desfeita');
    }
  }, [geometryHistory, geometryHistoryIndex]);

  // Redo geometry
  const handleRedoGeometry = useCallback(() => {
    if (geometryHistoryIndex < geometryHistory.length - 1) {
      const nextIndex = geometryHistoryIndex + 1;
      const nextState = geometryHistory[nextIndex];
      setParams(nextState);
      setGeometryHistoryIndex(nextIndex);
      setCanUndoGeometry(true);
      setCanRedoGeometry(nextIndex < geometryHistory.length - 1);
      toast.success('Geometria refeita');
    }
  }, [geometryHistory, geometryHistoryIndex]);

  // Inicializar histórico com estado inicial
  useEffect(() => {
    // Resetar histórico ao mudar de sólido para desfazer apenas ações do sólido atual
    setGeometryHistory([params]);
    setGeometryHistoryIndex(0);
    setCanUndoGeometry(false);
    setCanRedoGeometry(false);
  }, [params.type]); // Apenas quando o tipo muda

  const properties = useMemo(() => GeometryCalculator.calculateProperties(params), [params]);

  const handleResetView = useCallback(() => {
    toast.success('Vista resetada');
  }, []);

  const handleExportImage = useCallback((format: 'png' | 'jpg' = 'png', quality: 'hd' | 'medium' | 'low' = 'hd') => {
    if (geometryCanvasRef.current) {
      const canvas = geometryCanvasRef.current.querySelector('canvas');
      if (canvas) {
        const qualityMap = { hd: 1.0, medium: 0.8, low: 0.6 };
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const extension = format;
        const qualityValue = qualityMap[quality];
        
        // Para PNG, a qualidade sempre é 1.0 (lossless)
        const finalQuality = format === 'png' ? 1.0 : qualityValue;
        
        const dataURL = canvas.toDataURL(mimeType, finalQuality);
        const link = document.createElement('a');
        const qualityLabel = quality === 'hd' ? 'HD' : quality === 'medium' ? 'media' : 'baixa';
        link.download = `geometria-${params.type}-${qualityLabel}-${Date.now()}.${extension}`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Imagem da geometria exportada em ${format.toUpperCase()} (${qualityLabel})!`);
      }
    }
  }, [params.type]);

  // Sincronizar options.activeTool com style.activeTool
  useEffect(() => {
    setStyle(prev => ({
      ...prev,
      activeTool: options.activeTool
    }));
  }, [options.activeTool]);

  // Sincronizar activeTool do contexto com options.activeTool
  useEffect(() => {
    setOptions(prev => ({
      ...prev,
      activeTool: activeTool
    }));
    console.log('🔄 Sincronizando activeTool do contexto:', activeTool);
  }, [activeTool]);

  const handleExportCombined = useCallback(async (format: 'png' | 'jpg' = 'png', quality: 'hd' | 'medium' | 'low' = 'hd') => {
    if (!geometryCanvasRef.current) return;
    try {
      const geometryCanvas = geometryCanvasRef.current.querySelector('canvas');
      if (!geometryCanvas) return;

      // Canvas temporário para compor imagem final
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;

      tempCanvas.width = geometryCanvas.width;
      tempCanvas.height = geometryCanvas.height;

      // Desenhar a geometria 3D
      ctx.drawImage(geometryCanvas, 0, 0);

      // Desenhar anotações (se existirem)
      const overlayURL = drawingOverlayRef.current?.save?.();
      if (overlayURL) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            resolve();
          };
          img.src = overlayURL;
        });
      }

      const qualityMap = { hd: 1.0, medium: 0.8, low: 0.6 };
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const extension = format;
      const qualityValue = qualityMap[quality];
      
      // Para PNG, a qualidade sempre é 1.0 (lossless)
      const finalQuality = format === 'png' ? 1.0 : qualityValue;
      
      const dataURL = tempCanvas.toDataURL(mimeType, finalQuality);
      const link = document.createElement('a');
      const qualityLabel = quality === 'hd' ? 'HD' : quality === 'medium' ? 'media' : 'baixa';
      link.download = `geometria-completa-${params.type}-${qualityLabel}-${Date.now()}.${extension}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Imagem completa exportada em ${format.toUpperCase()} (${qualityLabel})!`);
    } catch (error) {
      toast.error('Erro ao exportar imagem combinada');
    }
  }, [params.type]);

  const handleFreezeView = useCallback(() => {
    if (geometryCanvasRef.current) {
      const canvas = geometryCanvasRef.current.querySelector('canvas');
      if (canvas) {
        const dataURL = canvas.toDataURL('image/png');
        setFrozenImage(dataURL);
        setOptions(prev => ({ ...prev, isFrozen: true }));
        toast.success('Vista congelada - você pode agora desenhar sobre a imagem');
      }
    }
  }, []);

  const handleUnfreezeView = useCallback(() => {
    if (hasAnnotations) {
      toast.success('Anotações mantidas - retornando à visualização 3D');
    }
    setOptions(prev => ({ ...prev, isFrozen: false }));
  }, [hasAnnotations]);

  const handleHistoryChange = useCallback((canUndo: boolean, canRedo: boolean) => {
    setCanUndo(canUndo);
    setCanRedo(canRedo);
  }, []);

  // Drawing handlers
  const handleToggleDrawing = useCallback(() => {
    setIsDrawingMode(prev => !prev);
    if (!isDrawingMode) {
      toast.success('Modo de desenho ativado - clique e arraste para desenhar');
    } else {
      toast.success('Modo de desenho desativado');
    }
  }, [isDrawingMode]);

  const handleUndo = useCallback(() => {
    if (drawingOverlayRef.current?.undo) {
      drawingOverlayRef.current.undo();
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (drawingOverlayRef.current?.redo) {
      drawingOverlayRef.current.redo();
    }
  }, []);

  const handleClear = useCallback(() => {
    if (drawingOverlayRef.current?.clear) {
      drawingOverlayRef.current.clear();
    }
  }, []);

  const handleSave = useCallback(() => {
    if (drawingOverlayRef.current?.exportImage) {
      drawingOverlayRef.current.exportImage();
    }
  }, []);

  // Sistema de seleção de elementos para deletar
  const [selectedElements, setSelectedElements] = useState<{type: 'plane' | 'construction', id: string}[]>([]);
  
  // Estado da mesa digitalizadora
  const [isTabletActive, setIsTabletActive] = useState(false);
  const [drawingStrokes, setDrawingStrokes] = useState<DrawingStroke[]>([]);
  
  // Configurações atuais da mesa digitalizadora
  const [tabletStyle, setTabletStyle] = useState({
    color: '#ffffff',
    thickness: 3, // Espessura mais realista como Samsung Tab S6 Lite
    opacity: 1,
    pressure: false, // Desativar variação de pressão
    smoothing: 0.5
  });
  const [tabletTool, setTabletTool] = useState({
    type: 'pen' as const,
    name: 'Caneta',
    icon: null
  });

  // Estado independente para ferramentas de texto
  const [textSettings, setTextSettings] = useState({
    active: false,
    color: '#ffffff', // Branco padrão
    size: 40, // 40px padrão
    fontFamily: 'Virgil'
  });

  // Funções para gerenciar configurações de texto
  const handleTextChange = useCallback((key: string, value: any) => {
    setTextSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleTextToolToggle = useCallback(() => {
    const newActive = !textSettings.active;
    console.log('🎯 handleTextToolToggle chamado - newActive:', newActive);
    console.log('🎯 textSettings atual:', textSettings);
    console.log('🎯 activeTool atual:', activeTool);
    
    setTextSettings(prev => ({
      ...prev,
      active: newActive
    }));
    
    // Se ativando texto, desativar mesa digitalizadora e definir activeTool
    if (newActive) {
      setIsTabletActive(false);
      setActiveTool('independent-text');
      console.log('🎯 Ativando ferramenta de texto independente - activeTool definido como independent-text');
      console.log('🎯 activeTool após setActiveTool:', activeTool);
    } else {
      setActiveTool('none');
      console.log('🎯 Desativando ferramenta de texto independente - activeTool definido como none');
    }
  }, [textSettings.active, setActiveTool, activeTool]);

  // Função para deletar elemento selecionado
  const handleDeleteSelected = useCallback(() => {
    selectedElements.forEach(element => {
      if (element.type === 'plane') {
        setStyle(prevStyle => ({
          ...prevStyle,
          planes: prevStyle.planes.filter(p => p.id !== element.id)
        }));
      } else if (element.type === 'construction') {
        setStyle(prevStyle => ({
          ...prevStyle,
          constructions: prevStyle.constructions.filter(c => c.id !== element.id)
        }));
      }
    });
    setSelectedElements([]);
    toast.success('Elementos deletados');
  }, [selectedElements]);

  // Handlers para mesa digitalizadora
  const handleTabletStyleChange = useCallback((key: string, value: any) => {
    setTabletStyle(prev => ({ ...prev, [key]: value }));
    console.log('🎨 Mesa digitalizadora - estilo alterado:', key, value);
  }, []);

  const handleTabletToolChange = useCallback((newTool: any) => {
    setTabletTool(prev => ({ ...prev, ...newTool }));
    console.log('🖊️ Mesa digitalizadora - ferramenta alterada:', newTool);
    console.log('🖊️ isTabletActive:', isTabletActive);
    console.log('🖊️ newTool.type:', newTool.type);
    
    // Sincronizar com o contexto ActiveTool quando a mesa digitalizadora estiver ativa
    if (isTabletActive && newTool.type) {
      console.log('🖊️ Atualizando activeTool para:', newTool.type);
      setActiveTool(newTool.type as any);
    }
  }, [isTabletActive, setActiveTool]);

  // Sincronizar activeTool quando mesa digitalizadora for ativada
  useEffect(() => {
    if (isTabletActive) {
      setActiveTool(tabletTool.type as any);
    } else {
      setActiveTool('none');
    }
  }, [isTabletActive, tabletTool.type, setActiveTool]);

  // Event listener para a tecla Delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' && selectedElements.length > 0) {
        handleDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements, handleDeleteSelected]);

  // Equation handlers
  const handleEquationAdd = useCallback((latex: string, rendered: string) => {
    if (drawingOverlayRef.current?.addEquation) {
      drawingOverlayRef.current.addEquation(latex, rendered);
    }
  }, []);

  // Construções geométricas handlers
  const handleToggleConstructions = useCallback(() => {
    setOptions(prev => ({ 
      ...prev, 
      showGeometricConstructions: !prev.showGeometricConstructions 
    }));
    
    if (!options.showGeometricConstructions) {
      toast.success('Construções geométricas ativadas - clique nos vértices da figura');
    } else {
      toast.success('Construções geométricas desativadas');
      // Limpar seleção ao desativar
      setStyle(prev => ({
        ...prev,
        selectedVerticesForConstruction: [],
        constructionType: null
      }));
    }
  }, [options.showGeometricConstructions]);

  const handleConstructionSelect = useCallback((construction: ConstructionType) => {
    setStyle(prev => ({
      ...prev,
      constructionType: construction,
      selectedVerticesForConstruction: [] // Reset seleção ao trocar tipo
    }));
    
    if (construction) {
      const constructionNames = {
        'reta-perpendicular': 'Reta Perpendicular',
        'reta-paralela': 'Reta Paralela',
        'mediatriz': 'Mediatriz',
        'bissetriz': 'Bissetriz',
        'reta-tangente': 'Reta Tangente',
        'ponto-medio': 'Ponto Médio',
        'segmento-reta': 'Segmento de Reta'
      };
      toast.success(`${constructionNames[construction]} selecionada - clique nos vértices`);
    }
  }, []);

  const handleClearConstructionSelection = useCallback(() => {
    setStyle(prev => ({
      ...prev,
      selectedVerticesForConstruction: []
    }));
    toast.success('Seleção de vértices limpa');
  }, []);

  // Handler melhorado para construções - não interfere com planos
  const handleConstructionVertexSelect = useCallback((vertexIndex: number) => {
    if (!options.showGeometricConstructions || !style.constructionType) return;
    
    const current = style.selectedVerticesForConstruction;
    const requiredPoints = {
      'mediatriz': 2,
      'ponto-medio': 2,
      'segmento-reta': 2,
      'reta-perpendicular': 3,
      'reta-paralela': 3,
      'bissetriz': 3,
      'reta-tangente': 2
    }[style.constructionType] || 2;

    if (current.includes(vertexIndex)) {
      // Remove vertex if already selected
      setStyle(prev => ({
        ...prev,
        selectedVerticesForConstruction: current.filter(i => i !== vertexIndex)
      }));
      return;
    }

    const newSelection = [...current, vertexIndex];

    if (newSelection.length === requiredPoints) {
      // Criar nova construção quando temos pontos suficientes
      const newConstruction = {
        id: `construction-${Date.now()}`,
        type: style.constructionType!,
        vertices: newSelection,
        color: style.constructionColor
      };
      
      setStyle(prev => ({
        ...prev,
        constructions: [...prev.constructions, newConstruction],
        selectedVerticesForConstruction: [] // Limpar seleção para nova construção
      }));
      
      toast.success(`Nova construção "${style.constructionType}" adicionada!`);
    } else {
      // Continuar selecionando vértices
      setStyle(prev => ({
        ...prev,
        selectedVerticesForConstruction: newSelection
      }));
    }
  }, [options.showGeometricConstructions, style.constructionType, style.selectedVerticesForConstruction, style.constructionColor]);

  // Handler para planos - preserva planos existentes sempre
  const handlePlaneVertexSelect = useCallback((vertexIndex: number) => {
    
    const current = style.selectedVerticesForPlane || [];
    
    if (current.includes(vertexIndex)) {
      // Remove vertex if already selected
      setStyle(prev => ({
        ...prev,
        selectedVerticesForPlane: current.filter(i => i !== vertexIndex)
      }));
      return;
    }

    // Verificar se já atingiu o limite de planos apenas ao tentar criar
    // Permitir seleção de vértices sempre

    const newSelection = [...current, vertexIndex];
    
    // Adicionar à seleção atual
    setStyle(prev => ({
      ...prev,
      selectedVerticesForPlane: newSelection
    }));
    
    console.log('=== PLANE VERTEX SELECT ===');
    console.log('Vértice selecionado:', vertexIndex);
    console.log('Seleção atual:', newSelection);
    console.log('Planos existentes:', style.planes.length);
  }, [style.selectedVerticesForPlane, style.planes.length]);

  // Handler para limpar construções
  const handleClearConstructions = useCallback(() => {
    setStyle(prev => ({
      ...prev,
      constructions: [],
      selectedVerticesForConstruction: []
    }));
    toast.success('Todas as construções removidas');
  }, []);

  // Handler para limpar planos
  const handleClearPlanes = useCallback(() => {
    setStyle(prev => ({
      ...prev,
      planes: [],
      selectedVerticesForPlane: []
    }));
    toast.success('Todos os planos removidos');
  }, []);

  // Funções para ativar modos de seleção
  const activateMeridianMode = useCallback(() => {
    setStyle(prev => ({
      ...prev,
      activeVertexMode: 'meridian'
    }));
    toast.info('🔶 Modo Seção Meridiana ativado');
  }, []);

  const activatePlaneMode = useCallback(() => {
    setStyle(prev => ({
      ...prev,
      activeVertexMode: 'plane'
    }));
    toast.info('📐 Modo Definição de Planos ativado');
  }, []);

  const activateConnectionMode = useCallback(() => {
    setStyle(prev => ({
      ...prev,
      activeVertexMode: 'connection'
    }));
    toast.info('🔗 Modo Conexão de Vértices ativado');
  }, []);

  const activateConstructionMode = useCallback(() => {
    setStyle(prev => ({
      ...prev,
      activeVertexMode: 'construction'
    }));
    toast.info('📏 Modo Construções Geométricas ativado');
  }, []);

  const deactivateAllModes = useCallback(() => {
    setStyle(prev => ({
      ...prev,
      activeVertexMode: 'none'
    }));
    toast.info('🔘 Todos os modos desativados');
  }, []);

  const handleRemoveEquation = useCallback((id: string) => {
    // This is now handled by Fabric.js directly through selection and delete
  }, []);

  const handleMoveEquation = useCallback((id: string, position: { x: number; y: number }) => {
    // This is now handled by Fabric.js directly through drag and drop
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Z - Undo (Geometria quando não está no modo desenho)
      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (isDrawingMode) {
          handleUndo();
        } else if (canUndoGeometry) {
          handleUndoGeometry();
        }
      }
      // Ctrl+Y or Ctrl+Shift+Z - Redo (Geometria quando não está no modo desenho)
      if ((event.ctrlKey && event.key === 'y') || (event.ctrlKey && event.shiftKey && event.key === 'z')) {
        event.preventDefault();
        if (isDrawingMode) {
          handleRedo();
        } else if (canRedoGeometry) {
          handleRedoGeometry();
        }
      }
      // Escape - Exit drawing mode
      if (event.key === 'Escape' && isDrawingMode) {
        event.preventDefault();
        setIsDrawingMode(false);
        toast.success('Modo de desenho desativado (ESC)');
      }
      // Ctrl+E - Toggle drawing mode
      if (event.ctrlKey && event.key === 'e') {
        event.preventDefault();
        handleToggleDrawing();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingMode, handleUndo, handleRedo, handleToggleDrawing, canUndoGeometry, canRedoGeometry, handleUndoGeometry, handleRedoGeometry]);

  return (
    <div className="h-screen bg-gradient-nebula text-foreground flex flex-col">
      {/* Header com controles no lado direito */}
      <header className="border-b border-border/30 bg-background/95 backdrop-blur flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
            GeoTeach
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visualizador Interativo de Geometria Espacial
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ImageDownloadMenu 
            onExport={handleExportImage}
          />
          <Button
            variant={options.isFrozen ? "default" : "outline"} 
            size="sm" 
            onClick={options.isFrozen ? handleUnfreezeView : handleFreezeView}
          >
            {options.isFrozen ? (
              <>
                <Unlock className="w-4 h-4 mr-2" />
{t('button.unfreeze_view')}
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
{t('button.freeze_view')}
              </>
            )}
          </Button>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Top Toolbar */}
      <TopToolbar 
        options={options}
        onOptionsChange={setOptions}
      />
      
      <div className="flex flex-1 min-h-0">
        <aside className="w-80 border-r border-border/30 bg-background/50 backdrop-blur flex-shrink-0 h-full overflow-y-auto">
          <ControlPanel
            params={params}
            options={options}
            style={style}
            properties={properties}
            onParamsChange={updateParams}
            onOptionsChange={setOptions}
            onStyleChange={setStyle}
            onResetView={handleResetView}
            onExportImage={handleExportImage}
            onVertexSelect={(vertexIndex) => {
              // Esta função agora é apenas para compatibilidade
              // A seleção real é feita pelos handlers específicos em GeometryCanvas
              console.log('Vertex selected (legacy handler):', vertexIndex);
            }}
            // Estado da mesa digitalizadora
            isTabletActive={isTabletActive}
            onTabletToggle={setIsTabletActive}
            drawingStrokes={drawingStrokes}
            onDrawingChange={setDrawingStrokes}
            // Configurações da mesa digitalizadora
            tabletStyle={tabletStyle}
            tabletTool={tabletTool}
            onTabletStyleChange={handleTabletStyleChange}
            onTabletToolChange={handleTabletToolChange}
          />
        </aside>
      
        <section className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Barra de Ferramentas Principal - Estrutura Reorganizada */}
          <div className="border-b border-border/30 bg-background/50 backdrop-blur">
            <div className="flex items-center gap-6 p-4 bg-background/95 backdrop-blur-xl border-b">
              

              {/* 2. Ferramenta de Texto (SEMPRE VISÍVEL) */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTextToolToggle}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all h-10 ${
                    textSettings.active
                      ? 'bg-green-500 text-white shadow-lg' 
                      : 'bg-white/5 text-white/70 border border-white/20'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 7.82L12 12l5 4.18M12 12H3m4 0V5" />
                    <rect x="12" y="5" width="9" height="14" rx="2" />
                  </svg>
                  <span className="text-sm">Texto</span>
                </button>

                {/* Controles visíveis apenas quando texto está ativo */}
                {textSettings.active && (
                  <>
                    {/* Botão de Seleção de Texto */}
                    <button
                      onClick={() => {
                        if (activeTool === 'text-select') {
                          setActiveTool('none'); // Desativar seleção
                        } else {
                          setActiveTool('text-select'); // Ativar seleção
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all h-10 ${
                        activeTool === 'text-select'
                          ? 'bg-blue-500 text-white shadow-lg' 
                          : 'bg-white/5 text-white/70 border border-white/20'
                      }`}
                      title={activeTool === 'text-select' ? 'Desativar seleção' : 'Selecionar texto existente'}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3h18v18H3z"/>
                        <path d="M8 8h8M8 12h8M8 16h8"/>
                      </svg>
                      <span className="text-sm">Selecionar</span>
                    </button>

                    {/* Seletor de Cor */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/60">Cor:</span>
                      <div className="flex gap-1">
                        {['#000000', '#ffffff', '#ff0000', '#0000ff', '#00ff00', '#ffff00'].map(color => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              textSettings.color === color 
                                ? 'border-white ring-2 ring-white/50 scale-110' 
                                : 'border-gray-600 hover:scale-110'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleTextChange('color', color)}
                            title={`Cor ${color}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Controle de Tamanho do Texto */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5">
                      <span className="text-xs text-white/60">Tamanho:</span>
                      <input
                        type="range"
                        min="20"
                        max="50"
                        step="2"
                        value={textSettings.size}
                        onChange={(e) => handleTextChange('size', Number(e.target.value))}
                        className="w-24 h-1"
                      />
                      <span className="text-xs text-white/80 w-10">{textSettings.size}pt</span>
                    </div>
                  </>
                )}
              </div>

              {/* Separador */}
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-border/50 to-transparent"></div>

              {/* 3. Mesa Digitalizadora (Toggle) */}
              <div className="flex flex-col gap-3">
                <ToolBar 
                  isTabletActive={isTabletActive}
                  onTabletToggle={setIsTabletActive}
                  tabletStyle={tabletStyle}
                  tabletTool={tabletTool}
                  onTabletStyleChange={handleTabletStyleChange}
                  onTabletToolChange={handleTabletToolChange}
                  onTabletUndo={() => {
                    console.log('Undo mesa digitalizadora');
                  }}
                  onTabletRedo={() => {
                    console.log('Redo mesa digitalizadora');
                  }}
                  onTabletClear={() => {
                    setDrawingStrokes([]);
                    console.log('Limpar mesa digitalizadora');
                  }}
                  canTabletUndo={drawingStrokes.length > 0}
                  canTabletRedo={false}
                />
              </div>

              {/* Separador */}
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-border/50 to-transparent"></div>

              {/* 4. Seções de Visualização */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOptions({...options, showCrossSection: !options.showCrossSection})}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    options.showCrossSection 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path d="M2 12s3-9 10-9 10 9 10 9-3 9-10 9-10-9-10-9z" />
                  </svg>
                  <span>Seção Transversal</span>
                </button>
                
                <button
                  onClick={() => setOptions({...options, showMeridianSection: !options.showMeridianSection})}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    options.showMeridianSection 
                      ? 'bg-cyan-500 text-white' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <span>Seção Meridiana</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Undo/Redo para Geometria */}
          <div className="border-b border-border/30 bg-background/50 backdrop-blur px-4 py-2 flex items-center justify-end">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndoGeometry}
                disabled={!canUndoGeometry}
                title="Desfazer alteração da geometria (Ctrl+Z)"
                className="hover:bg-accent/10"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedoGeometry}
                disabled={!canRedoGeometry}
                title="Refazer alteração da geometria (Ctrl+Y)"
                className="hover:bg-accent/10"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Conteúdo da Geometria */}
          <div className="flex-1 m-0 p-0 h-full">

              <div className="w-full h-full min-h-[calc(100vh-240px)] relative">
                {options.isFrozen && frozenImage ? (
                  <FrozenCanvas
                    frozenImage={frozenImage}
                    onUnfreeze={handleUnfreezeView}
                    onAnnotationChange={setHasAnnotations}
                  />
                ) : (
                  <DrawingOverlayWrapper
                    isTabletActive={isTabletActive}
                    drawingStrokes={drawingStrokes}
                    onDrawingChange={setDrawingStrokes}
                    currentStyle={textSettings.active ? {
                      color: textSettings.color,
                      thickness: textSettings.size / 4, // Converter px para thickness
                      opacity: 1,
                      pressure: false,
                      smoothing: 0.5
                    } : tabletStyle}
                    currentTool={tabletTool}
                    activeTool={activeTool}
                    textSettings={textSettings}
                    onTextChange={handleTextChange}
                    className="w-full h-full"
                  >
                    <div ref={geometryCanvasRef} className="w-full h-full relative flex-1 min-h-0">
                       <GeometryCanvas
                         params={params}
                         options={options}
                         style={style}
                           onVertexSelect={(vertexIndex) => {
                    // Sistema de seleção baseado em modo ativo - cada funcionalidade opera independentemente
                    
                    switch (style.activeVertexMode) {
                      case 'construction':
                        if (style.constructionType) {
                          handleConstructionVertexSelect(vertexIndex);
                        }
                        break;
                        
                      case 'plane':
                        handlePlaneVertexSelect(vertexIndex);
                        break;
                        
                      case 'meridian':
                        if ((params.type === 'prism' || params.type === 'cube' || params.type === 'tetrahedron' || params.type === 'pyramid' || params.type === 'cylinder' || params.type === 'cone')) {
                          const current = style.selectedVerticesForMeridian || [];
                          if (current.length < 2) {
                            setStyle(prev => ({
                              ...prev,
                              selectedVerticesForMeridian: [...current, vertexIndex]
                            }));
                            toast.success(`🔶 Vértice ${vertexIndex} selecionado para seção meridiana (${current.length + 1}/2)`);
                          } else {
                            setStyle(prev => ({
                              ...prev,
                              selectedVerticesForMeridian: [vertexIndex]
                            }));
                            toast.success(`🔶 Nova seleção iniciada - Vértice ${vertexIndex} selecionado (1/2)`);
                          }
                        }
                        break;
                        
                      case 'connection':
                        if (['cube', 'prism', 'pyramid', 'tetrahedron', 'octahedron', 'dodecahedron', 'icosahedron', 'cylinder', 'cone'].includes(params.type)) {
                          const current = style.selectedVerticesForGeneral || [];
                          setStyle(prev => ({
                            ...prev,
                            selectedVerticesForGeneral: [...current, vertexIndex]
                          }));
                          toast.success(`🔸 Vértice ${vertexIndex} conectado (total: ${current.length + 1})`);
                        }
                        break;
                        
                      case 'none':
                      default:
                        toast.info('Selecione um modo de trabalho primeiro');
                        break;
                    }
                  }}
                         onStyleChange={(key, value) => {
                           setStyle(prev => ({ ...prev, [key]: value }));
                         }}
                       />
                      {/* Drawing Overlay with Fabric.js */}
                      <FabricDrawingCanvas
                        ref={drawingOverlayRef}
                        isEnabled={isDrawingMode}
                        tool={drawingTool}
                        strokeColor={drawingStrokeColor}
                        strokeWidth={drawingStrokeWidth}
                        opacity={drawingOpacity}
                        onHistoryChange={handleHistoryChange}
                      />
                    </div>
                  </DrawingOverlayWrapper>
                )}
              </div>
          </div>
        </section>
        </div>
      
      {/* StatusBar */}
      <StatusBar 
        showCrossSection={options.showCrossSection}
        showMeridianSection={options.showMeridianSection}
      />
    </div>
  );
}

// Componente principal que fornece o contexto
export default function SpaceSculptor() {
  return (
    <LanguageProvider>
      <ActiveToolProvider>
        <SpaceSculptorContent />
      </ActiveToolProvider>
    </LanguageProvider>
  );
}