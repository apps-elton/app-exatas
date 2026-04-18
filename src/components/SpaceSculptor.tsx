import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GeometryParams, VisualizationOptions, StyleOptions, GeometryType } from '@/types/geometry';
import { GeometryCalculator } from '@/lib/geometry-calculations';
import { useHistory } from '@/hooks/useHistory';
import GeometryCanvas from './GeometryCanvas';
import { FabricDrawingCanvas, FabricDrawingCanvasRef } from './FabricDrawingCanvas';
import { FrozenCanvas } from './FrozenCanvas';
import { toast } from 'sonner';
import { ConstructionType } from './geometry/GeometricConstructions';
import { ActiveToolProvider, useActiveTool } from '@/context/ActiveToolContext';
import { useTranslation } from 'react-i18next';
import DrawingOverlayWrapper from './DrawingOverlayWrapper';
import DrawingTablet from './DrawingTablet';
import { IconSidebar, PanelId } from './IconSidebar';
import { FloatingPanel } from './FloatingPanel';
import GeometryPanel from './panels/GeometryPanel';
import VisualizationPanel from './panels/VisualizationPanel';
import StylePanel from './panels/StylePanel';
import PropertiesPanel from './panels/PropertiesPanel';
import { CompactStatusBar } from './CompactStatusBar';
import { MobileBottomBar } from './MobileBottomBar';
import { MobilePanelSheet } from './MobilePanelSheet';

