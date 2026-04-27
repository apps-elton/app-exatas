import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calculator, 
  FunctionSquare, 
  Superscript, 
  PenTool,
  Settings2,
  ChevronRight
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppSidebar } from '@/components/AppSidebar';
import { PolynomialTab } from '@/components/equation-breaker/PolynomialTab';

export default function EquationBreaker() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('functions');

  const MENU_ITEMS = [
    { id: 'functions', label: 'Funções', icon: FunctionSquare, desc: 'Análise de gráficos e cálculo' },
    { id: 'complex', label: 'Complexos', icon: Settings2, desc: 'Plano de Argand-Gauss' },
    { id: 'polynomials', label: 'Polinômios', icon: Superscript, desc: 'Raízes, divisão e Ruffini' },
    { id: 'board', label: 'Lousa', icon: PenTool, desc: 'Área livre de desenho' },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <AppSidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-muted/10">
        <div className="flex-1 overflow-hidden p-6 md:p-8">
          
          <div className="flex flex-col gap-2 mb-8">
            <h1 className="text-3xl font-poppins font-bold tracking-tight text-foreground flex items-center gap-3">
              <Calculator className="w-8 h-8 text-primary" />
              Equation Breaker
            </h1>
            <p className="text-muted-foreground text-sm">
              Explore o plano cartesiano, números complexos e sistemas polinomiais.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 h-[calc(100%-100px)]">
            
            {/* Menu Lateral Interno (Internal Sidebar) */}
            <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center text-left p-3 rounded-xl transition-all duration-200 border ${
                      isActive 
                        ? 'bg-primary/10 border-primary/20 shadow-sm' 
                        : 'bg-card border-transparent hover:border-border hover:bg-accent/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mr-3 ${isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-sm ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {item.label}
                      </h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{item.desc}</p>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-primary ml-2" />}
                  </button>
                )
              })}
            </div>

            {/* Área de Conteúdo */}
            <div className="flex-1 h-full overflow-y-auto">
              {activeTab === 'polynomials' ? (
                <PolynomialTab />
              ) : (
                <Card className="h-full border-border/50 shadow-sm rounded-xl overflow-hidden flex flex-col">
                  <CardHeader className="bg-card">
                    <CardTitle className="text-xl">
                      {MENU_ITEMS.find(m => m.id === activeTab)?.label}
                    </CardTitle>
                    <CardDescription>
                      {MENU_ITEMS.find(m => m.id === activeTab)?.desc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-center justify-center bg-muted/5 border-t">
                    <p className="text-muted-foreground italic flex flex-col items-center gap-2">
                      {React.createElement(MENU_ITEMS.find(m => m.id === activeTab)?.icon || FunctionSquare, { className: "w-10 h-10 text-muted-foreground/30" })}
                      <span>Motor gráfico para {MENU_ITEMS.find(m => m.id === activeTab)?.label.toLowerCase()} sendo integrado...</span>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
