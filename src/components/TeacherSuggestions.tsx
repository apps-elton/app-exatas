import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, BookOpen, Users, Video, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function TeacherSuggestions() {
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = [
    {
      category: "Estratégias Pedagógicas",
      icon: <BookOpen className="w-4 h-4" />,
      items: [
        "Use a rotação 3D para mostrar diferentes perspectivas da mesma forma",
        "Compare volumes usando a visualização simultânea de diferentes geometrias",
        "Demonstre conceitos de áreas lateral e total alterando as cores",
        "Use o quadro de anotações para destacar elementos importantes durante a explicação"
      ]
    },
    {
      category: "Interação em Videoaulas",
      icon: <Video className="w-4 h-4" />,
      items: [
        "Grave explicações enquanto manipula as formas em tempo real",
        "Use a mesa digitalizadora para fazer anotações diretas sobre as formas 3D",
        "Alterne entre modo claro e escuro conforme o ambiente de gravação",
        "Salve capturas de tela em momentos-chave da explicação"
      ]
    },
    {
      category: "Dinâmicas de Grupo",
      icon: <Users className="w-4 h-4" />,
      items: [
        "Projete na tela e peça para os alunos identificarem propriedades",
        "Crie desafios de cálculo usando os valores exibidos",
        "Use o modo de rotação automática para discussões em grupo",
        "Compare formas reais com os modelos virtuais"
      ]
    },
    {
      category: "Recursos Avançados",
      icon: <Zap className="w-4 h-4" />,
      items: [
        "Mostre raios inscritos e circunscritos para conectar com trigonometria",
        "Use apótemas para explicar conceitos de geometria plana vs. espacial",
        "Varie números de lados em prismas para mostrar tendências matemáticas",
        "Conecte visualizações com fórmulas matemáticas em tempo real"
      ]
    }
  ];

  return (
    <Card className="control-section">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg text-primary">Dicas para Professores</CardTitle>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {suggestions.map((section) => (
              <div key={section.category} className="space-y-2">
                <div className="flex items-center gap-2">
                  {section.icon}
                  <Badge variant="secondary" className="text-xs">
                    {section.category}
                  </Badge>
                </div>
                <ul className="space-y-1 ml-6">
                  {section.items.map((item, index) => (
                    <li key={index} className="text-sm text-muted-foreground leading-relaxed">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Dica especial:</strong> Use Ctrl+Click para múltiplas seleções no quadro de anotações
                e experimente diferentes combinações de visualização para criar explicações mais dinâmicas.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}