import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GeometryParams, VisualizationOptions, StyleOptions, GeometryType } from '@/types/geometry';
import { GeometryCalculator } from '@/lib/geometry-calculations';
import { useGeometryState } from '@/hooks/useGeometryState';
import { useHistory } from '@/hooks/useHistory';
import { useTabletHistory } from '@/hooks/useTabletHistory';
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
import AdvancedDrawingTablet from './AdvancedDrawingTablet';

// Componente interno que usa o contexto de ferramenta ativa
function SpaceSculptorContent() {
  // Teste de console no componente principal
  // console.log('🔧 TESTE CONSOLE - SpaceSculptorContent renderizado');
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
  const [drawingStrokes, setDrawingStrokes] = useState<DrawingStroke[]>([]);
  
  // Estado da mesa digitalizadora
  const [isTabletActive, setIsTabletActive] = useState(false);
  
  // Estado independente para ferramentas de texto
  const [textSettings, setTextSettings] = useState({
    active: false,
    color: '#ffffff', // Branco padrão
    size: 40, // 40px padrão
    fontFamily: 'Virgil'
  });
  
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

  // Sistema de histórico para mesa digitalizadora
  const {
    currentStrokes: tabletStrokes,
    addToHistory: addToTabletHistory,
    undo: tabletUndo,
    redo: tabletRedo,
    canUndo: canTabletUndo,
    canRedo: canTabletRedo,
    clearHistory: clearTabletHistory
  } = useTabletHistory(50);

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
      console.log('🎯 Desativando ferramenta de texto - activeTool definido como none');
    }
  }, [textSettings.active, setActiveTool, activeTool]);

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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        console.log('⌨️ Atalho Ctrl+Z detectado');
        
        // Undo na mesa digitalizadora se ativa
        if (isTabletActive && drawingOverlayRef.current?.undo) {
          drawingOverlayRef.current.undo();
          toast.success('Desenho desfeito');
          return;
        }
        
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
        
        // Redo na mesa digitalizadora se ativa
        if (isTabletActive && drawingOverlayRef.current?.redo) {
          drawingOverlayRef.current.redo();
          toast.success('Desenho refeito');
          return;
        }
        
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
        
        // Limpar mesa digitalizadora se ativa
        if (isTabletActive && drawingOverlayRef.current?.clear) {
          drawingOverlayRef.current.clear();
          toast.success('Mesa digitalizadora limpa');
          return;
        }
        
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

      // Atalhos para ferramentas de desenho
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        console.log('⌨️ Atalho P detectado - Ativando mesa digitalizadora');
        setIsTabletActive(true);
        setTabletTool({ type: 'pen', name: 'Caneta', icon: null, category: 'drawing' });
        toast.success('Mesa digitalizadora ativada - Caneta');
      }

      // Atalhos para ferramentas de texto
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        console.log('⌨️ Atalho T detectado - Ativando ferramenta de texto');
        handleTextToolToggle();
        toast.success('Ferramenta de texto ativada');
      }

      // Atalhos para ferramentas da mesa digitalizadora
      if (isTabletActive) {
        switch (e.key.toLowerCase()) {
          case 'l':
            e.preventDefault();
            setTabletTool({ type: 'pencil', name: 'Lápis', icon: null, category: 'drawing' });
            toast.success('Lápis selecionado');
            break;
          case 'm':
            e.preventDefault();
            setTabletTool({ type: 'marker', name: 'Marcador', icon: null, category: 'drawing' });
            toast.success('Marcador selecionado');
            break;
          case 'h':
            e.preventDefault();
            setTabletTool({ type: 'highlighter', name: 'Marca-texto', icon: null, category: 'drawing' });
            toast.success('Marca-texto selecionado');
            break;
          case 'e':
            e.preventDefault();
            setTabletTool({ type: 'eraser', name: 'Borracha', icon: null, category: 'drawing' });
            toast.success('Borracha selecionada');
            break;
          case 'r':
            e.preventDefault();
            setTabletTool({ type: 'rectangle', name: 'Retângulo', icon: null, category: 'drawing' });
            toast.success('Retângulo selecionado');
            break;
          case 'q':
            e.preventDefault();
            setTabletTool({ type: 'square', name: 'Quadrado', icon: null, category: 'drawing' });
            toast.success('Quadrado selecionado');
            break;
          case 'c':
            e.preventDefault();
            setTabletTool({ type: 'circle', name: 'Círculo', icon: null, category: 'drawing' });
            toast.success('Círculo selecionado');
            break;
          case '-':
            e.preventDefault();
            setTabletTool({ type: 'line', name: 'Reta', icon: null, category: 'drawing' });
            toast.success('Reta selecionada');
            break;
          case 'a':
            e.preventDefault();
            setTabletTool({ type: 'arrow', name: 'Seta', icon: null, category: 'drawing' });
            toast.success('Seta selecionada');
            break;
        }
      }

      // Escape - Cancelar operações
      if (e.key === 'Escape') {
        e.preventDefault();
        console.log('⌨️ Atalho Escape detectado');
        
        // Desativar mesa digitalizadora
        if (isTabletActive) {
          setIsTabletActive(false);
          toast.success('Mesa digitalizadora desativada');
        }
        
        // Desativar ferramenta de texto
        if (textSettings.active) {
          setTextSettings(prev => ({ ...prev, active: false }));
          toast.success('Ferramenta de texto desativada');
        }
      }
    };

    // Adicionar listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTabletActive, canUndoGeometry, canRedoGeometry, canUndoAction, canRedoAction, textSettings.active, handleTextToolToggle, handleUndoGeometry, handleRedoGeometry, undoAction, redoAction]);

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
    toast.success('Vista resetada');
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
      if (drawingStrokes.length > 0) {
        console.log('🎨 Total de strokes para renderizar:', drawingStrokes.length);
        console.log('🎨 Strokes completos:', drawingStrokes);
        
        // Criar canvas temporário para os desenhos da mesa digitalizadora
        const drawingCanvas = document.createElement('canvas');
        const drawingCtx = drawingCanvas.getContext('2d');
        if (drawingCtx) {
          drawingCanvas.width = tempCanvas.width;
          drawingCanvas.height = tempCanvas.height;
          
          // Renderizar todos os traços da mesa digitalizadora
          drawingStrokes.forEach((stroke, index) => {
            console.log(`🎨 Processando stroke ${index}:`, stroke);
            console.log(`🎨 Stroke ${index} tem texto:`, !!(stroke as any).text);
            console.log(`🎨 Stroke ${index} texto:`, (stroke as any).text);
            console.log(`🎨 Stroke ${index} tipo:`, (stroke as any).type);
            
            // Verificar se é um stroke de texto
            if ((stroke as any).text) {
              console.log(`🎨 Renderizando texto do stroke ${index}:`, (stroke as any).text);
              // Renderizar texto com fonte Virgil (Excalidraw)
              drawingCtx.fillStyle = stroke.style.color;
              
              // Usar a fonte Virgil (Excalidraw) como no DrawingOverlay3D
              const fontSize = (stroke as any).fontSize || stroke.style.thickness * 4;
              drawingCtx.font = `${fontSize}px "Virgil", "Cascadia", "Segoe Print", "Bradley Hand", "Chalkboard SE", "Comic Sans MS", cursive`;
              drawingCtx.textBaseline = 'top';
              drawingCtx.textAlign = 'left';
              drawingCtx.globalAlpha = stroke.style.opacity;
              
              // Adicionar sombra para texto branco (como no DrawingOverlay3D)
              if (stroke.style.color === '#ffffff' || stroke.style.color === '#FFFFFF') {
                drawingCtx.shadowColor = '#000000';
                drawingCtx.shadowBlur = 2;
                drawingCtx.shadowOffsetX = 1;
                drawingCtx.shadowOffsetY = 1;
              }
              
              const lines = (stroke as any).text.split('\n');
              const lineHeight = fontSize * 1.2; // Usar lineHeight consistente
              
              lines.forEach((line: string, lineIndex: number) => {
                console.log(`🎨 Renderizando linha ${lineIndex}:`, line);
                drawingCtx.fillText(line, stroke.points[0].x, stroke.points[0].y + (lineIndex * lineHeight));
              });
              
              // Resetar sombra
              drawingCtx.shadowColor = 'transparent';
              drawingCtx.shadowBlur = 0;
              drawingCtx.shadowOffsetX = 0;
              drawingCtx.shadowOffsetY = 0;
            } else if (stroke.points.length > 0) {
              // Renderizar traços normais
              drawingCtx.strokeStyle = stroke.style.color;
              drawingCtx.lineWidth = stroke.style.thickness;
              drawingCtx.globalAlpha = stroke.style.opacity;
              drawingCtx.lineCap = 'round';
              drawingCtx.lineJoin = 'round';
              
              drawingCtx.beginPath();
              const firstPoint = stroke.points[0];
              drawingCtx.moveTo(firstPoint.x, firstPoint.y);
              
              for (let i = 1; i < stroke.points.length; i++) {
                const point = stroke.points[i];
                const prevPoint = stroke.points[i - 1];
                
                if (stroke.style.pressure && stroke.points.length > 1) {
                  const avgPressure = stroke.points.reduce((sum, point) => sum + (point.pressure || 0.5), 0) / stroke.points.length;
                  const pressureMultiplier = 0.5 + (avgPressure * 1.5);
                  drawingCtx.lineWidth = stroke.style.thickness * pressureMultiplier;
                  drawingCtx.globalAlpha = stroke.style.opacity * (0.7 + avgPressure * 0.3);
                }
                
                if (stroke.style.smoothing > 0) {
                  const smoothing = stroke.style.smoothing;
                  const dx = point.x - prevPoint.x;
                  const dy = point.y - prevPoint.y;
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  const adaptiveSmoothing = distance > 10 ? smoothing * 0.7 : smoothing;
                  const cp1x = prevPoint.x + dx * adaptiveSmoothing;
                  const cp1y = prevPoint.y + dy * adaptiveSmoothing;
                  const cp2x = point.x - dx * adaptiveSmoothing;
                  const cp2y = point.y - dy * adaptiveSmoothing;
                  drawingCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, point.x, point.y);
                } else {
                  drawingCtx.lineTo(point.x, point.y);
                }
              }
              drawingCtx.stroke();
            }
          });
          
          // Desenhar o canvas da mesa digitalizadora no canvas principal
          ctx.drawImage(drawingCanvas, 0, 0);
        }
      }

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
  }, [params.type, drawingStrokes]);

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
  
  // Configurações atuais da mesa digitalizadora
  const [tabletStyle, setTabletStyle] = useState({
    color: '#ffffff',
    thickness: 2,
    opacity: 1,
    pressure: true,
    smoothing: 0.8, // Suavização alta para eliminar retas
    fontFamily: 'Poppins' // Fonte padrão
  });
  const [tabletTool, setTabletTool] = useState({
    type: 'pen' as any,
    name: 'Caneta',
    icon: null,
    category: 'drawing' as const
  });

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
    console.log('🎨 handleTabletStyleChange chamado:', key, value);
    setTabletStyle(prev => {
      const newStyle = { ...prev, [key]: value };
      console.log('🎨 Novo estilo:', newStyle);
      return newStyle;
    });
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

  // Handlers para histórico da mesa digitalizadora
  const handleTabletDrawingChange = useCallback((strokes: any[]) => {
    setDrawingStrokes(strokes);
    addToTabletHistory(strokes);
  }, [addToTabletHistory]);

  const handleTabletUndo = useCallback(() => {
    const previousStrokes = tabletUndo();
    setDrawingStrokes(previousStrokes as any);
  }, [tabletUndo]);

  const handleTabletRedo = useCallback(() => {
    const nextStrokes = tabletRedo();
    setDrawingStrokes(nextStrokes as any);
  }, [tabletRedo]);

  const handleTabletClear = useCallback(() => {
    setDrawingStrokes([]);
    clearTabletHistory();
  }, [clearTabletHistory]);

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
            onExport={handleExportCombined}
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
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndoAction}
        canRedo={canRedoAction}
        onStyleChange={(key, value) => {
          setStyle(prev => ({ ...prev, [key]: value }));
        }}
        isTabletActive={isTabletActive}
        onTabletToggle={setIsTabletActive}
        tabletStyle={tabletStyle}
        onTabletStyleChange={(key, value) => {
          handleTabletStyleChange(key, value);
        }}
      />
      
      <div className="flex flex-1 min-h-screen">
        <aside className="w-80 border-r border-border/30 bg-background/50 backdrop-blur flex-shrink-0 h-screen overflow-y-auto">
          <ControlPanel
            params={params}
            options={options}
            style={style}
            properties={properties}
            onParamsChange={updateParams}
            onOptionsChange={(newOptions) => {
              addToHistory('options_change', options);
              setOptions(newOptions);
            }}
            onStyleChange={(newStyle) => {
              addToHistory('style_change', style);
              setStyle(newStyle);
            }}
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
            onTabletStyleChange={(style) => {
              setTabletStyle(prev => ({ ...prev, ...style }));
            }}
            onTabletToolChange={handleTabletToolChange}
          />
        </aside>
      
        <section className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Barra de Ferramentas Principal */}
          {(
            <div className="border-b border-border/30 bg-background/50 backdrop-blur">
              <div className="flex items-center gap-6 p-4 bg-background/95 backdrop-blur-xl border-b overflow-x-auto min-h-[80px]">
                
                {/* 1. Mesa Digitalizadora (Toggle) - Sempre visível */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setIsTabletActive(!isTabletActive)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isTabletActive
                        ? 'bg-green-500 text-white shadow-lg hover:bg-green-600' 
                        : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                    <span className="text-sm font-medium">
                      {isTabletActive ? 'Desativar Mesa' : 'Ativar Mesa'}
                    </span>
                  </button>
                </div>

                {/* Separador */}
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-border/50 to-transparent"></div>

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

              </div>
            </div>
          )}
          
          {/* Undo/Redo para Geometria - Apenas quando mesa NÃO está ativa */}
          {!isTabletActive && (
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
          )}

          {/* Conteúdo da Geometria */}
          <div className="flex-1 m-0 p-0 h-full relative">

            {isTabletActive ? (
              /* Mesa Digitalizadora Avançada com Sólido 3D de Fundo */
              <div className="w-full h-full relative">
                {/* Sólido 3D como fundo - SEMPRE VISÍVEL */}
                <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
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
                  </div>
                </div>
                
                {/* Mesa Digitalizadora por cima do sólido - TRANSPARENTE */}
                <div className="absolute inset-0 w-full h-full pointer-events-auto z-10">
                  <AdvancedDrawingTablet 
                    isActive={isTabletActive}
                    className="w-full h-full"
                  />
                </div>
              </div>
            ) : (
              /* Área 3D Normal */
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
                    onDrawingChange={handleTabletDrawingChange}
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
            )}
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