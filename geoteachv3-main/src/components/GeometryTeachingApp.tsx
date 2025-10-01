import React, { useState } from 'react';
import DrawingOverlay3D from './DrawingOverlay3D';
import { ToolBar } from './ToolBar';
import { DrawingStroke, DrawingStyle, DrawingTool } from './DrawingOverlay3D';

/**
 * EXEMPLO COMPLETO DE USO
 * 
 * Este componente demonstra como integrar a Mesa Digitalizadora
 * com todas as ferramentas geométricas no seu aplicativo de geometria espacial.
 */

export default function GeometryTeachingApp() {
  
  // Estados da Mesa Digitalizadora
  const [isTabletActive, setIsTabletActive] = useState(false);
  const [drawingStrokes, setDrawingStrokes] = useState<DrawingStroke[]>([]);
  const [history, setHistory] = useState<DrawingStroke[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Estados de estilo
  const [tabletStyle, setTabletStyle] = useState<DrawingStyle>({
    color: '#ffffff',
    thickness: 2,
    opacity: 1,
    pressure: true,
    smoothing: 0.8,
    fontFamily: 'Poppins'
  });
  
  // Ferramenta atual
  const [tabletTool, setTabletTool] = useState<DrawingTool>({
    type: 'pen',
    name: 'Caneta',
    icon: null
  });
  
  // Estados de grade
  const [showGrid, setShowGrid] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);

  // ==========================================
  // HANDLERS DE MUDANÇA
  // ==========================================

  const handleDrawingChange = (strokes: DrawingStroke[]) => {
    setDrawingStrokes(strokes);
    
    // Adicionar ao histórico
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(strokes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleStyleChange = (key: string, value: any) => {
    setTabletStyle(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleToolChange = (tool: any) => {
    setTabletTool({
      type: tool.type,
      name: tool.name,
      icon: null
    });
  };

  // ==========================================
  // HANDLERS DE HISTÓRICO
  // ==========================================

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setDrawingStrokes(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setDrawingStrokes(history[newIndex]);
    }
  };

  const handleClear = () => {
    const emptyStrokes: DrawingStroke[] = [];
    setDrawingStrokes(emptyStrokes);
    setHistory([emptyStrokes]);
    setHistoryIndex(0);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="relative w-full h-screen bg-gray-900">
      
      {/* Barra de Ferramentas */}
      <ToolBar
        isTabletActive={isTabletActive}
        onTabletToggle={setIsTabletActive}
        tabletStyle={tabletStyle}
        tabletTool={tabletTool}
        onTabletStyleChange={handleStyleChange}
        onTabletToolChange={handleToolChange}
        onTabletUndo={handleUndo}
        onTabletRedo={handleRedo}
        onTabletClear={handleClear}
        canTabletUndo={historyIndex > 0}
        canTabletRedo={historyIndex < history.length - 1}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        snapEnabled={snapEnabled}
        onToggleSnap={() => setSnapEnabled(!snapEnabled)}
      />

      {/* Área de Trabalho */}
      <div className="relative w-full h-[calc(100vh-80px)]">
        
        {/* Seu conteúdo 3D (Three.js) vai aqui */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          {/* Exemplo de placeholder para o sólido 3D */}
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/50">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-xl">Seu sólido 3D aparecerá aqui</p>
              <p className="text-sm mt-2">Three.js / Geometria Espacial</p>
            </div>
          </div>
        </div>

        {/* Overlay de Desenho - Sobreposto ao 3D */}
        <DrawingOverlay3D
          isActive={isTabletActive}
          drawingStrokes={drawingStrokes}
          onDrawingChange={handleDrawingChange}
          currentStyle={tabletStyle}
          currentTool={tabletTool}
          activeTool={tabletTool.type}
        />
      </div>

      {/* Informações de Depuração (opcional - remover em produção) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs space-y-1 max-w-xs">
          <div className="font-bold mb-2">🔧 Debug Info</div>
          <div>Mesa Ativa: {isTabletActive ? '✅' : '❌'}</div>
          <div>Ferramenta: {tabletTool.name}</div>
          <div>Cor: {tabletStyle.color}</div>
          <div>Espessura: {tabletStyle.thickness}px</div>
          <div>Traços: {drawingStrokes.length}</div>
          <div>Histórico: {historyIndex + 1}/{history.length}</div>
          <div>Grade: {showGrid ? 'ON' : 'OFF'} {snapEnabled && '(Snap)'}</div>
        </div>
      )}
    </div>
  );
}

/**
 * GUIA DE USO:
 * 
 * 1. ATIVAR MESA:
 *    - Clique no toggle "Mesa Ativa" para começar a desenhar
 * 
 * 2. FERRAMENTAS DE DESENHO:
 *    - Caneta (P): Traço suave e preciso
 *    - Lápis (L): Textura de grafite
 *    - Marcador (M): Traço grosso e translúcido
 *    - Técnica (T): Caneta fina para desenho técnico
 *    - Marca-texto (H): Destacar conceitos
 *    - Borracha (E): Apagar traços
 * 
 * 3. FERRAMENTAS GEOMÉTRICAS:
 *    - Retângulo (R): Arrastar para criar retângulo
 *    - Quadrado (Q): Retângulo com proporção 1:1
 *    - Círculo (C): Arrastar do centro para definir raio
 *    - Reta (-): Linha reta entre dois pontos
 *    - Reta Tracejada: Linha tracejada
 *    - Seta (A): Seta para indicar direções/vetores
 * 
 * 4. CONFIGURAÇÕES:
 *    - Cor: Clique no botão de cor para abrir paleta
 *    - Espessura: Ajuste o slider (0.5-20px)
 *    - Opacidade: Controle a transparência
 *    - Suavização: Quanto mais suave, mais fluido o traço
 *    - Pressão: Ative para usar sensibilidade da mesa
 * 
 * 5. GRADE E SNAP:
 *    - Grade (Ctrl+G): Mostrar/ocultar grade de referência
 *    - Snap (Ctrl+Shift+G): Magnetizar pontos à grade
 * 
 * 6. HISTÓRICO:
 *    - Desfazer (Ctrl+Z): Remover último traço
 *    - Refazer (Ctrl+Y): Restaurar traço removido
 *    - Limpar (Delete): Apagar tudo
 * 
 * 7. ATALHOS DE TECLADO:
 *    P - Caneta
 *    L - Lápis
 *    M - Marcador
 *    T - Técnica
 *    H - Marca-texto
 *    E - Borracha
 *    R - Retângulo
 *    Q - Quadrado
 *    C - Círculo
 *    - - Reta
 *    A - Seta
 *    Ctrl+Z - Desfazer
 *    Ctrl+Y - Refazer
 *    Ctrl+G - Grade
 *    Ctrl+Shift+G - Snap
 *    Delete - Limpar
 * 
 * 8. PARA PROFESSORES DE MATEMÁTICA:
 *    - Use a grade para desenhos precisos
 *    - Use ferramentas geométricas para formas perfeitas
 *    - Setas são úteis para indicar vetores e direções
 *    - Marca-texto para destacar conceitos importantes
 *    - Caneta técnica para diagramas e anotações precisas
 *    - Combine com seu sólido 3D para explicações completas
 */

