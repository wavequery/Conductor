import { GraphNode } from '@/types/interfaces/visualization';

export interface NodeComponentOptions {
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  labelOffset?: number;
}

export class NodeComponent {
  private options: Required<NodeComponentOptions>;

  constructor(options: NodeComponentOptions = {}) {
    this.options = {
      radius: 20,
      fill: '#fff',
      stroke: '#333',
      strokeWidth: 2,
      labelOffset: 30,
      ...options
    };
  }

  render(context: CanvasRenderingContext2D, node: GraphNode) {
    // Draw circle
    context.beginPath();
    context.arc(node.position!.x, node.position!.y, this.options.radius, 0, Math.PI * 2);
    context.fillStyle = this.getNodeColor(node.status);
    context.fill();
    context.strokeStyle = this.options.stroke;
    context.lineWidth = this.options.strokeWidth;
    context.stroke();

    // Draw label
    context.fillStyle = this.options.stroke;
    context.font = '12px Arial';
    context.textAlign = 'center';
    context.fillText(
      node.label,
      node.position!.x,
      node.position!.y + this.options.labelOffset
    );
  }

  private getNodeColor(status?: string): string {
    switch (status) {
      case 'running': return '#3498db';
      case 'completed': return '#2ecc71';
      case 'error': return '#e74c3c';
      case 'pending': return '#95a5a6';
      default: return this.options.fill;
    }
  }
}