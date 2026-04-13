import { useTranslation } from 'react-i18next';
import { Maximize, Focus, Camera, Unlock } from 'lucide-react';
import { GeometryParams } from '@/types/geometry';

interface CompactStatusBarProps {
  params: GeometryParams;
  isFrozen: boolean;
  onCenterView: () => void;
  onToggleFreeze: () => void;
  onFullscreen: () => void;
}

export function CompactStatusBar({ params, isFrozen, onCenterView, onToggleFreeze, onFullscreen }: CompactStatusBarProps) {
  const { t } = useTranslation();

  const shapeLabel = t(`geometry.${params.type}`) || params.type;
  const info = [
    shapeLabel,
    params.numSides ? `${params.numSides} ${t('params.sides').toLowerCase()}` : null,
    params.height ? `H:${params.height.toFixed(1)}` : null,
    params.radius ? `R:${params.radius.toFixed(1)}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="h-8 bg-background/80 backdrop-blur border-t border-border/30 hidden md:flex items-center justify-between px-3 text-xs text-muted-foreground flex-shrink-0">
      <span className="font-medium">{info}</span>
      <div className="flex items-center gap-1">
        <button onClick={onCenterView} title={t('button.center_view')} className="p-1 hover:text-foreground transition-colors">
          <Focus className="h-3.5 w-3.5" />
        </button>
        <button onClick={onToggleFreeze} title={isFrozen ? t('button.unfreeze_view') : t('button.freeze_view')} className="p-1 hover:text-foreground transition-colors">
          {isFrozen ? <Unlock className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
        </button>
        <button onClick={onFullscreen} title="Fullscreen" className="p-1 hover:text-foreground transition-colors">
          <Maximize className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
