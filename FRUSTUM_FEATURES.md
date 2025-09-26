# Funcionalidades de Troncos (Frustum)

Este documento descreve as funcionalidades implementadas para troncos de cone e pirâmide no GeoTeach.

## 1. Tronco de Cone (Frustum de Cone)

### Características:
- **Geometria**: Cone completo que pode ser cortado e separado em duas partes
- **Controles**:
  - Altura do corte: 10% a 90% da altura total
  - Raio do cone: 0.5 a 3.0
  - Parte superior visível e móvel
  - Partes separáveis
  - **Cores individuais** para cada parte
  - **Opacidades individuais** para cada parte
  - **Alturas individuais** para cada parte

### Implementação Técnica:
```typescript
// Cone completo
const createFullCone = (radius, height, radialSegments = 32) => {
  return new THREE.ConeGeometry(radius, height, radialSegments);
};

// Parte inferior do cone cortado (tronco)
const createConeBottom = (radius, cutHeight, totalHeight, radialSegments = 32) => {
  const bottomHeight = totalHeight - cutHeight;
  const topRadius = (radius * cutHeight) / totalHeight;
  
  return new THREE.CylinderGeometry(
    topRadius,    // raio superior (menor)
    radius,       // raio inferior (maior)
    bottomHeight, // altura do tronco
    radialSegments,
    1,
    false
  );
};

// Parte superior do cone cortado
const createConeTop = (radius, cutHeight, totalHeight, radialSegments = 32) => {
  const topRadius = (radius * cutHeight) / totalHeight;
  return new THREE.ConeGeometry(topRadius, cutHeight, radialSegments);
};
```

## 2. Tronco de Pirâmide (Frustum de Pirâmide)

### Características:
- **Geometria**: Pirâmide completa que pode ser cortada e separada em duas partes
- **Suporte a diferentes bases**: 3 a 12 lados
- **Controles**:
  - Altura do corte: 10% a 90% da altura total
  - Raio da base: 0.5 a 3.0
  - Número de lados da base: 3 a 12
  - Parte superior visível e móvel
  - Partes separáveis
  - **Cores individuais** para cada parte
  - **Opacidades individuais** para cada parte
  - **Alturas individuais** para cada parte

### Implementação Técnica:
```typescript
// Pirâmide completa
const createFullPyramid = (baseSides, baseRadius, height) => {
  const geometry = new THREE.BufferGeometry();
  // Vértice do ápice
  // Vértices da base
  // Faces laterais
  // Face da base
  return geometry;
};

// Parte inferior da pirâmide cortada (tronco)
const createPyramidBottom = (baseSides, baseRadius, cutHeight, totalHeight) => {
  const bottomHeight = totalHeight - cutHeight;
  const topRadius = (baseRadius * cutHeight) / totalHeight;
  // Criar vértices da base inferior e superior
  // Conectar com faces trapezoidais
  return geometry;
};

// Parte superior da pirâmide cortada
const createPyramidTop = (baseSides, baseRadius, cutHeight, totalHeight) => {
  const topRadius = (baseRadius * cutHeight) / totalHeight;
  // Vértice do ápice
  // Vértices da base
  // Faces laterais
  return geometry;
};
```

## 3. Funcionalidades Interativas

### Parte Superior Móvel:
- A parte superior cortada pode ser separada do tronco
- Clique na parte superior para alternar entre separada/ligada
- Quando separada, pode ser movida independentemente

### Controles de Visibilidade:
- **Parte Superior Visível**: Mostra/oculta a parte cortada
- **Parte Superior Móvel**: Permite movimento da parte superior
- **Partes Separáveis**: Habilita/desabilita a separação

### Cores Individuais:
- **Cor da Parte Inferior**: Seletor de cor para o tronco
- **Cor da Parte Superior**: Seletor de cor para a parte cortada
- Cores independentes para cada parte

### Opacidades Individuais:
- **Opacidade da Parte Inferior**: 10% a 100%
- **Opacidade da Parte Superior**: 10% a 100%
- Controle independente para cada parte

### Alturas Individuais:
- **Altura da Parte Inferior**: Controle da altura do tronco
- **Altura da Parte Superior**: Controle da altura da parte cortada
- Sliders independentes para cada parte

## 4. Parâmetros de Configuração

### Novos Tipos de Geometria:
```typescript
export type GeometryType =
  | 'cone-frustum'     // Tronco de cone
  | 'pyramid-frustum'; // Tronco de pirâmide
```

