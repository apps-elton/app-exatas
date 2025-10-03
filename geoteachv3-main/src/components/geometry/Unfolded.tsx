import { UnfoldingSystem } from './UnfoldingSystem';
import { GeometryParams, StyleOptions } from '@/types/geometry';

interface UnfoldedProps {
  params: GeometryParams;
  showUnfolded: boolean;
  style?: StyleOptions;
}

export function Unfolded({ params, showUnfolded, style }: UnfoldedProps) {
  return (
    <UnfoldingSystem 
      params={params} 
      showUnfolded={showUnfolded} 
      style={style} 
    />
  );
}