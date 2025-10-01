import React from 'react';
import { useActiveTool } from '@/context/ActiveToolContext';

const labels: Record<string, string> = {
  'none': '',
  'cross-section': 'Seção Transversal',
  'meridian-section': 'Seção Meridiana',
  'vertex-connector': 'Conectar Vértices',
  'plane-definition': 'Criar Plano',
  'construction': 'Construções',
};

interface StatusBarProps {
  showCrossSection?: boolean;
  showMeridianSection?: boolean;
}

export function StatusBar({ showCrossSection = false, showMeridianSection = false }: StatusBarProps) {
  const { activeTool } = useActiveTool();
  const interactionLabel = labels[activeTool] ?? activeTool;
  
  const activeVisualizations = [];
  if (showCrossSection) activeVisualizations.push('Seção Transversal');
  if (showMeridianSection) activeVisualizations.push('Seção Meridiana');

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


