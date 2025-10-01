// ==========================================
// rendering/DrawingRenderer.ts - Lógica de renderização
// ==========================================

import { Stroke, Point } from '../types/drawing';
import { ToolConfig, TOOLS } from '../constants/drawing';
import { smoothPoints } from '../utils/smoothing';

export class DrawingRenderer {
  private ctx: CanvasRenderingContext2D;
  
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }
  
  clear(): void {
    const { width, height } = this.ctx.canvas;
    this.ctx.clearRect(0, 0, width, height);
  }
  
  renderStroke(stroke: Stroke, smoothingFactor: number): void {
    if (stroke.points.length < 2) return;
    
    const config = TOOLS[stroke.tool];
    const smoothed = smoothPoints(stroke.points, smoothingFactor);
    
    this.ctx.save();
    this.setupContext(stroke, config);
    this.drawPath(smoothed, stroke, config);
    this.addTexture(smoothed, stroke, config);
    this.ctx.restore();
  }
  
  private setupContext(stroke: Stroke, config: ToolConfig): void {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = stroke.color;
    this.ctx.globalCompositeOperation = 
      stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  }
  
  private drawPath(points: Point[], stroke: Stroke, config: ToolConfig): void {
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const curr = points[i - 1];
      const next = points[i];
      
      // Controle de pressão
      const pressure = curr.pressure;
      const width = stroke.baseThickness * config.thickness * (0.5 + pressure * 1.5);
      
      this.ctx.lineWidth = width;
      this.ctx.globalAlpha = config.opacity * (0.7 + pressure * 0.3);
      
      // Curva suave entre pontos
      const cpx = (curr.x + next.x) / 2;
      const cpy = (curr.y + next.y) / 2;
      this.ctx.quadraticCurveTo(curr.x, curr.y, cpx, cpy);
    }
    
    this.ctx.stroke();
  }
  
  private addTexture(points: Point[], stroke: Stroke, config: ToolConfig): void {
    if (config.texture !== 'rough') return;
    
    this.ctx.globalAlpha = config.opacity * 0.3;
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const offset = Math.random() * 2 - 1;
      
      this.ctx.beginPath();
      this.ctx.moveTo(curr.x + offset, curr.y + offset);
      this.ctx.lineTo(next.x + offset, next.y + offset);
      this.ctx.stroke();
    }
  }
}

