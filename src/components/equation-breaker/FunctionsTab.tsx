import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { parseFormula, buildPath } from '@/utils/equationBreakerMath';

export function FunctionsTab() {
  const [expr, setExpr] = useState("sin(x)");
  const [color, setColor] = useState("#2563eb");
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [vXn, setVXn] = useState(-10);
  const [vXx, setVXx] = useState(10);
  const [vYn, setVYn] = useState(-8);
  const [vYx, setVYx] = useState(8);

  const fn = useMemo(() => {
    return parseFormula(expr) || ((x: number) => NaN);
  }, [expr]);

  const toSvg = (x: number, y: number): [number, number] => {
    if (!svgRef.current) return [0, 0];
    const w = 800; // placeholder width for calc
    const h = 400; // placeholder height
    const sx = ((x - vXn) / (vXx - vXn)) * w;
    const sy = h - ((y - vYn) / (vYx - vYn)) * h;
    return [sx, sy];
  };

  const pathD = useMemo(() => {
    return buildPath(fn, vXn, vXx, toSvg, 400);
  }, [fn, vXn, vXx, vYn, vYx]);

  // Generate Axis
  const xAxis = toSvg(0, 0)[1];
  const yAxis = toSvg(0, 0)[0];

  return (
    <div className="h-full flex flex-col gap-6 w-full p-2">
      <Card className="border-border/50 shadow-sm shrink-0">
        <CardContent className="pt-6">
          <label className="text-sm font-semibold mb-2 block">Função f(x)</label>
          <div className="flex gap-3">
            <Input 
              value={expr} 
              onChange={e => setExpr(e.target.value)} 
              className="font-mono text-lg py-6 flex-1"
              placeholder="Ex: x^2 - 4"
            />
            <input 
              type="color" 
              value={color} 
              onChange={e => setColor(e.target.value)}
              className="w-14 h-14 rounded cursor-pointer border-0 p-0"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm flex-1 overflow-hidden relative">
        <CardContent className="p-0 h-full w-full relative bg-muted/5">
          <svg 
            ref={svgRef}
            viewBox="0 0 800 400" 
            preserveAspectRatio="none" 
            className="w-full h-full"
          >
            {/* Grid */}
            <g stroke="currentColor" strokeOpacity="0.1" strokeWidth="1">
              {Array.from({length: 21}).map((_, i) => {
                const x = vXn + i * ((vXx - vXn) / 20);
                return <line key={`gx-${i}`} x1={toSvg(x, 0)[0]} y1={0} x2={toSvg(x, 0)[0]} y2={400} />
              })}
              {Array.from({length: 17}).map((_, i) => {
                const y = vYn + i * ((vYx - vYn) / 16);
                return <line key={`gy-${i}`} x1={0} y1={toSvg(0, y)[1]} x2={800} y2={toSvg(0, y)[1]} />
              })}
            </g>

            {/* Axes */}
            <line x1={0} y1={xAxis} x2={800} y2={xAxis} stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" />
            <line x1={yAxis} y1={0} x2={yAxis} y2={400} stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" />

            {/* Function Curve */}
            <path 
              d={pathD} 
              fill="none" 
              stroke={color} 
              strokeWidth="3" 
              strokeLinejoin="round" 
              strokeLinecap="round" 
            />
          </svg>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <div className="bg-background/80 backdrop-blur border p-2 rounded-lg flex flex-col gap-2">
              <span className="text-xs font-semibold text-center">Zoom</span>
              <Slider 
                min={2} max={50} step={1} 
                value={[vXx - vXn]} 
                onValueChange={(v) => {
                  const span = v[0] / 2;
                  setVXn(-span); setVXx(span);
                  setVYn(-span * 0.8); setVYx(span * 0.8);
                }}
                className="w-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
