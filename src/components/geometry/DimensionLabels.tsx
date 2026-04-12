import { Text } from '@react-three/drei';
import { GeometryParams } from '@/types/geometry';
import { useTranslation } from 'react-i18next';

interface DimensionLabelsProps {
  params: GeometryParams;
  showDimensions: boolean;
}

export function DimensionLabels({ params, showDimensions }: DimensionLabelsProps) {
  const { t } = useTranslation();
  if (!showDimensions) return null;

  const height = params.height || 4;
  const radius = params.radius || 2;
  const sideLength = params.sideLength || 2;
  const baseEdgeLength = params.baseEdgeLength || 2;

  const topY = (() => {
    switch (params.type) {
      case 'sphere':
        return (params.radius || 2) * 2;
      case 'cube':
        return params.sideLength || 2;
      default:
        return params.height || 4;
    }
  })();

  return (
    <group>
      {/* Dimensões organizadas por tipo de geometria */}
      
      {/* PIRÂMIDE - Dimensões organizadas horizontalmente */}
      {params.type === 'pyramid' && (
        <group position={[baseEdgeLength + 1, height * 0.7, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.3}
            color="#00ff00"
            anchorX="left"
            anchorY="middle"
          >
{t('params.base_edge')}: {baseEdgeLength.toFixed(1)}
          </Text>
          <Text
            position={[0, -0.3, 0]}
            fontSize={0.25}
            color="#ffffff"
            anchorX="left"
            anchorY="middle"
          >
{t('params.height')}: {height.toFixed(1)}
          </Text>
          <Text
            position={[0, -0.6, 0]}
            fontSize={0.25}
            color="#ffff00"
            anchorX="left"
            anchorY="middle"
          >
{t('params.sides')}: {params.numSides}
          </Text>
        </group>
      )}
      
      {/* PRISMA - Dimensões organizadas horizontalmente */}
      {params.type === 'prism' && (
        <group position={[baseEdgeLength + 1, height * 0.7, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.3}
            color="#00ff00"
            anchorX="left"
            anchorY="middle"
          >
{t('params.base_edge')}: {baseEdgeLength.toFixed(1)}
          </Text>
          <Text
            position={[0, -0.3, 0]}
            fontSize={0.25}
            color="#ffffff"
            anchorX="left"
            anchorY="middle"
          >
{t('params.height')}: {height.toFixed(1)}
          </Text>
          <Text
            position={[0, -0.6, 0]}
            fontSize={0.25}
            color="#ffff00"
            anchorX="left"
            anchorY="middle"
          >
{t('params.sides')}: {params.numSides}
          </Text>
        </group>
      )}
      
      {/* CUBO - Dimensões organizadas horizontalmente */}
      {params.type === 'cube' && (
        <group position={[sideLength + 1, sideLength * 0.6, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.3}
            color="#00ff00"
            anchorX="left"
            anchorY="middle"
          >
            Aresta: {sideLength.toFixed(1)}
          </Text>
        </group>
      )}
      
      {/* TETRAEDRO - Dimensões organizadas horizontalmente */}
      {params.type === 'tetrahedron' && (
        <group position={[sideLength + 1, sideLength * 0.8, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.3}
            color="#00ff00"
            anchorX="left"
            anchorY="middle"
          >
            Aresta: {sideLength.toFixed(1)}
          </Text>
          <Text
            position={[0, -0.3, 0]}
            fontSize={0.25}
            color="#ffff00"
            anchorX="left"
            anchorY="middle"
          >
            Altura: {(sideLength * Math.sqrt(2/3)).toFixed(2)}
          </Text>
        </group>
      )}
      
      {/* CILINDRO - Dimensões organizadas horizontalmente */}
      {params.type === 'cylinder' && (
        <group position={[radius + 2, height * 0.7, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.3}
            color="#00ff00"
            anchorX="left"
            anchorY="middle"
          >
{t('params.radius')}: {radius.toFixed(1)}
          </Text>
          <Text
            position={[0, -0.3, 0]}
            fontSize={0.3}
            color="#ffffff"
            anchorX="left"
            anchorY="middle"
          >
{t('params.height')}: {height.toFixed(1)}
          </Text>
        </group>
      )}
      
      {/* CONE - Dimensões organizadas horizontalmente */}
      {params.type === 'cone' && (
        <group position={[radius + 2, height * 0.7, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.3}
            color="#00ff00"
            anchorX="left"
            anchorY="middle"
          >
{t('params.radius')}: {radius.toFixed(1)}
          </Text>
          <Text
            position={[0, -0.3, 0]}
            fontSize={0.3}
            color="#ffffff"
            anchorX="left"
            anchorY="middle"
          >
{t('params.height')}: {height.toFixed(1)}
          </Text>
          <Text
            position={[0, -0.6, 0]}
            fontSize={0.25}
            color="#ff6600"
            anchorX="left"
            anchorY="middle"
          >
            Geratriz: {Math.sqrt(radius ** 2 + height ** 2).toFixed(2)}
          </Text>
        </group>
      )}
      
      {/* ESFERA - Dimensões organizadas horizontalmente */}
      {params.type === 'sphere' && (
        <group position={[radius + 2, radius, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.3}
            color="#00ff00"
            anchorX="left"
            anchorY="middle"
          >
{t('params.radius')}: {radius.toFixed(1)}
          </Text>
        </group>
      )}

      {/* Tetrahedron radius label */}
      {params.type === 'tetrahedron' && (
        <Text
          position={[sideLength + 0.8, -0.4, 0]}
          fontSize={0.25}
          color="#00ff00"
          anchorX="left"
          anchorY="bottom"
        >
          r = {(sideLength / Math.sqrt(3)).toFixed(1)}
        </Text>
      )}
    </group>
  );
}