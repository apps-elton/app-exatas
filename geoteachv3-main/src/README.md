# Mesa Digitalizadora - Arquitetura Modular

## 📁 Estrutura de Arquivos

```
src/
├── types/
│   └── drawing.ts          # Tipos TypeScript
├── constants/
│   └── drawing.ts          # Configurações centralizadas
├── utils/
│   ├── geometry.ts         # Funções de geometria
│   └── smoothing.ts        # Algoritmo de suavização
├── rendering/
│   └── DrawingRenderer.ts  # Classe de renderização
├── hooks/
│   └── useDrawingCanvas.ts # Hook de estado
├── components/
│   └── DrawingCanvas.tsx   # Componente React
└── examples/
    └── DrawingExample.tsx  # Exemplo de uso
```

## 🎯 Características

### ✅ **Arquitetura Limpa**
- **Separação de responsabilidades** - cada arquivo tem uma função específica
- **Tipos bem definidos** - TypeScript para segurança
- **Funções puras** - sem efeitos colaterais
- **Performance otimizada** - requestAnimationFrame + throttling

### ✅ **Performance**
- **60 FPS** - target de performance
- **Throttling** - 16ms entre frames
- **Filtro de pontos** - remove pontos muito próximos
- **Memory management** - limite de pontos por stroke

### ✅ **Funcionalidades**
- **4 Ferramentas** - pen, pencil, highlighter, eraser
- **Pressão responsiva** - variação natural
- **Suavização** - algoritmo otimizado
- **Texturas** - smooth, rough, marker
- **Atalhos** - Ctrl+Z (undo), Delete (clear)

## 🚀 Como Usar

```tsx
import { DrawingCanvas } from './components/DrawingCanvas';
import { ToolType } from './types/drawing';

const MyComponent = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentThickness, setCurrentThickness] = useState(2);

  return (
    <DrawingCanvas
      isActive={isActive}
      currentTool={currentTool}
      currentColor={currentColor}
      currentThickness={currentThickness}
      smoothingFactor={0.8}
      className="w-full h-full"
    />
  );
};
```

## 🔧 Configurações

### **Ferramentas**
```typescript
const TOOLS = {
  pen: { opacity: 1.0, thickness: 1.0, texture: 'smooth' },
  pencil: { opacity: 0.75, thickness: 1.0, texture: 'rough' },
  highlighter: { opacity: 0.3, thickness: 5.0, texture: 'marker' },
  eraser: { opacity: 1.0, thickness: 3.0, texture: 'smooth' }
};
```

### **Performance**
```typescript
const PERFORMANCE = {
  TARGET_FPS: 60,
  FRAME_TIME: 1000 / 60, // ~16ms
  MIN_POINT_DISTANCE: 2,
  MAX_POINTS_PER_STROKE: 10000
};
```

## 🎨 Exemplo Completo

Veja `examples/DrawingExample.tsx` para um exemplo completo com toolbar e controles.

## 📝 Notas Técnicas

- **Canvas 2D** - renderização otimizada
- **Pointer Events** - suporte a caneta digital
- **ResizeObserver** - redimensionamento automático
- **RequestAnimationFrame** - renderização suave
- **Memory Management** - prevenção de vazamentos

