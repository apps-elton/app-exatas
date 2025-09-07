import { GeometryParams, GeometryProperties } from '@/types/geometry';

export class GeometryCalculator {
  static calculateProperties(params: GeometryParams): GeometryProperties {
    switch (params.type) {
      case 'pyramid':
        return this.calculatePyramidProperties(params);
      case 'cylinder':
        return this.calculateCylinderProperties(params);
      case 'cone':
        return this.calculateConeProperties(params);
      case 'cube':
        return this.calculateCubeProperties(params);
      case 'sphere':
        return this.calculateSphereProperties(params);
      case 'prism':
        return this.calculatePrismProperties(params);
      case 'tetrahedron':
        return this.calculateTetrahedronProperties(params);
      case 'octahedron':
        return this.calculateOctahedronProperties(params);
      case 'dodecahedron':
        return this.calculateDodecahedronProperties(params);
      case 'icosahedron':
        return this.calculateIcosahedronProperties(params);
      default:
        return { volume: 0 };
    }
  }

  private static calculatePyramidProperties(params: GeometryParams): GeometryProperties {
    const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
    const n = numSides;
    const s = baseEdgeLength;
    const h = height;

    // Base properties
    const baseArea = (n * s * s) / (4 * Math.tan(Math.PI / n));
    const baseApothem = s / (2 * Math.tan(Math.PI / n));
    
    // Radii
    const inscribedRadius = baseApothem;
    const circumscribedRadius = s / (2 * Math.sin(Math.PI / n));
    
    // Lateral properties 
    // CORREÇÃO: O apótema da pirâmide vai do vértice da pirâmide ao ponto médio de uma aresta da base
    // Primeiro calculamos a distância do centro da base ao ponto médio de uma aresta (que é o apótema da base)
    // Depois usamos Pitágoras: apótema_da_pirâmide² = altura² + apótema_base²
    const lateralApothem = Math.sqrt(h * h + baseApothem * baseApothem);
    
    // A área lateral é o perímetro da base vezes o apótema da pirâmide dividido por 2
    const perimeter = n * s;
    const lateralArea = (perimeter * lateralApothem) / 2;
    
    const totalArea = baseArea + lateralArea;
    const volume = (baseArea * h) / 3;

    return {
      baseArea,
      lateralArea,
      totalArea,
      volume,
      apothem: baseApothem,
      lateralApothem,
      inscribedRadius,
      circumscribedRadius
    };
  }

  private static calculateCylinderProperties(params: GeometryParams): GeometryProperties {
    const { height = 4, radius = 2 } = params;
    const r = radius;
    const h = height;

    const baseArea = Math.PI * r * r;
    const lateralArea = 2 * Math.PI * r * h;
    const totalArea = 2 * baseArea + lateralArea;
    const volume = baseArea * h;

    return {
      baseArea,
      lateralArea,
      totalArea,
      volume
    };
  }

  private static calculateConeProperties(params: GeometryParams): GeometryProperties {
    const { height = 4, radius = 2 } = params;
    const r = radius;
    const h = height;

    const baseArea = Math.PI * r * r;
    const slantHeight = Math.sqrt(r * r + h * h);
    const lateralArea = Math.PI * r * slantHeight;
    const totalArea = baseArea + lateralArea;
    const volume = (baseArea * h) / 3;

    return {
      baseArea,
      lateralArea,
      totalArea,
      volume
    };
  }

  private static calculateCubeProperties(params: GeometryParams): GeometryProperties {
    const { sideLength = 2 } = params;
    const s = sideLength;

    const baseArea = s * s;
    const lateralArea = 4 * s * s;
    const totalArea = 6 * s * s;
    const volume = s * s * s;
    
    // CORREÇÃO: Para um cubo:
    // - Raio inscrito = s/2 (raio da esfera inscrita que toca o centro de todas as faces)
    // - Raio circunscrito = (s*√3)/2 (raio da esfera que passa por todos os vértices)
    const inscribedRadius = s / 2;  // Distância do centro do cubo ao centro de uma face
    const circumscribedRadius = (s * Math.sqrt(3)) / 2;  // Diagonal espacial / 2

    return {
      baseArea,
      lateralArea,
      totalArea,
      volume,
      inscribedRadius,
      circumscribedRadius
    };
  }

  private static calculateSphereProperties(params: GeometryParams): GeometryProperties {
    const { radius = 2 } = params;
    const r = radius;

    const surfaceArea = 4 * Math.PI * r * r;
    const volume = (4 / 3) * Math.PI * r * r * r;

    return {
      surfaceArea,
      volume
    };
  }

