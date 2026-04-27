import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parsePoly, polyFmt, findPolyRoots, rationalCandidates, polyDerivative } from '@/utils/equationBreakerMath';
import { Search, Hash, Activity } from 'lucide-react';

export function PolynomialTab() {
  const [expr, setExpr] = useState("x^3 - 6x^2 + 11x - 6");
  
  const analysis = useMemo(() => {
    const coeffs = parsePoly(expr);
    if (!coeffs) return null;
    
    const deg = coeffs.length - 1;
    const formatted = polyFmt(coeffs);
    const rootsInfo = findPolyRoots(coeffs);
    const candidates = rationalCandidates(coeffs);
    const deriv = polyDerivative(coeffs);
    
    return { coeffs, deg, formatted, roots: rootsInfo.roots, candidates, derivFormatted: polyFmt(deriv) };
  }, [expr]);

  return (
    <div className="h-full flex flex-col gap-6 w-full p-2 overflow-y-auto">
      {/* Input Section */}
      <Card className="border-border/50 shadow-sm shrink-0">
        <CardContent className="pt-6">
          <label className="text-sm font-semibold mb-2 block">Defina o Polinômio P(x)</label>
          <div className="flex gap-3">
            <Input 
              value={expr} 
              onChange={e => setExpr(e.target.value)} 
              className="font-mono text-lg py-6"
              placeholder="Ex: 2x^2 - 4x + 2"
            />
          </div>
          {analysis ? (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg flex items-center gap-4">
              <span className="text-xl font-serif">P(x) = {analysis.formatted}</span>
              <Badge variant="outline">Grau {analysis.deg}</Badge>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              Expressão inválida. Use o formato padrão, ex: x^3 - 2x + 1
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          {/* Raízes */}
          <Card className="border-border/50 shadow-sm flex flex-col">
            <CardContent className="pt-6 flex-1">
              <h3 className="font-semibold flex items-center gap-2 mb-4 text-primary">
                <Search className="w-4 h-4" />
                Raízes e Soluções
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Raízes Encontradas:</p>
                  {analysis.roots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {analysis.roots.map((r, i) => (
                        <Badge key={i} className="text-sm py-1 px-3 bg-primary/15 text-primary hover:bg-primary/25 border-none">
                          x = {typeof r === 'object' ? `${r.re} ± ${r.im}i` : r}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-medium">Nenhuma raiz encontrada numericamente.</p>
                  )}
                </div>

                <div className="pt-4 border-t border-border/30">
                  <p className="text-sm text-muted-foreground mb-2">Candidatas Racionais (±p/q):</p>
                  <ScrollArea className="h-20 w-full rounded-md border border-border/40 p-2 bg-muted/10">
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.candidates.map((c, i) => (
                        <span key={i} className="text-xs bg-background border px-1.5 py-0.5 rounded text-muted-foreground">
                          {c}
                        </span>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Derivadas e Propriedades */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4 text-emerald-500">
                <Activity className="w-4 h-4" />
                Cálculo (Derivada)
              </h3>
              
              <div className="p-4 bg-emerald-500/10 rounded-lg text-emerald-700 dark:text-emerald-400 font-serif text-lg">
                P'(x) = {analysis.derivFormatted}
              </div>
              
              <div className="mt-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4 text-amber-500">
                  <Hash className="w-4 h-4" />
                  Coeficientes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.coeffs.map((c, i) => (
                    <div key={i} className="flex flex-col items-center p-2 bg-muted/20 border border-border/30 rounded-md min-w-[3rem]">
                      <span className="text-xs text-muted-foreground">a_{analysis.deg - i}</span>
                      <span className="font-mono font-medium">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