### Novos Parâmetros:
```typescript
interface GeometryParams {
  // Parâmetros para troncos
  frustumCutHeight?: number;     // Altura do corte (0% a 90%)
  frustumBaseSides?: number;     // Número de lados da base da pirâmide
  frustumSeparable?: boolean;    // Se as partes podem ser separadas
  frustumTopVisible?: boolean;  // Se a parte superior cortada é visível
  frustumTopMovable?: boolean;  // Se a parte superior pode ser movida
  // Cores individuais para cada parte
  frustumBottomColor?: string;   // Cor da parte inferior
  frustumTopColor?: string;      // Cor da parte superior
  // Opacidades individuais
  frustumBottomOpacity?: number; // Opacidade da parte inferior
  frustumTopOpacity?: number;    // Opacidade da parte superior
  // Alturas individuais
  frustumBottomHeight?: number;  // Altura da parte inferior
  frustumTopHeight?: number;     // Altura da parte superior
}
```

## 5. Interface do Usuário

### Painel de Controle:
- **Altura do Corte**: Slider de 10% a 90%
- **Raio do Cone**: Slider de 0.5 a 3.0
- **Lados da Base**: Slider de 3 a 12 (apenas pirâmide)
- **Cores Individuais**: Seletores de cor para cada parte
- **Opacidades Individuais**: Sliders de 10% a 100% para cada parte
- **Alturas Individuais**: Sliders para controlar altura de cada parte
- **Switches**: Visibilidade, Movimento e Separação

### Interação:
- Clique na parte superior para separar/mover
- Controles em tempo real via sliders
- Visualização imediata das mudanças
- Cores e opacidades independentes

## 6. Casos de Uso Educacionais

### Para Professores:
1. **Demonstração de Volume**: Mostrar como o volume muda com diferentes alturas de corte
2. **Geometria Descritiva**: Visualizar seções de cones e pirâmides
3. **Cálculos de Área**: Demonstrar áreas lateral e total
4. **Proporções**: Mostrar relações entre raios e alturas
5. **Visualização de Partes**: Diferentes cores para identificar partes

### Para Estudantes:
1. **Aprendizado Interativo**: Manipular parâmetros e ver resultados
2. **Visualização 3D**: Compreender formas tridimensionais
3. **Experimentação**: Testar diferentes configurações
4. **Compreensão Espacial**: Desenvolver intuição geométrica
5. **Identificação de Partes**: Cores diferentes para distinguir partes

## 7. Exemplo de Uso

```typescript
// Configuração de um tronco de cone
const coneFrustumParams: GeometryParams = {
  type: 'cone-frustum',
  height: 4,
  radius: 2,
  frustumCutHeight: 0.5, // 50% da altura
  frustumTopVisible: true,
  frustumTopMovable: true,
  frustumSeparable: true,
  // Cores individuais
  frustumBottomColor: '#3b82f6', // Azul para o tronco
  frustumTopColor: '#ef4444',    // Vermelho para a parte cortada
  // Opacidades individuais
  frustumBottomOpacity: 0.8,
  frustumTopOpacity: 0.6,
  // Alturas individuais
  frustumBottomHeight: 2.0,
  frustumTopHeight: 2.0
};

// Configuração de um tronco de pirâmide
const pyramidFrustumParams: GeometryParams = {
  type: 'pyramid-frustum',
  height: 4,
  radius: 2,
  frustumBaseSides: 6, // Hexagonal
  frustumCutHeight: 0.6, // 60% da altura
  frustumTopVisible: true,
  frustumTopMovable: true,
  frustumSeparable: true,
  // Cores individuais
  frustumBottomColor: '#10b981', // Verde para o tronco
  frustumTopColor: '#f59e0b',    // Amarelo para a parte cortada
  // Opacidades individuais
  frustumBottomOpacity: 0.9,
  frustumTopOpacity: 0.7,
  // Alturas individuais
  frustumBottomHeight: 1.6,
  frustumTopHeight: 2.4
};
```

## 8. Benefícios Educacionais

1. **Visualização Clara**: Formas complexas em 3D
2. **Manipulação Interativa**: Controles intuitivos
3. **Flexibilidade**: Múltiplas configurações
4. **Aprendizado Ativo**: Experimentação direta
5. **Compreensão Profunda**: Relação entre parâmetros e forma
6. **Identificação Visual**: Cores diferentes para distinguir partes
7. **Controle Granular**: Opacidades e alturas individuais
8. **Separação de Partes**: Demonstração clara de como os troncos são formados

Esta implementação permite uma experiência educacional rica e interativa para o ensino de geometria espacial, especialmente para conceitos de troncos e suas propriedades, com controle total sobre cada parte individual.