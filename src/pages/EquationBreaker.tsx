import React, { useState } from 'react';
import { EquationSidebar, EqPanelId } from '@/components/equation-breaker/EquationSidebar';
import { PolynomialTab } from '@/components/equation-breaker/PolynomialTab';
import { FunctionsTab } from '@/components/equation-breaker/FunctionsTab';
import { ComplexTab } from '@/components/equation-breaker/ComplexTab';
import { Card, CardContent } from "@/components/ui/card";
import { FunctionSquare } from 'lucide-react';

export default function EquationBreaker() {
  const [activeTab, setActiveTab] = useState<EqPanelId>('functions');

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar fina com ícones (igual do Geometria 3D) */}
      <EquationSidebar activePanel={activeTab} onPanelToggle={setActiveTab} />
      
      {/* Área Principal em Tela Cheia */}
      <main className="flex-1 h-full overflow-hidden relative bg-muted/10">
        <div className="h-full w-full p-2 md:p-4">
          <div className="flex-1 h-full w-full bg-background rounded-xl border shadow-sm overflow-hidden flex flex-col">
            
            {/* Header / Titulo da Ferramenta */}
            <div className="h-14 border-b flex items-center px-6 bg-card shrink-0">
              <h1 className="text-xl font-poppins font-bold text-foreground">
                {activeTab === 'functions' && 'Funções Gráficas'}
                {activeTab === 'complex' && 'Plano Complexo'}
                {activeTab === 'polynomials' && 'Polinômios'}
                {activeTab === 'board' && 'Lousa de Desenho'}
              </h1>
            </div>

            {/* Conteúdo Dinâmico */}
            <div className="flex-1 overflow-hidden relative">
              {activeTab === 'polynomials' ? (
                <PolynomialTab />
              ) : activeTab === 'functions' ? (
                <FunctionsTab />
              ) : activeTab === 'complex' ? (
                <ComplexTab />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-muted/5">
                  <p className="text-muted-foreground italic flex flex-col items-center gap-2">
                    <FunctionSquare className="w-10 h-10 text-muted-foreground/30" />
                    <span>Ferramenta sendo integrada...</span>
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
