import React from 'react';
import { useTranslation } from 'react-i18next';
import { useActiveTool } from '@/context/ActiveToolContext';

interface StatusBarProps {
  showCrossSection?: boolean;
  showMeridianSection?: boolean;
}

export function StatusBar({ showCrossSection = false, showMeridianSection = false }: StatusBarProps) {
  const { t } = useTranslation();
  const { activeTool } = useActiveTool();

  const labels: Record<string, string> = {
    'none': '',
    'cross-section': t('visualization.cross_section'),
    'meridian-section': t('visualization.meridian_section'),
    'vertex-connector': t('drawing.connect_vertices'),
    'plane-definition': t('interaction.create_plane'),
    'construction': t('drawing.constructions'),
  };

  const interactionLabel = labels[activeTool] ?? activeTool;

  const activeVisualizations = [];
  if (showCrossSection) activeVisualizations.push(t('visualization.cross_section'));
  if (showMeridianSection) activeVisualizations.push(t('visualization.meridian_section'));

  return (
    <div style={{
      display: 'none',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 10px',
      borderTop: '1px solid #e5e7eb',
      background: '#fafafa',
      color: '#111827',
      fontSize: 13
    }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div>
          Interação: <strong>{interactionLabel}</strong>
        </div>
        {activeVisualizations.length > 0 && (
          <div>
            Visualizações: <strong>{activeVisualizations.join(', ')}</strong>
          </div>
        )}
      </div>
      <div style={{ opacity: 0.7, display: 'none' }}>
        Dica: ferramentas de visualização são independentes e podem coexistir.
      </div>
    </div>
  );
}

export default StatusBar;


