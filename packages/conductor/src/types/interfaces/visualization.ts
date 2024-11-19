import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

export type NodeType = 'agent' | 'tool' | 'llm' | 'data' | 'system';
export type EdgeType = 'flow' | 'data' | 'control';
export type ThemeType = 'light' | 'dark';
export type NodeStatus = 'pending' | 'running' | 'completed' | 'error';

export interface Position {
  x: number;
  y: number;
}

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  type: NodeType;
  label: string;
  position?: Position;
  data?: Record<string, unknown>;
  status?: NodeStatus;
  fixed?: boolean;
  style?: Record<string, string | number>;
}

export interface GraphEdge extends SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  data?: Record<string, unknown>;
  type: EdgeType;
  label?: string;
  animated?: boolean;
  style?: Record<string, string | number>;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface StyleConfig {
  [key: string]: string | number | undefined;
}

export interface VisualizationConfig {
  theme?: ThemeType;
  autoLayout?: boolean;
  fitView?: boolean;
  interactive?: boolean;
  nodeTypes?: Record<NodeType, StyleConfig>;
  edgeTypes?: Record<EdgeType, StyleConfig>;
}

export interface VisualizationEvents {
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  onViewportChange?: (viewport: { x: number; y: number; zoom: number }) => void;
}

export interface Layout {
  name: string;
  init: (nodes: GraphNode[], edges: GraphEdge[]) => void;
  step: () => void;
  stop: () => void;
}

export interface DragEvent extends d3.D3DragEvent<SVGGElement, GraphNode, unknown> {
  subject: GraphNode;
}

export interface ZoomEvent extends d3.D3ZoomEvent<SVGSVGElement, unknown> {
  transform: d3.ZoomTransform;
}

export interface VisualizationControls {
  zoom?: boolean;
  pan?: boolean;
  fit?: boolean;
  expand?: boolean;
  pause?: boolean;
}