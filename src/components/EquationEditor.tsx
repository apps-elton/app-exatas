import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface EquationEditorProps {
  onEquationAdd: (latex: string, rendered: string) => void;
}

export default function EquationEditor({ onEquationAdd }: EquationEditorProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [latexInput, setLatexInput] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  // Equações predefinidas para geometria
  const geometryTemplates = [
    { name: 'Volume da Pirâmide', latex: 'V = \\frac{1}{3} \\cdot A_b \\cdot h' },
    { name: 'Área Lateral', latex: 'A_l = \\frac{1}{2} \\cdot p \\cdot a_l' },
    { name: 'Apótema da Pirâmide', latex: 'a_l = \\sqrt{h^2 + a^2}' },
    { name: 'Área da Base (Polígono)', latex: 'A_b = \\frac{n \\cdot s^2}{4 \\cdot \\tan(\\frac{\\pi}{n})}' },
    { name: 'Perímetro', latex: 'p = n \\cdot s' },
    { name: 'Apótema da Base', latex: 'a = \\frac{s}{2 \\cdot \\tan(\\frac{\\pi}{n})}' },
    { name: 'Fração', latex: '\\frac{a}{b}' },
    { name: 'Raiz Quadrada', latex: '\\sqrt{x}' },
    { name: 'Potência', latex: 'x^{n}' },
    { name: 'Somatório', latex: '\\sum_{i=1}^{n} x_i' },
    { name: 'Integral', latex: '\\int_{a}^{b} f(x) dx' }
  ];

  // Função para renderizar LaTeX (simulação simples)
  const renderLatex = (latex: string) => {
    // Conversões básicas de LaTeX para HTML com estilo matemático
    let html = latex
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="fraction"><span class="num">$1</span><span class="den">$2</span></span>')
      .replace(/\\sqrt\{([^}]+)\}/g, '<span class="sqrt">√<span class="sqrt-content">$1</span></span>')
      .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
      .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
      .replace(/\\cdot/g, '·')
      .replace(/\\pi/g, 'π')
      .replace(/\\sum/g, '∑')
      .replace(/\\int/g, '∫')
      .replace(/\\tan/g, 'tan')
      .replace(/\\sin/g, 'sin')
      .replace(/\\cos/g, 'cos');
    
    return html;
  };

  useEffect(() => {
    if (latexInput) {
      setPreviewHtml(renderLatex(latexInput));
    } else {
      setPreviewHtml('');
    }
  }, [latexInput]);

  const handleAddEquation = () => {
    if (!latexInput.trim()) {
      toast.error('Digite uma equação primeiro');
      return;
    }

    const rendered = renderLatex(latexInput);
    onEquationAdd(latexInput, rendered);
    setLatexInput('');
    setIsOpen(false);
    toast.success('Equação adicionada!');
  };

  const useTemplate = (template: string) => {
    setLatexInput(template);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Calculator className="w-4 h-4" />
{t('drawing.add_equation')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Editor de Equações Matemáticas
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="templates">Modelos</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input LaTeX */}
              <div className="space-y-2">
                <Label htmlFor="latex-input">Código LaTeX:</Label>
                <Textarea
                  id="latex-input"
                  placeholder="Digite sua equação em LaTeX (ex: \\frac{a}{b})"
                  value={latexInput}
                  onChange={(e) => setLatexInput(e.target.value)}
                  className="font-mono text-sm h-32"
                />
                <div className="text-xs text-muted-foreground">
                  Dica: Use \\frac{"{a}"}{"{b}"} para frações, x^{"{2}"} para potências, \\sqrt{"{x}"} para raízes
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Visualização:</Label>
                <Card className="p-4 h-32 flex items-center justify-center bg-muted/20">
                  {previewHtml ? (
                    <div 
                      ref={previewRef}
                      className="equation-preview text-lg"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                      style={{
                        fontFamily: 'Times New Roman, serif'
                      }}
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      A equação aparecerá aqui
                    </div>
                  )}
                </Card>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddEquation}>
                <Plus className="w-4 h-4 mr-2" />
      {t('drawing.add_equation')}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {geometryTemplates.map((template, index) => (
                <Card key={index} className="p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">{template.name}</div>
                      <div 
                        className="text-xs text-muted-foreground font-mono"
                        style={{ fontSize: '11px' }}
                      >
                        {template.latex}
                      </div>
                      <div 
                        className="mt-2 equation-preview"
                        dangerouslySetInnerHTML={{ __html: renderLatex(template.latex) }}
                        style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px' }}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => useTemplate(template.latex)}
                      className="ml-2"
                    >
                      Usar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}