// Componente interno que usa o contexto de ferramenta ativa
function SpaceSculptorContent() {
  // Teste de console no componente principal
  // console.log('🔧 TESTE CONSOLE - SpaceSculptorContent renderizado');
  const { activeTool, setActiveTool } = useActiveTool();
  const { t } = useTranslation();
  const geometryCanvasRef = useRef<HTMLDivElement>(null);
  const orbitControlsRef = useRef<any>(null);
  const drawingOverlayRef = useRef<FabricDrawingCanvasRef>(null);
  // Persist Fabric drawing strokes across re-renders / potential remounts
  // (e.g. when the 3D solid changes). Stored in a ref so updating it doesn't
  // trigger re-renders.
  const drawingCanvasJSONRef = useRef<string | null>(null);
  const handleDrawingCanvasChange = useCallback((json: string) => {
    drawingCanvasJSONRef.current = json;
  }, []);
  const [frozenImage, setFrozenImage] = useState<string | null>(null);
  const [hasAnnotations, setHasAnnotations] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelId>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePanelToggle = useCallback((panel: PanelId) => {
    setActivePanel(prev => prev === panel ? null : panel);
  }, []);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    setActivePanel(null);
  }, []);
  
  // Mesa digitalizadora state
  const [isTabletActive, setIsTabletActive] = useState(false);
  
  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'select' | 'pen' | 'eraser' | 'text'>('select');
  const [drawingStrokeColor, setDrawingStrokeColor] = useState('#ff0000');
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(4);
  const [drawingOpacity, setDrawingOpacity] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  
  
  // Geometry history state
  const [geometryHistory, setGeometryHistory] = useState<GeometryParams[]>([]);
  const [geometryHistoryIndex, setGeometryHistoryIndex] = useState(0);
  const [canUndoGeometry, setCanUndoGeometry] = useState(false);
  const [canRedoGeometry, setCanRedoGeometry] = useState(false);
  
  // Sistema de histórico para ações gerais (últimas 3)
  const {
    addToHistory,
    undo: undoAction,
    redo: redoAction,
    canUndo: canUndoAction,
    canRedo: canRedoAction,
    clearHistory
  } = useHistory(3);




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

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevenir atalhos quando estiver digitando em inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        console.log('⌨️ Atalho Ctrl+Z detectado');
        
        
        // Undo na geometria se possível
        if (canUndoGeometry) {
          handleUndoGeometry();
          toast.success('Geometria desfeita');
          return;
        }
        
        // Undo geral se disponível
        if (canUndoAction) {
          undoAction();
          toast.success('Ação desfeita');
        }
      }

      // Ctrl+Y ou Ctrl+Shift+Z - Redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        console.log('⌨️ Atalho Ctrl+Y detectado');
        
        
        // Redo na geometria se possível
        if (canRedoGeometry) {
          handleRedoGeometry();
          toast.success('Geometria refeita');
          return;
        }
        
        // Redo geral se disponível
        if (canRedoAction) {
          redoAction();
          toast.success('Ação refeita');
        }
      }

      // Delete - Remover elementos selecionados
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        console.log('⌨️ Atalho Delete detectado');
        
        
        // Limpar geometria se possível
        if (canUndoGeometry) {
          setParams({
            type: 'prism' as GeometryType,
            height: 4,
            radius: 2,
            sideLength: 2,
            baseEdgeLength: 2,
            numSides: 5,
            isEquilateral: false
          });
          toast.success('Geometria limpa');
        }
      }




      // Escape - Cancelar operações
      if (e.key === 'Escape') {
        e.preventDefault();
        console.log('⌨️ Atalho Escape detectado');
        
      }
    };

    // Adicionar listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canUndoGeometry, canRedoGeometry, canUndoAction, canRedoAction, handleUndoGeometry, handleRedoGeometry, undoAction, redoAction]);

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
    // Espessuras das bordas
    inscribedEdgeThickness: 1.0,
    circumscribedEdgeThickness: 1.0,
    // Ferramenta ativa removida - usar options.activeTool
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
  }, []);

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

    // Adicionar ao histórico antes de fazer a mudança
    addToHistory('geometry_change', params);
    setParams(newParams);
    saveGeometryState(newParams);
  }, [saveGeometryState, params.type, params, addToHistory]);

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
    try {
      if (orbitControlsRef.current && typeof orbitControlsRef.current.reset === 'function') {
        orbitControlsRef.current.reset();
        toast.success('Vista centralizada');
      } else {
        toast.error('Controles não disponíveis para resetar');
      }
    } catch (_) {
      toast.error('Não foi possível centralizar a vista');
    }
  }, []);

  // Funções de desfazer e refazer
  const handleUndo = useCallback(() => {
    if (isDrawingMode) {
      // Modo desenho - usar undo do canvas
      if (drawingOverlayRef.current?.undo) {
        drawingOverlayRef.current.undo();
      }
    } else {
      // Modo geometria - usar sistema de histórico
      const previousState = undoAction();
      if (previousState) {
        // Restaurar estado baseado no tipo de ação
        switch (previousState.action) {
          case 'geometry_change':
            setParams(previousState.data);
            toast.success('↶ Ação desfeita');
            break;
          case 'style_change':
            setStyle(previousState.data);
            toast.success('↶ Ação desfeita');
            break;
          case 'options_change':
            setOptions(previousState.data);
            toast.success('↶ Ação desfeita');
            break;
          default:
            toast.success('↶ Ação desfeita');
        }
      }
    }
  }, [undoAction, isDrawingMode]);

  const handleRedo = useCallback(() => {
    if (isDrawingMode) {
      // Modo desenho - usar redo do canvas
      if (drawingOverlayRef.current?.redo) {
        drawingOverlayRef.current.redo();
      }
    } else {
      // Modo geometria - usar sistema de histórico
      const nextState = redoAction();
      if (nextState) {
        // Restaurar estado baseado no tipo de ação
        switch (nextState.action) {
          case 'geometry_change':
            setParams(nextState.data);
            toast.success('↷ Ação refeita');
            break;
          case 'style_change':
            setStyle(nextState.data);
            toast.success('↷ Ação refeita');
            break;
          case 'options_change':
            setOptions(nextState.data);
            toast.success('↷ Ação refeita');
            break;
          default:
            toast.success('↷ Ação refeita');
        }
      }
    }
  }, [redoAction, isDrawingMode]);

  const handleExportImage = useCallback((format: 'png' | 'jpg' = 'png', quality: 'hd' | 'medium' | 'low' = 'hd') => {
    if (geometryCanvasRef.current) {
      const canvas = geometryCanvasRef.current.querySelector('canvas');
      if (canvas) {
        const qualityMap = { hd: 1.0, medium: 0.9, low: 0.8 };
        const resolutionMap = { hd: 8, medium: 4, low: 2 }; // Multiplicador de resolução ULTRA
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const extension = format;
        const qualityValue = qualityMap[quality];
        const resolutionMultiplier = resolutionMap[quality];
        
        // Criar canvas em ULTRA alta resolução
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        
        // Definir dimensões em ULTRA alta resolução
        tempCanvas.width = canvas.width * resolutionMultiplier;
        tempCanvas.height = canvas.height * resolutionMultiplier;
        
        // Configurar contexto para MÁXIMA qualidade
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        
        // Configurar contexto para anti-aliasing máximo
        tempCtx.textBaseline = 'top';
        
        // Desenhar canvas original escalado com interpolação bicúbica
        tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Para PNG, a qualidade sempre é 1.0 (lossless)
        const finalQuality = format === 'png' ? 1.0 : qualityValue;
        
        const dataURL = tempCanvas.toDataURL(mimeType, finalQuality);
        const link = document.createElement('a');
        const qualityLabel = quality === 'hd' ? 'ULTRA-HD-8K' : quality === 'medium' ? 'HD-4K' : 'HD-2K';
        const resolution = `${tempCanvas.width}x${tempCanvas.height}`;
        link.download = `geometria-${params.type}-${qualityLabel}-${resolution}-${Date.now()}.${extension}`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Imagem ULTRA-HD exportada: ${resolution} em ${format.toUpperCase()} (${qualityLabel})!`);
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

      // Desenhar anotações da mesa digitalizadora (se existirem)
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

      // Capturar elementos de texto do Fabric.js (se existirem)
      const fabricCanvases = geometryCanvasRef.current.querySelectorAll('canvas');
      fabricCanvases.forEach((fabricCanvas) => {
        if (fabricCanvas.getContext('2d')) {
          // Verificar se é um canvas do Fabric.js
          const fabricDataURL = fabricCanvas.toDataURL('image/png');
          if (fabricDataURL && fabricDataURL !== 'data:,') {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            };
            img.src = fabricDataURL;
          }
        }
      });

      // Capturar e renderizar elementos de texto do DOM
      const textElements = geometryCanvasRef.current.querySelectorAll('textarea, input[type="text"], .text-input, [contenteditable="true"], div[style*="position"], span[style*="position"]');
      console.log('🎨 Elementos de texto encontrados:', textElements.length);
      
      textElements.forEach((element: Element, index) => {
        const htmlElement = element as HTMLElement;
        console.log(`🎨 Elemento ${index}:`, htmlElement);
        console.log(`🎨 Display:`, htmlElement.style.display);
        console.log(`🎨 Offset:`, htmlElement.offsetWidth, htmlElement.offsetHeight);
        
        if (htmlElement.style.display !== 'none' && htmlElement.offsetWidth > 0 && htmlElement.offsetHeight > 0) {
          const rect = htmlElement.getBoundingClientRect();
          const containerRect = geometryCanvasRef.current!.getBoundingClientRect();
          const x = rect.left - containerRect.left;
          const y = rect.top - containerRect.top;
          
          console.log(`🎨 Posição do elemento ${index}:`, { x, y });
          
          // Obter estilos do elemento
          const computedStyle = window.getComputedStyle(htmlElement);
          const fontSize = computedStyle.fontSize || '16px';
          const fontFamily = computedStyle.fontFamily || 'Arial';
          const color = computedStyle.color || '#000000';
          const textContent = htmlElement.textContent || (htmlElement as HTMLInputElement).value || '';
          
          console.log(`🎨 Conteúdo do elemento ${index}:`, textContent);
          console.log(`🎨 Estilos do elemento ${index}:`, { fontSize, fontFamily, color });
          
          if (textContent.trim()) {
            // Configurar contexto para texto
            ctx.font = `${fontSize} ${fontFamily}`;
            ctx.fillStyle = color;
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            
            // Renderizar texto linha por linha
            const lines = textContent.split('\n');
            const lineHeight = parseInt(fontSize) * 1.2;
            
            lines.forEach((line, lineIndex) => {
              console.log(`🎨 Renderizando linha ${lineIndex} do elemento ${index}:`, line);
              ctx.fillText(line, x, y + (lineIndex * lineHeight));
            });
          }
        }
      });

      // Desenhar traços da mesa digitalizadora 3D (se existirem)
      // TODO: Implementar renderização dos traços da mesa digitalizadora
      /*
      if (false) {
        console.log('🎨 Renderizando traços da mesa digitalizadora');
        
        // Criar canvas temporário para os desenhos da mesa digitalizadora
        const drawingCanvas = document.createElement('canvas');
        const drawingCtx = drawingCanvas.getContext('2d');
        if (drawingCtx) {
          drawingCanvas.width = tempCanvas.width;
          drawingCanvas.height = tempCanvas.height;
          
          // Renderizar todos os traços da mesa digitalizadora
          // drawingStrokes.forEach((stroke, index) => {
            // ... código comentado para evitar erros de linting
          // });
          
          // Desenhar o canvas da mesa digitalizadora no canvas principal
          ctx.drawImage(drawingCanvas, 0, 0);
        }
      }
      */

      // Aplicar multiplicador de resolução ULTRA-HD
      const qualityMap = { hd: 1.0, medium: 0.9, low: 0.8 };
      const resolutionMap = { hd: 8, medium: 4, low: 2 }; // Multiplicador de resolução ULTRA
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const extension = format;
      const qualityValue = qualityMap[quality];
      const resolutionMultiplier = resolutionMap[quality];
      
      // Criar canvas em ULTRA alta resolução
      const finalCanvas = document.createElement('canvas');
      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) return;
      
      // Definir dimensões em ULTRA alta resolução
      finalCanvas.width = tempCanvas.width * resolutionMultiplier;
      finalCanvas.height = tempCanvas.height * resolutionMultiplier;
      
      // Configurar contexto para MÁXIMA qualidade
      finalCtx.imageSmoothingEnabled = true;
      finalCtx.imageSmoothingQuality = 'high';
      finalCtx.textBaseline = 'top';
      
      // Desenhar canvas temporário escalado
      finalCtx.drawImage(tempCanvas, 0, 0, finalCanvas.width, finalCanvas.height);
      
      // Para PNG, a qualidade sempre é 1.0 (lossless)
      const finalQuality = format === 'png' ? 1.0 : qualityValue;
      
      const dataURL = finalCanvas.toDataURL(mimeType, finalQuality);
      const link = document.createElement('a');
      const qualityLabel = quality === 'hd' ? 'ULTRA-HD-8K' : quality === 'medium' ? 'HD-4K' : 'HD-2K';
      const resolution = `${finalCanvas.width}x${finalCanvas.height}`;
      link.download = `geometria-completa-${params.type}-${qualityLabel}-${resolution}-${Date.now()}.${extension}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Imagem completa ULTRA-HD exportada: ${resolution} em ${format.toUpperCase()} (${qualityLabel})!`);
    } catch (error) {
      console.error('Erro ao exportar imagem combinada:', error);
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
      const constructionNames: Record<string, string> = {
        'reta-perpendicular': t('constructions.perpendicular_line'),
        'reta-paralela': t('constructions.parallel_line'),
        'mediatriz': t('constructions.perpendicular_bisector'),
        'bissetriz': t('constructions.angle_bisector'),
        'reta-tangente': t('constructions.tangent_line'),
        'ponto-medio': t('constructions.midpoint'),
        'segmento-reta': t('constructions.line_segment')
      };
      toast.success(`${constructionNames[construction]} selecionada - clique nos vértices`);
    }
  }, []);

  const handleClearConstructionSelection = useCallback(() => {
    setStyle(prev => ({
      ...prev,
      selectedVerticesForConstruction: []
    }));
    toast.success(t('message.vertex_selection_cleared'));
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
    toast.info(t('message.meridian_mode_activated'));
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
    toast.info(t('message.connection_mode_activated'));
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

  // Keyboard shortcuts for panels and fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      switch (e.key) {
        case '1': handlePanelToggle('geometry'); break;
        case '2': handlePanelToggle('visualization'); break;
        case '3': handlePanelToggle('style'); break;
        case '4': handlePanelToggle('properties'); break;
        case '5': setIsTabletActive(prev => !prev); break;
        case 'f': case 'F': if (!e.ctrlKey && !e.metaKey) handleFullscreen(); break;
        case 'Escape': if (isFullscreen) { setIsFullscreen(false); e.preventDefault(); } break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePanelToggle, handleFullscreen, isFullscreen]);

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
    <div className="h-dvh bg-gradient-nebula text-foreground flex overflow-hidden">
      {/* Icon Sidebar - hidden in fullscreen */}
      {!isFullscreen && (
        <IconSidebar
          activePanel={activePanel}
          onPanelToggle={handlePanelToggle}
          isDrawingActive={isTabletActive}
          onDrawingToggle={() => setIsTabletActive(!isTabletActive)}
          onExportImage={() => handleExportImage('png', 'hd')}
        />
      )}

      {/* Floating Panels */}
      <FloatingPanel title={t('geometry_form.title')} isOpen={!isFullscreen && activePanel === 'geometry'} onClose={() => setActivePanel(null)}>
        <GeometryPanel params={params} options={options} style={style} properties={properties}
          onParamsChange={updateParams}
          onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }}
          onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }}
        />
      </FloatingPanel>

      <FloatingPanel title={t('panel.visualization')} isOpen={!isFullscreen && activePanel === 'visualization'} onClose={() => setActivePanel(null)}>
        <VisualizationPanel params={params} options={options} style={style} properties={properties}
          onParamsChange={updateParams}
          onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }}
          onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }}
        />
      </FloatingPanel>

      <FloatingPanel title={t('panel.style')} isOpen={!isFullscreen && activePanel === 'style'} onClose={() => setActivePanel(null)}>
        <StylePanel params={params} options={options} style={style} properties={properties}
          onParamsChange={updateParams}
          onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }}
          onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }}
        />
      </FloatingPanel>

      <FloatingPanel title={t('panel.properties')} isOpen={!isFullscreen && activePanel === 'properties'} onClose={() => setActivePanel(null)}>
        <PropertiesPanel params={params} options={options} style={style} properties={properties}
          onParamsChange={updateParams}
          onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }}
          onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }}
        />
      </FloatingPanel>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="flex-1 relative" style={{ marginTop: 0, paddingTop: 0 }}>

            {/* ESTRUTURA SEMPRE VISÍVEL - AMBOS OS COMPONENTES RENDERIZADOS */}
            <div className="w-full h-full relative">

              {/* 1. SÓLIDO 3D - SEMPRE VISÍVEL (FUNDO) */}
              <div className="absolute inset-0 w-full h-full z-0 pointer-events-auto">
                <div ref={geometryCanvasRef} className="w-full h-full relative flex-1 min-h-0">
                    <GeometryCanvas
                      params={params}
                      options={options}
                      style={style}
                      onControlsRef={(ref) => { orbitControlsRef.current = ref; }}
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
                  </div>
                </div>

              {/* 2. DRAWING OVERLAY 3D - SEMPRE VISÍVEL (CAMADA INTERMEDIÁRIA) */}
              {!options.isFrozen && (
                <div className="absolute inset-0 w-full h-full z-5 pointer-events-none">
                  <DrawingOverlayWrapper
                    isTabletActive={false}
                    drawingStrokes={[]}
                    onDrawingChange={() => {}}
                    currentStyle={{
                      color: '#ffffff',
                      thickness: 2,
                      opacity: 1,
                      pressure: false,
                      smoothing: 0.5
                    }}
                    activeTool={activeTool}
                    className="w-full h-full"
                  >
                    <div className="w-full h-full relative flex-1 min-h-0">
                      {/* Drawing Overlay with Fabric.js */}
                      <FabricDrawingCanvas
                        ref={drawingOverlayRef}
                        isEnabled={isDrawingMode}
                        tool={drawingTool}
                        strokeColor={drawingStrokeColor}
                        strokeWidth={drawingStrokeWidth}
                        opacity={drawingOpacity}
                        onHistoryChange={handleHistoryChange}
                        initialCanvasJSON={drawingCanvasJSONRef.current}
                        onCanvasChange={handleDrawingCanvasChange}
                      />
                    </div>
                  </DrawingOverlayWrapper>
                </div>
              )}


              {/* 4. FROZEN CANVAS - QUANDO CONGELADO */}
              {options.isFrozen && frozenImage && (
                <div className="absolute inset-0 w-full h-full z-20 pointer-events-auto">
                  <FrozenCanvas
                    frozenImage={frozenImage}
                    onUnfreeze={handleUnfreezeView}
                    onAnnotationChange={setHasAnnotations}
                  />
                </div>
              )}

              {/* 5. MESA DIGITALIZADORA - SÓ QUANDO ATIVA */}
              {isTabletActive && (
                <div className="absolute inset-0 w-full h-full z-10 pointer-events-auto">
                  <DrawingTablet
                    isActive={isTabletActive}
                    onToggle={() => setIsTabletActive(!isTabletActive)}
                    className="w-full h-full"
                  />
                </div>
              )}

            </div>
        </div>

        {/* Fullscreen exit button */}
        {isFullscreen && (
          <button
            onClick={handleFullscreen}
            className="absolute top-4 right-4 z-50 bg-background/60 backdrop-blur border border-border/30 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background/90 transition-all opacity-30 hover:opacity-100"
          >
            Esc
          </button>
        )}
        {/* Compact Status Bar */}
        {!isFullscreen && (
          <CompactStatusBar
            params={params}
            isFrozen={!!frozenImage}
            onCenterView={() => orbitControlsRef.current?.reset?.()}
            onToggleFreeze={() => {
              if (frozenImage) {
                handleUnfreezeView();
                setFrozenImage(null);
              } else {
                handleFreezeView();
              }
            }}
            onFullscreen={handleFullscreen}
          />
        )}
        {/* Mobile Bottom Bar */}
        {!isFullscreen && (
          <MobileBottomBar
            activePanel={activePanel}
            onPanelToggle={handlePanelToggle}
            isDrawingActive={isTabletActive}
            onDrawingToggle={() => setIsTabletActive(!isTabletActive)}
          />
        )}
        {/* Mobile Panel Sheets */}
        <MobilePanelSheet title={t('geometry_form.title')} isOpen={activePanel === 'geometry'} onClose={() => setActivePanel(null)}>
          <GeometryPanel params={params} options={options} style={style} properties={properties}
            onParamsChange={updateParams}
            onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }}
            onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }}
          />
        </MobilePanelSheet>

        <MobilePanelSheet title={t('panel.visualization')} isOpen={activePanel === 'visualization'} onClose={() => setActivePanel(null)}>
          <VisualizationPanel params={params} options={options} style={style} properties={properties}
            onParamsChange={updateParams}
            onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }}
            onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }}
          />
        </MobilePanelSheet>

        <MobilePanelSheet title={t('panel.style')} isOpen={activePanel === 'style'} onClose={() => setActivePanel(null)}>
          <StylePanel params={params} options={options} style={style} properties={properties}
            onParamsChange={updateParams}
            onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }}
            onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }}
          />
        </MobilePanelSheet>

        <MobilePanelSheet title={t('panel.properties')} isOpen={activePanel === 'properties'} onClose={() => setActivePanel(null)}>
          <PropertiesPanel params={params} options={options} style={style} properties={properties}
            onParamsChange={updateParams}
            onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }}
            onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }}
          />
        </MobilePanelSheet>
      </div>
    </div>
  );
}

// Componente principal que fornece o contexto
export default function SpaceSculptor() {
  return (
    <ActiveToolProvider>
      <SpaceSculptorContent />
    </ActiveToolProvider>
  );
}