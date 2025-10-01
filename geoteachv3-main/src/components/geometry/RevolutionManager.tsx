import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { GeometryParams } from '@/types/geometry';

interface RevolutionManagerProps {
  params: GeometryParams;
  onParamsChange: (params: GeometryParams) => void;
}

export default function RevolutionManager({ params, onParamsChange }: RevolutionManagerProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar com triângulo se não tiver tipo definido
  useEffect(() => {
    if (params.type === 'revolution-solids' && !params.revolutionType) {
      onParamsChange({ 
        ...params, 
        revolutionType: 'triangle',
        show2DShape: true, // Mostrar forma 2D por padrão
        revolution2DColor: '#ff6600',
        revolution2DOpacity: 0.8,
        revolution3DColor: '#3b82f6', // Azul para o sólido 3D
        revolution3DOpacity: 0.4, // 40% opacidade para o sólido 3D
        show3DSolid: true, // Mostrar sólido 3D por padrão
        revolutionSpeed: 2 // Velocidade mais rápida por padrão
      });
    }
  }, [params, onParamsChange]);

  // Cleanup do intervalo quando componente desmonta
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleRevolutionTypeChange = (type: 'triangle' | 'rectangle' | 'semicircle' | 'trapezoid') => {
    onParamsChange({ ...params, revolutionType: type });
  };

  const handleParamChange = (key: keyof GeometryParams, value: number) => {
    onParamsChange({ ...params, [key]: value });
  };

  const handleAxisChange = (axis: 'x' | 'y' | 'z') => {
    onParamsChange({ ...params, revolutionAxis: axis });
  };

  const handleBooleanChange = (key: keyof GeometryParams, value: boolean) => {
    onParamsChange({ ...params, [key]: value });
  };

  const toggleAnimation = () => {
    const newAnimatingState = !isAnimating;
    setIsAnimating(newAnimatingState);
    
    // Parar animação anterior se existir
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Notificar o componente pai sobre a mudança de estado
    onParamsChange({ ...params, isAnimating: newAnimatingState });
    
    // Se iniciando animação, começar progresso automático
    if (newAnimatingState) {
      // Pequeno delay para garantir que o estado foi atualizado
      setTimeout(() => {
        startProgressAnimation();
      }, 50);
    }
  };

  const startProgressAnimation = () => {
    let currentProgress = params.revolutionProgress || 0;
    let shouldContinue = true;
    
    progressIntervalRef.current = setInterval(() => {
      if (!shouldContinue) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        return;
      }
      
      // Calcular incremento baseado na velocidade
      const speed = params.revolutionSpeed || 2;
      const increment = (speed * 0.008); // Incremento baseado na velocidade
      currentProgress += increment;
      console.log('Progresso:', Math.round(currentProgress * 100) + '%', 'Velocidade:', speed);
      
      if (currentProgress >= 1) {
        currentProgress = 1;
        shouldContinue = false;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setIsAnimating(false);
        onParamsChange({ ...params, isAnimating: false, revolutionProgress: 1 });
        return;
      }
      
      setProgress(currentProgress);
      onParamsChange({ ...params, revolutionProgress: currentProgress });
    }, 100); // Atualizar a cada 100ms para animação suave
  };

  const resetRevolution = () => {
    // Parar animação se estiver rodando
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setProgress(0);
    setIsAnimating(false);
    onParamsChange({ ...params, revolutionProgress: 0, isAnimating: false });
  };

  const handleProgressChange = (value: number) => {
    setProgress(value);
    onParamsChange({ ...params, revolutionProgress: value });
  };

  return (
    <div className="space-y-4">
      {/* Seleção do tipo de sólido */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">Tipo de Sólido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Forma 2D</Label>
            <Select 
              value={params.revolutionType || 'triangle'} 
              onValueChange={handleRevolutionTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="triangle">Triângulo Retângulo</SelectItem>
                <SelectItem value="rectangle">Retângulo</SelectItem>
                <SelectItem value="semicircle">Semicírculo</SelectItem>
                <SelectItem value="trapezoid">Trapézio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Parâmetros da forma 2D */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">Parâmetros da Forma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Triângulo */}
          {params.revolutionType === 'triangle' && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Base: {params.triangleBase?.toFixed(1)}
                </Label>
                <Slider
                  value={[params.triangleBase || 2]}
                  onValueChange={([value]) => handleParamChange('triangleBase', value)}
                  min={0.5}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Altura: {params.triangleHeight?.toFixed(1)}
                </Label>
                <Slider
                  value={[params.triangleHeight || 2]}
                  onValueChange={([value]) => handleParamChange('triangleHeight', value)}
                  min={0.5}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* Retângulo */}
          {params.revolutionType === 'rectangle' && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Largura: {params.rectangleWidth?.toFixed(1)}
                </Label>
                <Slider
                  value={[params.rectangleWidth || 2]}
                  onValueChange={([value]) => handleParamChange('rectangleWidth', value)}
                  min={0.5}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Altura: {params.rectangleHeight?.toFixed(1)}
                </Label>
                <Slider
                  value={[params.rectangleHeight || 1]}
                  onValueChange={([value]) => handleParamChange('rectangleHeight', value)}
                  min={0.5}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* Semicírculo */}
          {params.revolutionType === 'semicircle' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Raio: {params.semicircleRadius?.toFixed(1)}
              </Label>
              <Slider
                value={[params.semicircleRadius || 2]}
                onValueChange={([value]) => handleParamChange('semicircleRadius', value)}
                min={0.5}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>
          )}

          {/* Trapézio */}
          {params.revolutionType === 'trapezoid' && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Base Superior: {params.trapezoidTopBase?.toFixed(1)}
                </Label>
                <Slider
                  value={[params.trapezoidTopBase || 1]}
                  onValueChange={([value]) => handleParamChange('trapezoidTopBase', value)}
                  min={0.5}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Base Inferior: {params.trapezoidBottomBase?.toFixed(1)}
                </Label>
                <Slider
                  value={[params.trapezoidBottomBase || 2]}
                  onValueChange={([value]) => handleParamChange('trapezoidBottomBase', value)}
                  min={0.5}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Altura: {params.trapezoidHeight?.toFixed(1)}
                </Label>
                <Slider
                  value={[params.trapezoidHeight || 1]}
                  onValueChange={([value]) => handleParamChange('trapezoidHeight', value)}
                  min={0.5}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Controles de revolução */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">Controles de Revolução</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Eixo de Rotação</Label>
            <Select 
              value={params.revolutionAxis || 'y'} 
              onValueChange={handleAxisChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="x">Eixo X</SelectItem>
                <SelectItem value="y">Eixo Y</SelectItem>
                <SelectItem value="z">Eixo Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Velocidade de Construção: {params.revolutionSpeed?.toFixed(1)}
            </Label>
            <Slider
              value={[params.revolutionSpeed || 2]}
              onValueChange={([value]) => handleParamChange('revolutionSpeed', value)}
              min={0.1}
              max={5}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Muito Lento</span>
              <span>Muito Rápido</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Progresso: {Math.round((params.revolutionProgress || 0) * 100)}%
            </Label>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-100 ease-out"
                style={{ width: `${(params.revolutionProgress || 0) * 100}%` }}
              ></div>
            </div>
            <Slider
              value={[params.revolutionProgress || 0]}
              onValueChange={([value]) => handleProgressChange(value)}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-2d" className="text-sm font-medium">Mostrar Forma 2D</Label>
            <Switch
              id="show-2d"
              checked={params.show2DShape !== false} // Default true
              onCheckedChange={(checked) => handleBooleanChange('show2DShape', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Cor da Forma 2D</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={params.revolution2DColor || '#ff6600'}
                onChange={(e) => handleParamChange('revolution2DColor', e.target.value)}
                className="w-8 h-8 rounded border"
              />
              <span className="text-sm text-muted-foreground">
                {params.revolution2DColor || '#ff6600'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Opacidade da Forma 2D: {Math.round((params.revolution2DOpacity || 0.8) * 100)}%
            </Label>
            <Slider
              value={[params.revolution2DOpacity || 0.8]}
              onValueChange={([value]) => handleParamChange('revolution2DOpacity', value)}
              min={0.1}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Cor do Sólido 3D</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={params.revolution3DColor || '#3b82f6'}
                onChange={(e) => handleParamChange('revolution3DColor', e.target.value)}
                className="w-8 h-8 rounded border"
              />
              <span className="text-sm text-muted-foreground">
                {params.revolution3DColor || '#3b82f6'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Opacidade do Sólido 3D: {Math.round((params.revolution3DOpacity || 0.4) * 100)}%
            </Label>
            <Slider
              value={[params.revolution3DOpacity || 0.4]}
              onValueChange={([value]) => handleParamChange('revolution3DOpacity', value)}
              min={0.1}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-3d" className="text-sm font-medium">Mostrar Sólido 3D</Label>
            <Switch
              id="show-3d"
              checked={params.show3DSolid !== false} // Default true
              onCheckedChange={(checked) => handleBooleanChange('show3DSolid', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-path" className="text-sm font-medium">Mostrar Caminho</Label>
            <Switch
              id="show-path"
              checked={params.showRevolutionPath || false}
              onCheckedChange={(checked) => handleBooleanChange('showRevolutionPath', checked)}
            />
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              variant={isAnimating ? "destructive" : "default"}
              size="sm"
              onClick={toggleAnimation}
              className="flex-1"
            >
              {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isAnimating ? 'Pausar' : 'Iniciar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetRevolution}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
