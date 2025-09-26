import React, { useRef, useCallback, useEffect, useState } from 'react';
import { DrawingStroke, DrawingPoint, DrawingStyle, DrawingTool } from './DrawingTablet';

interface DrawingOverlay3DProps {
  isActive: boolean;
  drawingStrokes: DrawingStroke[];
  onDrawingChange: (strokes: DrawingStroke[]) => void;
  currentStyle?: DrawingStyle;
  currentTool?: DrawingTool;
  activeTool?: string;
  textSettings?: {
    active: boolean;
    color: string;
    size: number;
    fontFamily: string;
  };
  onTextChange?: (key: string, value: any) => void;
  className?: string;
}

export default function DrawingOverlay3D({
  isActive,
  drawingStrokes,
  onDrawingChange,
  currentStyle,
  currentTool,
  activeTool,
  textSettings,
  onTextChange,
  className = ''
}: DrawingOverlay3DProps) {
  console.log('🎨 DrawingOverlay3D renderizado com:', {
    isActive,
    activeTool,
    currentTool,
    currentStyle: {
      color: currentStyle?.color,
      thickness: currentStyle?.thickness,
      opacity: currentStyle?.opacity
    }
  });

  // Fallback para activeTool undefined
  const effectiveActiveTool = activeTool || 'none';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [currentPressure, setCurrentPressure] = useState(0);
  
  // Estados para seleção de área
  const [isAreaSelecting, setIsAreaSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{x: number, y: number} | null>(null);
  const [selectedStrokes, setSelectedStrokes] = useState<string[]>([]);

  // Estados para desenho assistido (Samsung Notes style)
  const [assistedDrawing, setAssistedDrawing] = useState(true);
  const [strokeStartTime, setStrokeStartTime] = useState<number | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);

  // Estados para texto (Word/Excalidraw style)
  const [isTextMode, setIsTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{x: number, y: number} | null>(null);
  const [fontSize, setFontSize] = useState(20); // Fonte padrão maior
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [selectedTextStroke, setSelectedTextStroke] = useState<DrawingStroke | null>(null);
  const [textAreaRef, setTextAreaRef] = useState<HTMLTextAreaElement | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [showTextControls, setShowTextControls] = useState(false);
  const [hoveredTextId, setHoveredTextId] = useState<string | null>(null);

  // Configurações de desenho padrão (fallback)
  const defaultStyle = {
    color: '#ffffff',
    thickness: 13,
    opacity: 1,
    pressure: false, // Desativar variação de pressão
    smoothing: 0.5
  };

  const defaultTool = {
    type: 'pen' as const,
    name: 'Caneta',
    icon: null
  };

  // Usar configurações atuais ou padrão
  const activeStyle = currentStyle || defaultStyle;
  const activeToolConfig = currentTool || defaultTool;

  // Redimensionar canvas para cobrir toda a área
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  }, []);

  useEffect(() => {
    // Redimensionar canvas se estiver ativo OU se a ferramenta de texto independente estiver ativa
    const shouldResize = isActive || effectiveActiveTool === 'independent-text' || effectiveActiveTool === 'text-select' || textSettings?.active;
    
    if (shouldResize) {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [isActive, effectiveActiveTool, textSettings?.active, resizeCanvas]);

  // Redesenhar todos os traços
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('DrawingOverlay3D: No canvas found for redraw');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('DrawingOverlay3D: No context found for redraw');
      return;
    }

    console.log('DrawingOverlay3D: Clearing canvas and redrawing', drawingStrokes.length, 'strokes');
    console.log('DrawingOverlay3D: effectiveActiveTool:', effectiveActiveTool);
    console.log('DrawingOverlay3D: selectedTextId:', selectedTextId);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawingStrokes.forEach(stroke => {
      console.log('DrawingOverlay3D: Rendering stroke:', stroke.id, 'text:', (stroke as any).text);
      drawStroke(ctx, stroke);
    });

    if (currentStroke) {
      drawStroke(ctx, currentStroke);
    }

    // Desenhar área de seleção se estiver selecionando
    if (isAreaSelecting && selectionStart && selectionEnd) {
      const minX = Math.min(selectionStart.x, selectionEnd.x);
      const maxX = Math.max(selectionStart.x, selectionEnd.x);
      const minY = Math.min(selectionStart.y, selectionEnd.y);
      const maxY = Math.max(selectionStart.y, selectionEnd.y);
      
      ctx.save();
      ctx.strokeStyle = '#007AFF';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      
      ctx.fillStyle = 'rgba(0, 122, 255, 0.1)';
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
      ctx.restore();
    }
  }, [drawingStrokes, currentStroke, isAreaSelecting, selectionStart, selectionEnd, selectedTextId, hoveredTextId]);

  // Desenhar um traço específico
  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    ctx.save();
    
    // Desenhar texto se for um stroke de texto
    if ((stroke as any).text) {
      const text = (stroke as any).text;
      const fontSize = (stroke as any).fontSize || stroke.style.thickness || 20;
      
      console.log('🎨 Renderizando texto:', JSON.stringify(text));
      console.log('🎨 Texto completo length:', text.length);
      console.log('🎨 Primeiros 50 chars:', text.substring(0, 50));
      console.log('🎨 Últimos 50 chars:', text.substring(Math.max(0, text.length - 50)));
      console.log('🎨 fontSize:', fontSize);
      console.log('🎨 cor:', stroke.style.color);
      console.log('🎨 posição:', stroke.points[0]);
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = stroke.style.color;
      ctx.font = `${fontSize}px "Virgil", "Cascadia", "Segoe Print", "Bradley Hand", "Chalkboard SE", "Comic Sans MS", cursive`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.globalAlpha = stroke.style.opacity;
      
      // Adicionar sombra para texto branco
      if (stroke.style.color === '#ffffff' || stroke.style.color === '#FFFFFF') {
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
      }
      
      // Suportar quebras de linha e quebra automática de texto longo
      const rawLines = text.split('\n');
      const maxLineWidth = 1200; // Largura máxima para uma linha (aumentada)
      const lines: string[] = [];
      
      // Quebrar automaticamente linhas muito longas
      rawLines.forEach(line => {
        if (ctx.measureText(line).width <= maxLineWidth) {
          lines.push(line);
        } else {
          // Quebrar linha longa em várias linhas
          const words = line.split(' ');
          let currentLine = '';
          
          words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (ctx.measureText(testLine).width <= maxLineWidth) {
              currentLine = testLine;
            } else {
              if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                // Palavra muito longa, quebrar por caracteres
                for (let i = 0; i < word.length; i += 50) {
                  lines.push(word.substring(i, i + 50));
                }
                currentLine = '';
              }
            }
          });
          
          if (currentLine) {
            lines.push(currentLine);
          }
        }
      });
      
      const lineHeight = fontSize * 1.2;
      console.log('🎨 Linhas processadas:', lines.length, 'linhas:', lines);
      
      // Desenhar borda de seleção estilo Excalidraw se o texto estiver selecionado
      if (selectedTextId === stroke.id) {
        // Calcular dimensões do texto
        const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        const textHeight = lines.length * lineHeight;
        
        // Desenhar borda de seleção com alças
        ctx.save();
        
        // Retângulo de seleção com fundo semi-transparente
        ctx.fillStyle = 'rgba(66, 133, 244, 0.15)';
        ctx.fillRect(
          stroke.points[0].x - 6, 
          stroke.points[0].y - 6, 
          textWidth + 12, 
          textHeight + 12
        );
        
        // Borda de seleção mais visível
        ctx.strokeStyle = '#4285f4';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(
          stroke.points[0].x - 6, 
          stroke.points[0].y - 6, 
          textWidth + 12, 
          textHeight + 12
        );
        
        // Alças de redimensionamento (8 pontos)
        const handleSize = 8;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#4285f4';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        
        // Desenhar as 8 alças nos cantos e pontos médios
        [
          // Cantos
          {x: stroke.points[0].x - 4, y: stroke.points[0].y - 4},
          {x: stroke.points[0].x + textWidth + 4, y: stroke.points[0].y - 4},
          {x: stroke.points[0].x + textWidth + 4, y: stroke.points[0].y + textHeight + 4},
          {x: stroke.points[0].x - 4, y: stroke.points[0].y + textHeight + 4},
          // Pontos médios
          {x: stroke.points[0].x + textWidth/2, y: stroke.points[0].y - 4},
          {x: stroke.points[0].x + textWidth + 4, y: stroke.points[0].y + textHeight/2},
          {x: stroke.points[0].x + textWidth/2, y: stroke.points[0].y + textHeight + 4},
          {x: stroke.points[0].x - 4, y: stroke.points[0].y + textHeight/2}
        ].forEach(handle => {
          ctx.beginPath();
          ctx.rect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
          ctx.fill();
          ctx.stroke();
        });
        
        ctx.restore();
      }
      
      // Desenhar fundo de hover se o texto estiver sendo hovered (Excalidraw style)
      if (hoveredTextId === stroke.id && selectedTextId !== stroke.id) {
        // Calcular largura real do texto
        const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        const textHeight = lines.length * lineHeight;
        
        ctx.save();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.fillRect(stroke.points[0].x - 4, stroke.points[0].y - 4, textWidth + 8, textHeight + 8);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.strokeRect(stroke.points[0].x - 4, stroke.points[0].y - 4, textWidth + 8, textHeight + 8);
        ctx.restore();
      }
      
      lines.forEach((line, index) => {
        const y = stroke.points[0].y + (index * lineHeight);
        ctx.fillText(line, stroke.points[0].x, y);
      });
      
      ctx.restore();
      return;
    }

    // Desenhar traço normal
    if (stroke.points.length < 2) {
      ctx.restore();
      return;
    }
    
    // Configurar modo de composição baseado na ferramenta
    if (stroke.tool.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000000'; // Cor não importa para borracha
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.style.color;
    }
    
    ctx.lineWidth = stroke.style.thickness; // Sem variação de pressão
    ctx.globalAlpha = stroke.style.opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      const prevPoint = stroke.points[i - 1];
      
      if (stroke.style.smoothing > 0) {
        const cp1x = prevPoint.x + (point.x - prevPoint.x) * stroke.style.smoothing;
        const cp1y = prevPoint.y + (point.y - prevPoint.y) * stroke.style.smoothing;
        const cp2x = point.x - (point.x - prevPoint.x) * stroke.style.smoothing;
        const cp2y = point.y - (point.y - prevPoint.y) * stroke.style.smoothing;
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }

    ctx.stroke();
    ctx.restore();
  }, []);

  // Iniciar desenho
  const startDrawing = useCallback((event: React.PointerEvent) => {
    console.log('🎨 startDrawing chamado - isActive:', isActive, 'activeTool:', effectiveActiveTool);
    console.log('🎨 currentTool:', currentTool);
    console.log('🎨 currentStyle:', currentStyle);
    console.log('🎨 textSettings:', textSettings);
    
    // Permitir interação se a ferramenta de texto independente estiver ativa
    const isTextToolActive = effectiveActiveTool === 'independent-text' || effectiveActiveTool === 'text-select' || textSettings?.active;
    
    if (!isActive && !isTextToolActive) {
      console.log('🎨 Desenho não ativo e texto independente não ativo - retornando');
      return;
    }

    console.log('🎨 Iniciando desenho com ferramenta:', effectiveActiveTool);
    console.log('🎨 textSettings.active:', textSettings?.active);

    event.preventDefault();
    event.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const pressure = event.pressure || 0.5;

    setCurrentPressure(pressure);

    // Modo borracha seletiva - remover traços próximos APENAS se a ferramenta for borracha
    if (effectiveActiveTool === 'eraser') {
      const threshold = 20; // pixels
      const newStrokes = drawingStrokes.filter(stroke => {
        return !stroke.points.some(point => {
          const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
          return distance < threshold;
        });
      });

      if (newStrokes.length !== drawingStrokes.length) {
        onDrawingChange(newStrokes);
        return;
      }
    }

    // Modo seleção de área
    if (activeToolConfig.type === 'area-select') {
      setIsAreaSelecting(true);
      setSelectionStart({ x, y });
      setSelectionEnd({ x, y });
      return;
    }

    // Modo seleção de texto (estilo Excalidraw)
    if (effectiveActiveTool === 'select' || effectiveActiveTool === 'text-select') {
      console.log('🎯 Modo seleção ativado - verificando texto na posição:', x, y);
      
      // Verificar se clicou em um texto existente
      const clickedTextStroke = findTextAtPosition(x, y);
      
      if (clickedTextStroke) {
        console.log('🎯 Texto encontrado:', clickedTextStroke.id);
        console.log('🎯 Texto selecionado:', (clickedTextStroke as any).text);
        
        // Selecionar texto para edição/manipulação
        setSelectedTextStroke(clickedTextStroke);
        setSelectedTextId(clickedTextStroke.id);
        
        // NÃO mostrar controles imediatamente - aguardar para ver se é clique e segurar
        console.log('🎯 Aguardando para determinar se é clique simples ou clique e segurar');
        
        // Preparar para arrasto de texto
        setDragStartPos({ x, y });
        console.log('🎯 Preparando para arrasto de texto:', clickedTextStroke.id);
        
        // Timer para detectar clique e segurar (iniciar arrasto após 200ms)
        const timer = setTimeout(() => {
          console.log('🎯 Clique e segurar detectado - iniciando arrasto');
          setIsDraggingText(true);
          setShowTextControls(false); // Não mostrar caixinha ao arrastar
        }, 200);
        setDragTimer(timer);
        
        // Timer para mostrar caixinha apenas se for clique simples (após 300ms)
        const controlsTimer = setTimeout(() => {
          if (!isDraggingText) {
            console.log('🎯 Clique simples detectado - mostrando caixinha');
            setShowTextControls(true);
          }
        }, 300);
        setShowControlsTimer(controlsTimer);
        
        // Verificar se é duplo clique para editar
        const now = Date.now();
        const lastClickTime = (clickedTextStroke as any).lastClickTime || 0;
        const isDoubleClick = now - lastClickTime < 300;
        
        console.log('🎯 Verificando duplo clique:', {
          now,
          lastClickTime,
          timeDiff: now - lastClickTime,
          isDoubleClick
        });
        
        if (isDoubleClick) {
          // Duplo clique - editar texto existente (sem criar cópia)
          console.log('🎯 Duplo clique - editando texto existente:', clickedTextStroke.id);
          setIsDraggingText(false);
          setEditingTextId(clickedTextStroke.id);
        setTextInput((clickedTextStroke as any).text || '');
        setFontSize((clickedTextStroke as any).fontSize || clickedTextStroke.style.thickness || 20);
        setTextPosition({ x, y });
        setIsTextMode(true);
          setIsTextSelected(true);
          setSelectedTextPosition({ x, y });
          
          // Cancelar timer de arrasto para duplo clique
          if (dragTimer) {
            clearTimeout(dragTimer);
            setDragTimer(null);
          }
          
          // NÃO criar novo texto - apenas editar o existente
          console.log('🎯 Editando texto existente, não criando novo');
        } else {
          // Clique simples - apenas selecionar texto (sem editar)
          console.log('🎯 Clique simples - selecionando texto:', clickedTextStroke.id);
          setIsTextSelected(true);
          setSelectedTextPosition({ x, y });
          
          // NÃO entrar no modo de edição - apenas selecionar
          setIsDraggingText(false);
          setEditingTextId(null);
          setIsTextMode(false);
          
          // Salvar timestamp do clique
          const updatedStrokes = drawingStrokes.map(stroke => {
            if (stroke.id === clickedTextStroke.id) {
              return {
                ...stroke,
                lastClickTime: now
              } as any;
            }
            return stroke;
          });
          onDrawingChange(updatedStrokes);
        }
        
        return;
      } else {
        // Deselecionar se clicou em área vazia
        setSelectedTextId(null);
        setSelectedTextStroke(null);
        setShowTextControls(false);
        console.log('🎯 Área vazia clicada - deselecionando texto');
        return;
      }
    }

    // Modo seleção de texto (text-select)
    if (effectiveActiveTool === 'text-select') {
      console.log('🎯 Modo seleção de texto ativado - clicou em:', x, y);
      
      // Verificar se clicou em um texto existente
      const clickedTextStroke = findTextAtPosition(x, y);
      
      if (clickedTextStroke) {
        console.log('🎯 Texto selecionado para edição:', clickedTextStroke.id);
        // Selecionar texto para edição
        setSelectedTextStroke(clickedTextStroke);
        setEditingTextId(clickedTextStroke.id);
        setSelectedTextId(clickedTextStroke.id);
        setTextInput((clickedTextStroke as any).text || '');
        setFontSize((clickedTextStroke as any).fontSize || clickedTextStroke.style.thickness || 20);
        setTextPosition({ x, y });
        setIsTextMode(true);
        setShowTextControls(true);
        return;
      } else {
        console.log('🎯 Nenhum texto encontrado na posição clicada');
        return;
      }
    }

    // Modo texto (apenas independente)
    if (effectiveActiveTool === 'independent-text' || textSettings?.active) {
      console.log('📝 Entrando no modo texto - textSettings.active:', textSettings?.active);
      console.log('📝 Modo texto ativado - clicou em:', x, y);
      console.log('📝 isActive:', isActive);
      console.log('📝 effectiveActiveTool:', effectiveActiveTool);
      console.log('📝 currentTool:', currentTool);
      console.log('📝 isIndependentTextActive:', isIndependentTextActive);
      console.log('📝 textSettings:', textSettings);
      
      // Verificar se clicou em um texto existente
      const clickedTextStroke = findTextAtPosition(x, y);
      
      if (clickedTextStroke) {
        console.log('📝 Texto existente encontrado:', clickedTextStroke.id);
        // Selecionar texto para edição
        setSelectedTextStroke(clickedTextStroke);
        setEditingTextId(clickedTextStroke.id);
        setSelectedTextId(clickedTextStroke.id);
        setTextInput((clickedTextStroke as any).text || '');
        setFontSize((clickedTextStroke as any).fontSize || clickedTextStroke.style.thickness || 20);
        setTextPosition({ x, y });
        setIsTextMode(true);
        setShowTextControls(true);
        return;
      } else {
        console.log('📝 Criando novo texto em:', x, y);
        // Criar novo texto
        setTextPosition({ x, y });
        setIsTextMode(true);
        setTextInput(''); // Limpar texto anterior
        setSelectedTextStroke(null);
        setEditingTextId(null);
        setSelectedTextId(null);
        setShowTextControls(true);
        console.log('📝 Texto criado - isTextMode:', true);
        return;
      }
    }

    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}-${Math.random()}`,
      tool: currentTool || { type: 'pen', name: 'Caneta', icon: null },
      style: { ...(currentStyle || { color: '#000000', thickness: 2, opacity: 1, pressure: true, smoothing: 0.5 }) },
      points: [{
        x,
        y,
        pressure,
        timestamp: Date.now()
      }],
      timestamp: Date.now()
    };

    setCurrentStroke(newStroke);
    setIsDrawing(true);
    setStrokeStartTime(Date.now());

    // Desenho assistido: timer para "segurar para endireitar"
    if (assistedDrawing) {
      const timer = setTimeout(() => {
        if (isDrawing && currentStroke && currentStroke.points.length > 1) {
          setIsHolding(true);
          console.log('🎯 Segure para endireitar a linha!');
        }
      }, 1500); // 1.5 segundos como no Samsung Notes
      
      setHoldTimer(timer);
    }
  }, [isActive, drawingStrokes, onDrawingChange, assistedDrawing, isDrawing, currentStroke, effectiveActiveTool, selectedTextId, selectedTextStroke]);

  // Estado para arrastar texto
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{x: number, y: number} | null>(null);
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [selectedTextPosition, setSelectedTextPosition] = useState<{x: number, y: number} | null>(null);
  const [dragTimer, setDragTimer] = useState<NodeJS.Timeout | null>(null);
  const [showControlsTimer, setShowControlsTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Continuar desenho ou arrastar texto
  const draw = useCallback((event: React.PointerEvent) => {
    if (!canvasRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const pressure = event.pressure || 0.5;

    setCurrentPressure(pressure);
    
    // Modo arrastar texto (quando uma seleção está ativa e estamos no modo select ou text-select)
    if ((effectiveActiveTool === 'select' || effectiveActiveTool === 'text-select') && selectedTextId && dragStartPos) {
      // Cancelar timers se o mouse se mover (clique simples, não clique e segurar)
      if (dragTimer) {
        clearTimeout(dragTimer);
        setDragTimer(null);
        console.log('🎯 Timer de arrasto cancelado - movimento detectado');
      }
      if (showControlsTimer) {
        clearTimeout(showControlsTimer);
        setShowControlsTimer(null);
        console.log('🎯 Timer de controles cancelado - movimento detectado');
      }
      
      // Iniciar arrasto se o mouse se moveu significativamente
      const deltaX = Math.abs(x - dragStartPos.x);
      const deltaY = Math.abs(y - dragStartPos.y);
      const threshold = 5; // pixels de movimento para iniciar arrasto
      
      if (deltaX > threshold || deltaY > threshold) {
        if (!isDraggingText) {
          console.log('🎯 Iniciando arrasto de texto - movimento detectado');
          setIsDraggingText(true);
        }
      }
      
      if (isDraggingText) {
        // Calcular o deslocamento desde o início do arrasto
        const deltaX = x - dragStartPos.x;
        const deltaY = y - dragStartPos.y;
        
        // Atualizar a posição do texto
        const updatedStrokes = drawingStrokes.map(stroke => {
          if (stroke.id === selectedTextId) {
            // Mover todos os pontos do traço
            return {
              ...stroke,
              points: stroke.points.map(point => ({
                ...point,
                x: point.x + deltaX,
                y: point.y + deltaY
              }))
            };
          }
          return stroke;
        });
        
        // Atualizar posição de arrasto para o próximo movimento
        setDragStartPos({ x, y });
        
        // Atualizar os traços
        onDrawingChange(updatedStrokes);
        return;
      }
    }

    // Se não estiver desenhando, não continuar com o resto da função
    if (!isDrawing || !currentStroke) return;

    // Se for borracha, apagar traços próximos continuamente
    if (activeToolConfig.type === 'eraser') {
      const threshold = 20; // pixels
      const newStrokes = drawingStrokes.filter(stroke => {
        return !stroke.points.some(point => {
          const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
          return distance < threshold;
        });
      });

      if (newStrokes.length !== drawingStrokes.length) {
        onDrawingChange(newStrokes);
        return;
      }
    }

    // Se for seleção de área, atualizar a seleção
    if (activeToolConfig.type === 'area-select' && isAreaSelecting) {
      setSelectionEnd({ x, y });
      return;
    }

    const newPoint: DrawingPoint = {
      x,
      y,
      pressure,
      timestamp: Date.now()
    };

    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, newPoint]
    };

    setCurrentStroke(updatedStroke);
    
    // Redesenhar canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      drawingStrokes.forEach(stroke => {
        drawStroke(ctx, stroke);
      });
      
      drawStroke(ctx, updatedStroke);
    }
  }, [isDrawing, currentStroke, drawingStrokes, drawStroke, activeToolConfig, onDrawingChange, effectiveActiveTool, selectedTextId, isDraggingText, dragStartPos]);

  // Função para verificar se os pontos formam uma linha aproximadamente reta
  const isApproximatelyStraightLine = useCallback((points: DrawingPoint[]) => {
    if (points.length < 3) return false;
    
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    
    // Calcular a distância total da linha reta
    const straightDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
    );
    
    if (straightDistance < 20) return false; // Linha muito curta
    
    // Calcular a distância total percorrida pelos pontos
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i-1].x;
      const dy = points[i].y - points[i-1].y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Se a distância percorrida é muito maior que a linha reta, não é uma linha reta
    const ratio = totalDistance / straightDistance;
    
    // Se a razão for menor que 1.3, é aproximadamente uma linha reta
    return ratio < 1.3;
  }, []);

  // Parar desenho ou arrasto de texto
  const stopDrawing = useCallback(() => {
    // Finalizar arrasto de texto se estiver ativo
    if (isDraggingText && selectedTextId) {
      setIsDraggingText(false);
      setDragStartPos(null);
      setIsTextSelected(false);
      setSelectedTextPosition(null);
      console.log('🎯 Arrasto de texto finalizado');
      return;
    }
    
    // Limpar timers se não estava arrastando
    if (dragTimer) {
      clearTimeout(dragTimer);
      setDragTimer(null);
      console.log('🎯 Timer de arrasto limpo - clique simples detectado');
    }
    if (showControlsTimer) {
      clearTimeout(showControlsTimer);
      setShowControlsTimer(null);
      console.log('🎯 Timer de controles limpo - clique simples detectado');
    }
    
    // Se for seleção de área, finalizar a seleção
    if (activeToolConfig.type === 'area-select' && isAreaSelecting) {
      setIsAreaSelecting(false);
      
      // Encontrar traços dentro da área selecionada
      if (selectionStart && selectionEnd) {
        const minX = Math.min(selectionStart.x, selectionEnd.x);
        const maxX = Math.max(selectionStart.x, selectionEnd.x);
        const minY = Math.min(selectionStart.y, selectionEnd.y);
        const maxY = Math.max(selectionStart.y, selectionEnd.y);
        
        const strokesInArea = drawingStrokes.filter(stroke => {
          return stroke.points.some(point => 
            point.x >= minX && point.x <= maxX && 
            point.y >= minY && point.y <= maxY
          );
        });
        
        setSelectedStrokes(strokesInArea.map(s => s.id));
        console.log('Traços selecionados:', strokesInArea.length);
      }
      
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }

    if (!isDrawing || !currentStroke) return;

    // Desenho assistido: verificar se deve endireitar a linha
    let finalStroke = currentStroke;
    
    if (assistedDrawing && currentStroke.points.length > 2) {
      const startPoint = currentStroke.points[0];
      const endPoint = currentStroke.points[currentStroke.points.length - 1];
      
      // Calcular se é uma linha aproximadamente reta
      const isStraightLine = isApproximatelyStraightLine(currentStroke.points);
      
      if (isStraightLine) {
        // Substituir todos os pontos por uma linha reta
        finalStroke = {
          ...currentStroke,
          points: [startPoint, endPoint],
          isStraightened: true
        } as any;
        
        console.log('🎯 Linha endireitada automaticamente!');
      }
    }

    const newStrokes = [...drawingStrokes, finalStroke];
    onDrawingChange(newStrokes);
    
    setCurrentStroke(null);
    setIsDrawing(false);
    setStrokeStartTime(null);
    setIsHolding(false);
    
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
  }, [isDrawing, currentStroke, drawingStrokes, onDrawingChange, activeTool, isAreaSelecting, selectionStart, selectionEnd, assistedDrawing, isApproximatelyStraightLine, holdTimer]);

  // Limpar canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onDrawingChange([]);
  }, [onDrawingChange]);

  // Encontrar texto na posição (para edição) - Excalidraw style
  const findTextAtPosition = useCallback((x: number, y: number) => {
    const threshold = 30; // pixels de tolerância maior
    console.log('🔍 findTextAtPosition chamada:', { x, y, strokesCount: drawingStrokes.length });
    
    for (const stroke of drawingStrokes) {
      if ((stroke as any).text) {
        const point = stroke.points[0];
        const fontSize = (stroke as any).fontSize || stroke.style.thickness || 20;
        console.log('🔍 Verificando stroke com texto:', { 
          id: stroke.id, 
          text: (stroke as any).text, 
          point: { x: point.x, y: point.y },
          fontSize 
        });
        
        // Calcular área do texto baseada no tamanho real do texto
        const lines = (stroke as any).text.split('\n');
        const lineHeight = fontSize * 1.2;
        
        // Criar um canvas temporário para medir o texto
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.font = `${fontSize}px "Virgil", "Cascadia", "Segoe Print", "Bradley Hand", "Chalkboard SE", "Comic Sans MS", cursive`;
          const textWidth = Math.max(...lines.map(line => tempCtx.measureText(line).width));
          const textHeight = lines.length * lineHeight;
        
        // Verificar se o ponto está dentro da área do texto
        if (x >= point.x - 5 && x <= point.x + textWidth + 5 && 
            y >= point.y - 5 && y <= point.y + textHeight + 5) {
          return stroke;
          }
        }
      }
    }
    
    console.log('🔍 Nenhum texto encontrado na posição:', { x, y });
    return null;
  }, [drawingStrokes]);

  // Estas variáveis foram movidas para depois do early return

  // Detectar hover sobre texto - Solução simples e robusta
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Permitir interação mesmo sem a mesa ativa se a ferramenta de texto independente estiver ativa
    if ((!isActive && effectiveActiveTool !== 'independent-text' && !textSettings?.active) || isTextMode) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Verificar se está sobre algum texto
    let foundText = false;
    for (const stroke of drawingStrokes) {
      if ((stroke as any).text) {
        const point = stroke.points[0];
        const fontSize = (stroke as any).fontSize || stroke.style.thickness || 20;
        const textLines = (stroke as any).text.split('\n').length;
        const textHeight = fontSize * 1.2 * textLines;
        
        if (x >= point.x - 10 && x <= point.x + 320 && 
            y >= point.y - 10 && y <= point.y + textHeight + 10) {
          foundText = true;
          console.log('🎯 Hover sobre texto detectado:', stroke.id);
          setHoveredTextId(stroke.id);
          if (containerRef.current) {
            // Se estiver no modo de seleção, usar cursor de ponteiro
            if (effectiveActiveTool === 'select' || effectiveActiveTool === 'text-select') {
              containerRef.current.style.cursor = 'pointer';
            } else {
            containerRef.current.style.cursor = 'text';
            }
          }
          break;
        }
      }
    }
    
    if (!foundText) {
      setHoveredTextId(null);
      if (containerRef.current) {
        // Se estiver no modo de seleção, usar cursor de ponteiro
        if (effectiveActiveTool === 'select' || effectiveActiveTool === 'text-select') {
          containerRef.current.style.cursor = 'pointer';
        } else if (effectiveActiveTool === 'text' || effectiveActiveTool === 'independent-text') {
          containerRef.current.style.cursor = 'text';
        } else {
        containerRef.current.style.cursor = 'crosshair';
      }
    }
    }
  }, [isActive, isTextMode, drawingStrokes, effectiveActiveTool, textSettings]);

  // Adicionar ou editar texto (Excalidraw style)
  const addText = useCallback((text: string, x: number, y: number) => {
    console.log('📝 addText chamado com:', { 
      text: JSON.stringify(text), 
      x, 
      y, 
      textLength: text.length,
      firstChars: text.substring(0, 50),
      lastChars: text.substring(Math.max(0, text.length - 50))
    });
    
    if (!text || text.trim().length === 0) {
      console.log('📝 Texto vazio ou apenas espaços, cancelando...');
      setIsTextMode(false);
      setTextInput('');
      setTextPosition(null);
      setSelectedTextStroke(null);
      setEditingTextId(null);
      return;
    }

    // Usar estilo apropriado baseado no modo (independente ou mesa digitalizadora)
    const styleToUse = textSettings?.active ? {
      color: textSettings.color,
      thickness: textSettings.size / 4, // Converter pt para thickness
      opacity: 1,
      pressure: true,
      smoothing: 0.5
    } : activeStyle;
    
    console.log('📝 styleToUse:', styleToUse);
    console.log('📝 textSettings:', textSettings);
    console.log('📝 Texto completo recebido:', JSON.stringify(text));
    
    // Usar a espessura como tamanho da fonte
    // Se for muito pequena, usar um mínimo legível de 12px
    const effectiveFontSize = editingTextId && selectedTextStroke 
      ? Math.max((selectedTextStroke as any).fontSize || 12, 12)
      : textSettings?.active 
        ? textSettings.size 
        : Math.max(styleToUse.thickness * 4 || 16, 16);
    
    console.log('📝 effectiveFontSize:', effectiveFontSize);

    console.log('📝 Adicionando/editando texto com tamanho:', effectiveFontSize);
    console.log('📝 Modo texto independente:', effectiveActiveTool === 'independent-text');
    console.log('📝 Estilo usado:', styleToUse);

    if (editingTextId && selectedTextStroke) {
      // Editar texto existente - manter o mesmo tamanho e cor
      console.log('📝 Editando texto existente:', editingTextId, 'com texto:', text);
      const updatedStrokes = drawingStrokes.map(stroke => {
        if (stroke.id === editingTextId) {
          return {
            ...stroke,
            text: text,
            // Manter o mesmo tamanho e cor
            fontSize: (stroke as any).fontSize || effectiveFontSize,
            style: {
              ...stroke.style
            }
          } as any;
        }
        return stroke;
      });
      
      onDrawingChange(updatedStrokes);
      console.log('📝 Texto editado com sucesso');
    } else {
      // Criar novo texto - usar as configurações apropriadas
      const textStroke: DrawingStroke = {
        id: `text-${Date.now()}-${Math.random()}`,
        tool: { type: 'pen', name: 'Texto', icon: null },
        style: { 
          ...styleToUse, // Usar o estilo apropriado (independente)
        },
        points: [{ x, y, pressure: 1, timestamp: Date.now() }],
        timestamp: Date.now(),
        text: text,
        fontSize: effectiveFontSize
      } as any;

      console.log('📝 Criando novo texto com estilo:', styleToUse);
      console.log('📝 Novo texto criado:', textStroke);
      console.log('📝 Texto no stroke:', JSON.stringify((textStroke as any).text));
      console.log('📝 FontSize no stroke:', (textStroke as any).fontSize);
      console.log('📝 Posição do texto:', { x, y });

      const newStrokes = [...drawingStrokes, textStroke];
      console.log('📝 Total de strokes após adicionar:', newStrokes.length);
      console.log('📝 Último stroke adicionado:', newStrokes[newStrokes.length - 1]);
      onDrawingChange(newStrokes);
    }

    setIsTextMode(false);
    setTextInput('');
    setTextPosition(null);
    setSelectedTextStroke(null);
    setEditingTextId(null);
    setSelectedTextId(null);
    setShowTextControls(false);
  }, [activeStyle, drawingStrokes, onDrawingChange, fontSize, editingTextId, selectedTextStroke, effectiveActiveTool, textSettings]);

  // Alterar cor do texto selecionado - Usa a cor da caneta
  const changeTextColor = useCallback((color: string) => {
    console.log('🎨 changeTextColor chamada:', { 
      selectedTextId, 
      color, 
      drawingStrokesLength: drawingStrokes.length,
      selectedTextStroke: selectedTextStroke?.id,
      currentColor: selectedTextStroke?.style.color
    });
    
    if (selectedTextId) {
      console.log('🎨 Procurando stroke com ID:', selectedTextId);
      const updatedStrokes = drawingStrokes.map(stroke => {
        if (stroke.id === selectedTextId) {
          console.log('🎨 Encontrado stroke para atualizar:', stroke.id, 'cor atual:', stroke.style.color);
          const updatedStroke = {
            ...stroke,
            style: {
              ...stroke.style,
              color: color
            }
          };
          console.log('🎨 Stroke atualizado:', updatedStroke);
          return updatedStroke;
        }
        return stroke;
      });
      
      console.log('🎨 Strokes atualizados:', updatedStrokes.length);
      onDrawingChange(updatedStrokes);
      
      // Atualizar o selectedTextStroke localmente também
      const updatedSelectedStroke = updatedStrokes.find(stroke => stroke.id === selectedTextId);
      if (updatedSelectedStroke) {
        setSelectedTextStroke(updatedSelectedStroke);
        console.log('🎨 selectedTextStroke atualizado localmente');
      }
    } else if (textSettings?.active) {
      // Se não há texto selecionado mas a ferramenta de texto está ativa, atualizar as configurações
      console.log('🎨 Atualizando configurações de texto para cor:', color);
      // A cor será aplicada quando o próximo texto for criado
    }
  }, [selectedTextId, drawingStrokes, onDrawingChange, textSettings, selectedTextStroke]);

  // Alterar tamanho do texto selecionado
  const changeTextSize = useCallback((size: number) => {
    console.log('🔧 changeTextSize chamada:', { selectedTextId, size, drawingStrokesLength: drawingStrokes.length });
    
    // Sempre atualizar o tamanho da fonte no estado local
    setFontSize(size);
    
    if (selectedTextId) {
      const updatedStrokes = drawingStrokes.map(stroke => {
        if (stroke.id === selectedTextId) {
          console.log('🔧 Atualizando stroke:', stroke.id, 'com tamanho:', size);
          return {
            ...stroke,
            fontSize: size,
            style: {
              ...stroke.style,
              thickness: size
            }
          } as any;
        }
        return stroke;
      });
      console.log('🔧 Enviando strokes atualizados:', updatedStrokes.length);
      onDrawingChange(updatedStrokes);
      
      // Atualizar o selectedTextStroke localmente também
      const updatedSelectedStroke = updatedStrokes.find(stroke => stroke.id === selectedTextId);
      if (updatedSelectedStroke) {
        setSelectedTextStroke(updatedSelectedStroke);
        console.log('🔧 selectedTextStroke atualizado localmente');
      }
    } else if (isTextMode && textPosition) {
      // Mesmo sem texto selecionado, atualizar o tamanho para o próximo texto
      console.log('🔧 Atualizando tamanho para o próximo texto:', size);
      // Não é necessário fazer nada além de atualizar o fontSize no estado
    } else if (textSettings?.active) {
      // Se não há texto selecionado mas a ferramenta de texto está ativa, atualizar as configurações
      console.log('🔧 Atualizando configurações de texto para tamanho:', size);
      // O tamanho será aplicado quando o próximo texto for criado
    }
  }, [selectedTextId, drawingStrokes, onDrawingChange, isTextMode, textPosition, textSettings]);
  
  // Observar mudanças no currentStyle para atualizar o texto selecionado (estilo Excalidraw)
  useEffect(() => {
    console.log('🎨 useEffect currentStyle executado:', { 
      selectedTextId: !!selectedTextId, 
      currentStyle: !!currentStyle,
      currentStyleColor: currentStyle?.color,
      currentStyleThickness: currentStyle?.thickness
    });
    
    if (selectedTextId && currentStyle) {
      console.log('🎨 Texto selecionado - aplicando mudanças da barra de ferramentas:', {
        selectedTextId,
        color: currentStyle.color,
        thickness: currentStyle.thickness,
        selectedTextStroke: selectedTextStroke?.id
      });
      
      // Atualizar cor do texto selecionado quando a cor da caneta mudar
      console.log('🎨 Chamando changeTextColor com cor:', currentStyle.color);
      changeTextColor(currentStyle.color);
      
      // Atualizar tamanho do texto selecionado quando a espessura mudar
      console.log('🔧 Chamando changeTextSize com tamanho:', currentStyle.thickness);
      changeTextSize(currentStyle.thickness);
    } else {
      console.log('🎨 useEffect não executado:', { 
        selectedTextId: !!selectedTextId, 
        currentStyle: !!currentStyle 
      });
    }
  }, [currentStyle, selectedTextId, changeTextColor, changeTextSize, selectedTextStroke]);
  
  // Observar mudanças nas configurações de texto para atualizar o texto selecionado
  useEffect(() => {
    if (selectedTextId && textSettings?.active) {
      // Atualizar cor do texto selecionado quando a cor do texto independente mudar
      changeTextColor(textSettings.color);
    }
  }, [textSettings, selectedTextId, changeTextColor]);

  // Atualizar selectedTextStroke quando drawingStrokes mudar
  useEffect(() => {
    if (selectedTextId && drawingStrokes.length > 0) {
      const currentStroke = drawingStrokes.find(stroke => stroke.id === selectedTextId);
      if (currentStroke && currentStroke !== selectedTextStroke) {
        console.log('🔄 Atualizando selectedTextStroke:', currentStroke.id);
        setSelectedTextStroke(currentStroke);
      }
    }
  }, [drawingStrokes, selectedTextId, selectedTextStroke]);

  // Função changeTextSize já declarada acima
  
  // Observar mudanças no currentStyle para atualizar o tamanho do texto selecionado
  useEffect(() => {
    if (selectedTextId && currentStyle && (effectiveActiveTool === 'select' || effectiveActiveTool === 'text-select')) {
      // Usar a espessura da caneta multiplicada por 4 para o tamanho da fonte
      const textSize = Math.max(currentStyle.thickness * 4, 12);
      changeTextSize(textSize);
    }
  }, [currentStyle, selectedTextId, changeTextSize, effectiveActiveTool]);
  
  // Observar mudanças nas configurações de texto para atualizar o tamanho do texto selecionado
  useEffect(() => {
    if (selectedTextId && textSettings?.active) {
      // Atualizar tamanho do texto selecionado quando o tamanho do texto independente mudar
      changeTextSize(textSettings.size);
    }
  }, [textSettings, selectedTextId, changeTextSize]);

  // Auto-resize do textarea - SOLUÇÃO SIMPLES
  useEffect(() => {
    if (textAreaRef && isTextMode) {
      // Resize imediato e simples
      textAreaRef.style.height = 'auto';
      textAreaRef.style.height = `${Math.max(fontSize + 4, textAreaRef.scrollHeight)}px`;
    }
  }, [textInput, fontSize, textAreaRef, isTextMode]);

  // Forçar atualização do textarea quando o tamanho da fonte muda
  useEffect(() => {
    if (textAreaRef && isTextMode) {
      const newFontSize = textSettings?.active ? textSettings.size : Math.max(activeStyle.thickness * 4, 12);
      textAreaRef.style.fontSize = `${newFontSize}px`;
      console.log('🔧 Atualizando tamanho da fonte do textarea para:', newFontSize);
    }
  }, [textSettings?.size, activeStyle.thickness, isTextMode, textAreaRef]);

  // Redesenhar quando os traços mudarem
  useEffect(() => {
    console.log('DrawingOverlay3D: drawingStrokes changed, count:', drawingStrokes.length);
    // Sempre redesenhar se há traços, independente do estado
    if (drawingStrokes.length > 0) {
    redrawCanvas();
    }
  }, [drawingStrokes, redrawCanvas]);

  // Redesenhar quando hover muda
  useEffect(() => {
    // Redesenhar se estiver ativo OU se há textos para mostrar hover/seleção
    if (isActive || drawingStrokes.some(stroke => (stroke as any).text)) {
      redrawCanvas();
    }
  }, [hoveredTextId, selectedTextId, isActive, drawingStrokes, redrawCanvas]);

  // Event listener para tecla Delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' && selectedTextId) {
        console.log('🗑️ Delete pressionado - removendo texto:', selectedTextId);
        const updatedStrokes = drawingStrokes.filter(stroke => stroke.id !== selectedTextId);
        onDrawingChange(updatedStrokes);
        setSelectedTextId(null);
        setSelectedTextStroke(null);
        setShowTextControls(false);
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedTextId, drawingStrokes, onDrawingChange]);

  // Limpar seleção quando ferramenta mudar
  useEffect(() => {
    if (effectiveActiveTool !== 'select' && effectiveActiveTool !== 'text' && effectiveActiveTool !== 'text-select') {
      setSelectedTextId(null);
      setShowTextControls(false);
      setIsTextMode(false);
      console.log('🧹 Limpando seleção de texto - ferramenta mudou para:', effectiveActiveTool);
    }
  }, [effectiveActiveTool]);


  // Redesenhar quando o estilo atual mudar (para aplicar mudanças de cor/espessura imediatamente)
  useEffect(() => {
    // Redesenhar se estiver ativo OU se a ferramenta de texto independente estiver ativa
    const shouldRedraw = isActive || effectiveActiveTool === 'independent-text' || effectiveActiveTool === 'text-select' || textSettings?.active;
    
    if (shouldRedraw) {
      // Forçar redesenho imediato quando o estilo muda
      const timeoutId = setTimeout(() => {
        redrawCanvas();
      }, 10); // Pequeno delay para garantir que o estado foi atualizado
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeStyle, isActive, effectiveActiveTool, textSettings?.active, redrawCanvas]);

  // Garantir que textos sejam sempre renderizados
  useEffect(() => {
    const hasTextStrokes = drawingStrokes.some(stroke => (stroke as any).text);
    if (hasTextStrokes) {
      console.log('DrawingOverlay3D: Forçando redesenho para textos existentes');
      redrawCanvas();
    }
  }, [drawingStrokes, redrawCanvas]);

  // Sempre renderizar se houver traços OU se a ferramenta de texto estiver ativa
  const hasTextStrokes = drawingStrokes.some(stroke => (stroke as any).text);
  const shouldRender = isActive || 
                      drawingStrokes.length > 0 || 
                      hasTextStrokes ||
                      effectiveActiveTool === 'independent-text' || 
                      effectiveActiveTool === 'text-select' || 
                      textSettings?.active;
                      
  if (!shouldRender) {
    console.log('DrawingOverlay3D: Not rendering - conditions not met');
    return null;
  }
  
  // Determinar se deve permitir interação mesmo com mesa inativa (caso de texto independente)
  const allowInteraction = isActive || effectiveActiveTool === 'independent-text' || effectiveActiveTool === 'text-select' || textSettings?.active;
  
  const isIndependentTextActive = effectiveActiveTool === 'independent-text' || textSettings?.active;
  const isTextSelectActive = effectiveActiveTool === 'text-select';
  const isTabletTextActive = false; // Texto removido da mesa digitalizadora
  
  console.log('DrawingOverlay3D: Rendering - active:', isActive, 'independent text:', isIndependentTextActive, 'tablet text:', isTabletTextActive, 'strokes:', drawingStrokes.length);
  console.log('DrawingOverlay3D: textSettings:', textSettings);
  console.log('DrawingOverlay3D: effectiveActiveTool:', effectiveActiveTool);

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 ${allowInteraction ? 'pointer-events-auto' : 'pointer-events-none'} ${className}`}
      style={{ 
        zIndex: allowInteraction ? 1000 : 10, // Aumentado para ficar acima do sólido 3D
        touchAction: 'none',
        overflow: 'hidden' // Impede que elementos saiam da tela
      }}
      onMouseMove={handleMouseMove}
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${
          allowInteraction
            ? effectiveActiveTool === 'select' || effectiveActiveTool === 'text-select'
              ? 'cursor-pointer' 
              : effectiveActiveTool === 'independent-text'
                ? 'cursor-text'
                : 'cursor-crosshair' 
            : 'cursor-default'
        }`}
        onPointerDown={allowInteraction ? startDrawing : undefined}
        onPointerMove={allowInteraction ? draw : undefined}
        onPointerUp={allowInteraction ? stopDrawing : undefined}
        onPointerLeave={allowInteraction ? stopDrawing : undefined}
        style={{ 
          touchAction: 'none',
          pointerEvents: allowInteraction ? 'auto' : 'none',
          opacity: 1, // Sempre opaco para garantir interação
          cursor: effectiveActiveTool === 'select' || effectiveActiveTool === 'text-select'
            ? 'pointer' 
            : effectiveActiveTool === 'independent-text'
              ? 'text' 
              : 'crosshair'
        }}
      />
      
      {/* Indicador de pressão */}
      {isDrawing && isActive && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
          Pressão: {Math.round(currentPressure * 100)}%
        </div>
      )}
      

      {/* Indicador de edição de texto */}
      {editingTextId && (
        <div className="absolute top-4 right-4 bg-orange-500/80 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          Editando Texto
        </div>
      )}

      {/* Input de Texto - Simplificado */}
      {isTextMode && textPosition && (
        <div 
          className="absolute bg-transparent border-none outline-none"
          style={{
            left: Math.min(textPosition.x, window.innerWidth - 620), // Evita que saia da tela horizontalmente
            top: Math.min(textPosition.y, window.innerHeight - 100), // Evita que saia da tela verticalmente
            fontSize: `${textSettings?.active ? textSettings.size : Math.max(activeStyle.thickness * 4, 12)}px`, // Usar configurações de texto independentes
            fontFamily: textSettings?.active ? textSettings.fontFamily : '"Virgil", "Cascadia", "Segoe Print", "Bradley Hand", "Chalkboard SE", "Comic Sans MS", cursive',
            color: textSettings?.active ? textSettings.color : activeStyle.color, // Usar cor das configurações de texto
            textShadow: activeStyle.color === '#ffffff' || activeStyle.color === '#FFFFFF' 
              ? '1px 1px 2px rgba(0,0,0,0.8)' 
              : 'none'
          }}
        >
          <textarea
            ref={(el) => setTextAreaRef(el)}
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
            }}
            placeholder="Digite aqui..."
            className="bg-transparent border-none outline-none resize-both overflow-hidden"
            style={{
              fontSize: `${textSettings?.active ? textSettings.size : Math.max(activeStyle.thickness * 4, 12)}px`, // Usar configurações de texto independentes
              fontFamily: textSettings?.active ? textSettings.fontFamily : '"Virgil", "Cascadia", "Segoe Print", "Bradley Hand", "Chalkboard SE", "Comic Sans MS", cursive',
              color: textSettings?.active ? textSettings.color : activeStyle.color, // Usar cor das configurações de texto
              minWidth: '300px',
              minHeight: `${Math.max(activeStyle.thickness * 4, 12) + 4}px`,
              lineHeight: '1.2',
              width: '500px',
              maxWidth: '600px',
              padding: '4px',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              resize: 'both',
              wordBreak: 'normal',
              whiteSpace: 'pre-wrap'
            }}
            onKeyDown={(e) => {
              // Enter sozinho confirma o texto
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addText(textInput, textPosition.x, textPosition.y);
                return;
              }
              
              // Shift+Enter adiciona quebra de linha - SOLUÇÃO SIMPLES
              if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                console.log('🔄 Shift+Enter detectado, texto atual:', textInput);
                // Adicionar quebra de linha diretamente
                const newText = textInput + '\n';
                console.log('🔄 Novo texto:', newText);
                setTextInput(newText);
                return;
              }
              
              // Escape cancela
              if (e.key === 'Escape') {
                e.preventDefault();
                setIsTextMode(false);
                setTextInput('');
                setTextPosition(null);
                setSelectedTextStroke(null);
                setEditingTextId(null);
                setSelectedTextId(null);
                setShowTextControls(false);
                return;
              }
            }}
            onBlur={() => {
              if (textInput.trim()) {
                addText(textInput, textPosition.x, textPosition.y);
              } else {
                setIsTextMode(false);
                setTextInput('');
                setTextPosition(null);
                setSelectedTextStroke(null);
                setEditingTextId(null);
                setSelectedTextId(null);
                setShowTextControls(false);
              }
            }}
            autoFocus
            autoComplete="off"
            spellCheck="false"
            wrap="soft"
          />
        </div>
      )}

      {/* Caixa de Seleção Estilo Excalidraw */}
      {selectedTextId && selectedTextStroke && (
        <div 
          className="absolute pointer-events-none"
          style={{
            left: selectedTextStroke.points[0].x - 10,
            top: selectedTextStroke.points[0].y - 10,
            width: '320px',
            height: `${Math.max(fontSize * 1.2, 20) + 20}px`,
            border: '2px solid #007acc',
            borderRadius: '4px',
            backgroundColor: 'rgba(0, 122, 204, 0.1)',
            zIndex: 1000
          }}
        >
          {/* Handles de redimensionamento estilo Excalidraw */}
          <div 
            className="absolute w-2 h-2 bg-blue-500 border border-white"
            style={{
              right: '-4px',
              bottom: '-4px',
              cursor: 'nw-resize'
            }}
          />
          <div 
            className="absolute w-2 h-2 bg-blue-500 border border-white"
            style={{
              right: '-4px',
              top: '-4px',
              cursor: 'ne-resize'
            }}
          />
          <div 
            className="absolute w-2 h-2 bg-blue-500 border border-white"
            style={{
              left: '-4px',
              top: '-4px',
              cursor: 'nw-resize'
            }}
          />
          <div 
            className="absolute w-2 h-2 bg-blue-500 border border-white"
            style={{
              left: '-4px',
              bottom: '-4px',
              cursor: 'ne-resize'
            }}
          />
            </div>
          )}

      {/* Removido painel flutuante - usar controles da barra de ferramentas */}
    </div>
  );
}
