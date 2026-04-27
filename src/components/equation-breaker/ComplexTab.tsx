import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, Zap, RotateCw } from 'lucide-react';
import { 
  cAdd, cSub, cMul, cDiv, cFmt, cMod, cArg, cConj, cTrigFmt, cPolFmt, I_CYCLE 
} from '@/utils/equationBreakerMath';

export function ComplexTab() {
  const [re1, setRe1] = useState(3);
  const [im1, setIm1] = useState(4);
  const [re2, setRe2] = useState(-2);
  const [im2, setIm2] = useState(1);
  const [op, setOp] = useState('add');

  const z1 = useMemo(() => ({ re: re1, im: im1 }), [re1, im1]);
  const z2 = useMemo(() => ({ re: re2, im: im2 }), [re2, im2]);

  const result = useMemo(() => {
    switch (op) {
      case 'add': return cAdd(z1, z2);
      case 'sub': return cSub(z1, z2);
      case 'mul': return cMul(z1, z2);
      case 'div': return cDiv(z1, z2);
      default: return cAdd(z1, z2);
    }
  }, [z1, z2, op]);

  // Plano de Argand-Gauss config (SVG)
  const planeSize = 400;
  const maxVal = Math.max(
    10, 
    Math.abs(z1.re), Math.abs(z1.im), 
    Math.abs(z2.re), Math.abs(z2.im), 
    Math.abs(result.re || 0), Math.abs(result.im || 0)
  ) + 2;

  const toSvg = (x: number, y: number) => {
    const scale = (planeSize / 2) / maxVal;
    return {
      x: planeSize / 2 + x * scale,
      y: planeSize / 2 - y * scale
    };
  };

  const pZ1 = toSvg(z1.re, z1.im);
  const pZ2 = toSvg(z2.re, z2.im);
  const pRes = toSvg(result.re || 0, result.im || 0);
  const origin = toSvg(0, 0);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 w-full p-2 overflow-y-auto">
      
      {/* Esquerda: Entradas e Cálculos */}
      <div className="w-full lg:w-[450px] flex flex-col gap-6 shrink-0">
        
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4 text-primary">
              <Settings2 className="w-4 h-4" />
              Operação Principal
            </h3>
            
            {/* Input Z1 */}
            <div className="flex items-center gap-3 mb-4">
              <span className="font-serif text-lg font-semibold min-w-8">Z₁ =</span>
              <Input type="number" value={re1} onChange={e => setRe1(Number(e.target.value) || 0)} className="w-20" />
              <span className="font-serif">+</span>
              <Input type="number" value={im1} onChange={e => setIm1(Number(e.target.value) || 0)} className="w-20" />
              <span className="font-serif italic">i</span>
            </div>

            {/* Input Z2 */}
            <div className="flex items-center gap-3 mb-6">
              <span className="font-serif text-lg font-semibold min-w-8">Z₂ =</span>
              <Input type="number" value={re2} onChange={e => setRe2(Number(e.target.value) || 0)} className="w-20" />
              <span className="font-serif">+</span>
              <Input type="number" value={im2} onChange={e => setIm2(Number(e.target.value) || 0)} className="w-20" />
              <span className="font-serif italic">i</span>
            </div>

            <div className="flex gap-4 items-center">
              <Select value={op} onValueChange={setOp}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Operação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Adição (Z₁ + Z₂)</SelectItem>
                  <SelectItem value="sub">Subtração (Z₁ - Z₂)</SelectItem>
                  <SelectItem value="mul">Multiplicação (Z₁ × Z₂)</SelectItem>
                  <SelectItem value="div">Divisão (Z₁ ÷ Z₂)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-6" />
            
            <div className="p-4 bg-muted/20 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Resultado (Forma Algébrica):</p>
              <p className="text-2xl font-serif text-primary">Z = {cFmt(result)}</p>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Módulo |Z|:</span> {cMod(result).toFixed(2)}</div>
                <div><span className="text-muted-foreground">Arg θ:</span> {(cArg(result) * 180 / Math.PI).toFixed(1)}°</div>
                <div className="col-span-2"><span className="text-muted-foreground">Trig:</span> {cTrigFmt(result)}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Polar:</span> {cPolFmt(result)}</div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Ciclo de i */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4 text-amber-500">
              <RotateCw className="w-4 h-4" />
              Ciclo das Potências de i
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              {I_CYCLE.map(cycle => (
                <div key={cycle.exp} className="p-2 border border-border/50 bg-muted/10 rounded-md">
                  <div className="text-xs text-muted-foreground mb-1">i^{cycle.exp}</div>
                  <div className="font-serif font-bold text-amber-600 dark:text-amber-400">{cycle.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Direita: Plano de Argand-Gauss */}
      <Card className="border-border/50 shadow-sm flex-1 relative overflow-hidden min-h-[400px]">
        <CardContent className="p-0 h-full w-full flex items-center justify-center bg-muted/5 relative">
          
          <div className="absolute top-4 left-4 bg-background/80 backdrop-blur p-3 rounded-lg border text-sm shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Z₁</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Z₂</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary"></div> Resultado</div>
          </div>

          <svg width={planeSize} height={planeSize} viewBox={`0 0 ${planeSize} ${planeSize}`} className="overflow-visible">
            {/* Grid Lines */}
            <g stroke="currentColor" strokeOpacity="0.1" strokeWidth="1">
              {Array.from({length: 21}).map((_, i) => {
                const x = -maxVal + i * (maxVal / 10);
                if (Math.abs(x) < 0.01) return null; // skip origin axis
                return (
                  <React.Fragment key={`grid-${i}`}>
                    <line x1={toSvg(x, 0).x} y1={0} x2={toSvg(x, 0).x} y2={planeSize} />
                    <line x1={0} y1={toSvg(0, x).y} x2={planeSize} y2={toSvg(0, x).y} />
                  </React.Fragment>
                );
              })}
            </g>

            {/* Axes */}
            <line x1={0} y1={origin.y} x2={planeSize} y2={origin.y} stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" />
            <line x1={origin.x} y1={0} x2={origin.x} y2={planeSize} stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" />
            <text x={planeSize - 10} y={origin.y - 10} fill="currentColor" fontSize="12" opacity="0.5">Re</text>
            <text x={origin.x + 10} y={15} fill="currentColor" fontSize="12" opacity="0.5">Im</text>

            {/* Vectors */}
            {/* Z1 */}
            <line x1={origin.x} y1={origin.y} x2={pZ1.x} y2={pZ1.y} stroke="#3b82f6" strokeWidth="2" strokeDasharray="4" opacity="0.6" />
            <circle cx={pZ1.x} cy={pZ1.y} r="5" fill="#3b82f6" />
            
            {/* Z2 */}
            <line x1={origin.x} y1={origin.y} x2={pZ2.x} y2={pZ2.y} stroke="#10b981" strokeWidth="2" strokeDasharray="4" opacity="0.6" />
            <circle cx={pZ2.x} cy={pZ2.y} r="5" fill="#10b981" />

            {/* Result */}
            {!Number.isNaN(result.re) && (
              <>
                <line x1={origin.x} y1={origin.y} x2={pRes.x} y2={pRes.y} stroke="hsl(var(--primary))" strokeWidth="2" />
                <circle cx={pRes.x} cy={pRes.y} r="6" fill="hsl(var(--primary))" />
                {/* Result Parallelogram lines (only for Add/Sub for visual clarity) */}
                {(op === 'add' || op === 'sub') && (
                  <>
                    <line x1={pZ1.x} y1={pZ1.y} x2={pRes.x} y2={pRes.y} stroke="currentColor" strokeWidth="1" strokeDasharray="4" opacity="0.2" />
                    <line x1={op === 'add' ? pZ2.x : origin.x - (pZ2.x - origin.x)} y1={op === 'add' ? pZ2.y : origin.y - (pZ2.y - origin.y)} x2={pRes.x} y2={pRes.y} stroke="currentColor" strokeWidth="1" strokeDasharray="4" opacity="0.2" />
                  </>
                )}
              </>
            )}
          </svg>

        </CardContent>
      </Card>
    </div>
  );
}
