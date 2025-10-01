# 🎨 Mesa Digitalizadora para Geometria Espacial

## 📋 Visão Geral

A Mesa Digitalizadora é um sistema completo de desenho 2D sobreposto ao seu aplicativo de geometria espacial 3D. Ela oferece ferramentas profissionais de desenho, formas geométricas precisas e otimizações de performance para uma experiência fluida.

## 🚀 Funcionalidades Implementadas

### ✅ **Ferramentas de Desenho (6 tipos)**
- **Caneta** (P): Traço suave e preciso
- **Lápis** (L): Textura de grafite
- **Marcador** (M): Traço grosso e translúcido
- **Técnica** (T): Caneta fina para desenho técnico
- **Marca-texto** (H): Destacar conceitos
- **Borracha** (E): Apagar traços

### ✅ **Ferramentas Geométricas (6 formas)**
- **Retângulo** (R): Arrastar para criar retângulo
- **Quadrado** (Q): Retângulo com proporção 1:1
- **Círculo** (C): Arrastar do centro para definir raio
- **Reta** (-): Linha reta entre dois pontos
- **Reta Tracejada**: Linha tracejada
- **Seta** (A): Seta para indicar direções/vetores

### ✅ **Sistema de Grade e Snap**
- **Grade** (Ctrl+G): Grade de referência com espaçamento configurável
- **Snap** (Ctrl+Shift+G): Magnetizar pontos à grade
- **Medições em tempo real**: Comprimento de linhas em pixels

### ✅ **Otimizações de Performance**
- **Renderização otimizada**: Throttle de 16ms com `requestAnimationFrame`
- **Filtro de pontos**: Remove pontos < 2px de distância
- **Suavização adaptativa**: Menos suavização para traços rápidos
- **Detecção de pressão melhorada**: `Math.max(0.3, Math.min(1.0, e.pressure)) || 0.7`

### ✅ **Sistema de Histórico**
- **Desfazer/Refazer**: Histórico completo de traços
- **Limpar**: Apagar todos os traços
- **Persistência**: Mantém histórico durante a sessão

### ✅ **Atalhos de Teclado**
- **Ferramentas**: P, L, M, T, H, E, R, Q, C, -, A
- **Controles**: Ctrl+Z, Ctrl+Y, Ctrl+G, Ctrl+Shift+G, Delete

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   ├── DrawingOverlay3D.tsx      # Canvas principal de desenho
│   ├── ToolBar.tsx               # Barra de ferramentas completa
│   └── GeometryTeachingApp.tsx   # Exemplo de integração
├── hooks/
│   └── useTabletHistory.tsx      # Hook para histórico
└── types/
    └── geometry.ts               # Tipos TypeScript
```

## 🔧 Como Usar

### 1. **Importar Componentes**

```tsx
import DrawingOverlay3D from './components/DrawingOverlay3D';
import { ToolBar } from './components/ToolBar';
import { useTabletHistory } from './hooks/useTabletHistory';
```

### 2. **Configurar Estados**

```tsx
const [isTabletActive, setIsTabletActive] = useState(false);
const [drawingStrokes, setDrawingStrokes] = useState<DrawingStroke[]>([]);
const [tabletStyle, setTabletStyle] = useState<DrawingStyle>({
  color: '#ffffff',
  thickness: 2,
  opacity: 1,
  pressure: true,
  smoothing: 0.8,
  fontFamily: 'Poppins'
});
```

### 3. **Renderizar Componentes**

```tsx
<div className="relative w-full h-screen">
  {/* Seu conteúdo 3D */}
  <div className="absolute inset-0">
    {/* Three.js scene aqui */}
  </div>
  
  {/* Overlay de desenho */}
  <DrawingOverlay3D
    isActive={isTabletActive}
    drawingStrokes={drawingStrokes}
    onDrawingChange={setDrawingStrokes}
    currentStyle={tabletStyle}
    currentTool={tabletTool}
    activeTool={tabletTool.type}
  />