  private static calculatePrismProperties(params: GeometryParams): GeometryProperties {
    const { height = 4, baseEdgeLength = 2, numSides = 5 } = params;
    const n = numSides;
    const s = baseEdgeLength;
    const h = height;

    const baseArea = (n * s * s) / (4 * Math.tan(Math.PI / n));
    const lateralArea = n * s * h;
    const totalArea = 2 * baseArea + lateralArea;
    const volume = baseArea * h;
    const apothem = s / (2 * Math.tan(Math.PI / n));
    
    // Radii - Para prisma, o raio inscrito é o apótema da base (distância perpendicular do centro da base ao meio de uma aresta)
    const inscribedRadius = apothem; // Apótema da base: distância perpendicular do centro da base ao meio de uma aresta
    const circumscribedRadius = s / (2 * Math.sin(Math.PI / n)); // Raio circunscrito da base

    return {
      baseArea,
      lateralArea,
      totalArea,
      volume,
      apothem,
      inscribedRadius,
      circumscribedRadius
    };
  }

  private static calculateTetrahedronProperties(params: GeometryParams): GeometryProperties {
    const { sideLength = 2 } = params;
    const a = sideLength;
    
    // Altura do tetraedro regular
    const height = a * Math.sqrt(2/3);
    
    // Área da base (triângulo equilátero)
    const baseArea = (Math.sqrt(3) / 4) * a * a;
    
    // Área lateral (3 faces triangulares)
    const lateralArea = 3 * baseArea;
    
    // Área total
    const totalArea = 4 * baseArea;
    
    // Volume
    const volume = (baseArea * height) / 3;
    
    // Apótema da base (triângulo equilátero)
    const apothem = a / (2 * Math.sqrt(3));
    
    // Apótema lateral correto (do vértice superior ao meio de uma aresta da base)
    const lateralApothem = Math.sqrt(height * height + apothem * apothem);
    
    // Raios
    const inscribedRadius = a / (2 * Math.sqrt(6)); // Raio inscrito correto do tetraedro
    const circumscribedRadius = a * Math.sqrt(6) / 4; // Raio da esfera circunscrita

    return {
      baseArea,
      lateralArea,
      totalArea,
      volume,
      apothem,
      lateralApothem,
      inscribedRadius,
      circumscribedRadius
    };
  }

  private static calculateOctahedronProperties(params: GeometryParams): GeometryProperties {
    const { sideLength = 2 } = params;
    const a = sideLength;
    
    // Área de uma face triangular (triângulo equilátero)
    const faceArea = (Math.sqrt(3) / 4) * a * a;
    
    // 8 faces triangulares
    const totalArea = 8 * faceArea;
    
    // Volume do octaedro regular
    const volume = (Math.sqrt(2) / 3) * a * a * a;
    
    // Raios inscrito e circunscrito
    const inscribedRadius = a / Math.sqrt(6);
    const circumscribedRadius = a / Math.sqrt(2);
    
    return {
      totalArea,
      volume,
      inscribedRadius,
      circumscribedRadius
    };
  }

  private static calculateDodecahedronProperties(params: GeometryParams): GeometryProperties {
    const { sideLength = 2 } = params;
    const a = sideLength;
    
    // Área de uma face pentagonal regular
    const faceArea = (Math.sqrt(25 + 10 * Math.sqrt(5)) / 4) * a * a;
    
    // 12 faces pentagonais
    const totalArea = 12 * faceArea;
    
    // Volume do dodecaedro regular
    const volume = ((15 + 7 * Math.sqrt(5)) / 4) * a * a * a;
    
    // Raios inscrito e circunscrito
    const phi = (1 + Math.sqrt(5)) / 2; // Número áureo
    const inscribedRadius = (a * (Math.sqrt(250 + 110 * Math.sqrt(5)))) / 20;
    const circumscribedRadius = (a * (Math.sqrt(3) * (1 + Math.sqrt(5)))) / 4;
    
    return {
      totalArea,
      volume,
      inscribedRadius,
      circumscribedRadius
    };
  }

  private static calculateIcosahedronProperties(params: GeometryParams): GeometryProperties {
    const { sideLength = 2 } = params;
    const a = sideLength;
    
    // Área de uma face triangular (triângulo equilátero)
    const faceArea = (Math.sqrt(3) / 4) * a * a;
    
    // 20 faces triangulares
    const totalArea = 20 * faceArea;
    
    // Volume do icosaedro regular
    const volume = (5 * (3 + Math.sqrt(5)) / 12) * a * a * a;
    
    // Raios inscrito e circunscrito
    const phi = (1 + Math.sqrt(5)) / 2; // Número áureo
    const inscribedRadius = (a * phi * phi) / (2 * Math.sqrt(3));
    const circumscribedRadius = (a * phi) / (2 * Math.sin(Math.PI / 5));
    
    return {
      totalArea,
      volume,
      inscribedRadius,
      circumscribedRadius
    };
  }
}

export function formatNumber(num: number): string {
  return num.toFixed(2);
}