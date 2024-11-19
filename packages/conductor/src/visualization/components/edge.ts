import { GraphEdge, GraphNode } from "@/types/interfaces/visualization";

export interface EdgeComponentOptions {
  stroke?: string;
  strokeWidth?: number;
  arrowSize?: number;
  animated?: boolean;
  animationDuration?: number;
  dashArray?: number[];
  labelOffset?: number;
  labelFontSize?: number;
}

export class EdgeComponent {
  private options: Required<EdgeComponentOptions>;
  private animationOffset: number = 0;
  private animationFrame: number | null = null;

  constructor(options: EdgeComponentOptions = {}) {
    this.options = {
      stroke: "#999",
      strokeWidth: 2,
      arrowSize: 10,
      animated: false,
      animationDuration: 1500,
      dashArray: [5, 5],
      labelOffset: 20,
      labelFontSize: 12,
      ...options,
    };
  }

  render(
    context: CanvasRenderingContext2D,
    edge: GraphEdge,
    sourceNode: GraphNode,
    targetNode: GraphNode
  ) {
    context.save();

    // Calculate edge path
    const { start, end, controlPoints } = this.calculateEdgePath(
      sourceNode,
      targetNode
    );

    // Draw edge
    context.beginPath();
    context.moveTo(start.x, start.y);

    if (controlPoints.length === 2) {
      context.bezierCurveTo(
        controlPoints[0].x,
        controlPoints[0].y,
        controlPoints[1].x,
        controlPoints[1].y,
        end.x,
        end.y
      );
    } else {
      context.lineTo(end.x, end.y);
    }

    // Apply style
    context.strokeStyle = this.options.stroke;
    context.lineWidth = this.options.strokeWidth;

    // Handle animation
    if (this.options.animated) {
      context.setLineDash(this.options.dashArray);
      context.lineDashOffset = -this.animationOffset;
      this.updateAnimation();
    }

    context.stroke();

    // Draw arrow
    this.drawArrow(context, end, this.calculateAngle(start, end));

    // Draw label if exists
    if (edge.label) {
      this.drawLabel(context, edge.label, start, end);
    }

    context.restore();
  }

  private calculateEdgePath(source: GraphNode, target: GraphNode) {
    const start = { x: source.position!.x, y: source.position!.y };
    const end = { x: target.position!.x, y: target.position!.y };
    const controlPoints: Array<{ x: number; y: number }> = [];

    // Calculate control points for curved edges if nodes are close
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 150) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const normalX = -dy / distance;
      const normalY = dx / distance;

      controlPoints.push(
        { x: midX + normalX * 50, y: midY + normalY * 50 },
        { x: midX + normalX * 50, y: midY + normalY * 50 }
      );
    }

    return { start, end, controlPoints };
  }

  private calculateAngle(
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): number {
    return Math.atan2(end.y - start.y, end.x - start.x);
  }

  private drawArrow(
    context: CanvasRenderingContext2D,
    position: { x: number; y: number },
    angle: number
  ) {
    const arrowSize = this.options.arrowSize;

    context.save();
    context.translate(position.x, position.y);
    context.rotate(angle);

    context.beginPath();
    context.moveTo(-arrowSize, -arrowSize / 2);
    context.lineTo(0, 0);
    context.lineTo(-arrowSize, arrowSize / 2);

    context.strokeStyle = this.options.stroke;
    context.lineWidth = this.options.strokeWidth;
    context.stroke();

    context.restore();
  }

  private drawLabel(
    context: CanvasRenderingContext2D,
    label: string,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    context.font = `${this.options.labelFontSize}px Arial`;
    context.fillStyle = this.options.stroke;
    context.textAlign = "center";
    context.textBaseline = "middle";

    // Draw background for better readability
    const metrics = context.measureText(label);
    const padding = 4;

    context.fillStyle = "rgba(255, 255, 255, 0.8)";
    context.fillRect(
      midX - metrics.width / 2 - padding,
      midY - this.options.labelFontSize / 2 - padding,
      metrics.width + padding * 2,
      this.options.labelFontSize + padding * 2
    );

    context.fillStyle = this.options.stroke;
    context.fillText(label, midX, midY);
  }

  private updateAnimation() {
    if (!this.options.animated) return;

    this.animationOffset =
      (this.animationOffset + 1) %
      (this.options.dashArray[0] + this.options.dashArray[1]);

    this.animationFrame = requestAnimationFrame(() => this.updateAnimation());
  }

  public dispose() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