</div>
```

## 🎯 Casos de Uso para Professores

### **1. Explicando Vértices e Arestas**
- Use a **grade** para desenhos precisos
- **Ferramenta Reta** para conectar vértices
- **Seta** para indicar direções
- **Marca-texto** para destacar conceitos

### **2. Projeções e Seções**
- **Ferramenta Círculo** para bases circulares
- **Retângulo** para seções retangulares
- **Reta Tracejada** para linhas auxiliares
- **Caneta Técnica** para precisão

### **3. Vetores Normais**
- **Seta** para indicar direção do vetor
- **Círculo** para mostrar a base
- **Marca-texto** para anotações

### **4. Anotações e Conceitos**
- **Marcador** para destacar áreas
- **Lápis** para anotações rápidas
- **Caneta** para texto formal
- **Borracha** para correções

## ⚙️ Configurações Recomendadas

### **Desenho Técnico**
```tsx
const technicalConfig = {
  tool: 'technical',
  thickness: 0.5,
  opacity: 1,
  smoothing: 0.9,
  showGrid: true,
  snapEnabled: true
};
```

### **Anotações Livres**
```tsx
const freehandConfig = {
  tool: 'pen',
  thickness: 2,
  opacity: 0.8,
  smoothing: 0.7,
  pressure: true
};
```

### **Destacar Conceitos**
```tsx
const highlightConfig = {
  tool: 'highlighter',
  thickness: 5,
  opacity: 0.3,
  color: '#ffff00'
};
```

## 🔗 Integração com Three.js

### **Estrutura de Camadas**
```tsx
<div className="relative w-full h-screen">
  {/* Camada 3D (fundo) */}
  <div className="absolute inset-0 z-0">
    <ThreeJSComponent />
  </div>
  
  {/* Camada de desenho (sobreposta) */}
  <div className="absolute inset-0 z-10">
    <DrawingOverlay3D />
  </div>
</div>
```

### **Sincronização de Cores**
```tsx
// Sincronizar cor da mesa com tema do 3D
const syncColors = (theme: 'light' | 'dark') => {
  const colors = theme === 'light' 
    ? ['#000000', '#333333', '#666666']
    : ['#ffffff', '#cccccc', '#999999'];
  
  setTabletStyle(prev => ({
    ...prev,
    color: colors[0]
  }));
};
```

## 🎨 Personalização

### **Cores Personalizadas**
```tsx
const customColors = [
  '#ff0000', '#00ff00', '#0000ff',  // RGB
  '#ffff00', '#ff00ff', '#00ffff',  // CMY
  '#000000', '#ffffff', '#808080'   // Grayscale
];
```

### **Espessuras Personalizadas**
```tsx
const thicknessRange = {
  min: 0.5,
  max: 20,
  step: 0.5,
  default: 2
};
```

### **Fontes Personalizadas**
```tsx
const fontOptions = [
  'Poppins', 'Inter', 'Roboto', 'Arial', 'Helvetica'
];
```

## 🚀 Próximos Passos (Fase 2)

### **Ferramentas Avançadas**
- [ ] Régua virtual
- [ ] Transferidor
- [ ] Biblioteca de formas 3D
- [ ] Templates de desenho

### **Exportação**
- [ ] Exportar como imagem (PNG/JPG)
- [ ] Exportar como PDF
- [ ] Exportar como SVG

### **Recursos Adicionais**
- [ ] Sistema de camadas
- [ ] Texto com LaTeX
- [ ] Animações de desenho
- [ ] Colaboração em tempo real

## 🐛 Solução de Problemas

### **Performance Lenta**
- Reduza a espessura máxima
- Diminua a suavização
- Desative a pressão se não necessário

### **Traços Não Aparecem**
- Verifique se `isTabletActive` está `true`
- Confirme se o canvas está visível
- Verifique se há erros no console

### **Grade Não Aparece**
- Pressione `Ctrl+G` para ativar
- Verifique se `showGrid` está `true`
- Confirme se o z-index está correto

## 📚 Recursos Adicionais

- **Documentação Three.js**: https://threejs.org/docs/
- **Canvas API**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **React Hooks**: https://reactjs.org/docs/hooks-intro.html
- **TypeScript**: https://www.typescriptlang.org/docs/

## 🤝 Contribuição

Para contribuir com melhorias:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Teste thoroughly
5. Submeta um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

---

**Desenvolvido com ❤️ para educação matemática**

