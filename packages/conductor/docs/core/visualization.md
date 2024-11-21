# Visualization System

## Understanding the Architecture

Conductor's visualization system (powered by D3 on browser) is designed with a flexible, decoupled architecture that puts you in control of what and how to visualize your LLM workflows.

### Core Concept

The visualization system consists of two main components:
1. A WebSocket-based visualization server (provided by Conductor)
2. A browser-based client (automatically served by the visualization server)

```typescript
import { VizServer } from '@wavequery/conductor';

// Initialize visualization server
const vizServer = new VizServer(3000, {
  theme: "light"
});

// Update visualization with your data
vizServer.updateGraph({
  nodes: [/* your nodes */],
  edges: [/* your edges */]
});
```

### Why This Design?

1. **Separation of Concerns**: 
   - The package doesn't make assumptions about your data structure or workflow
   - You control what gets visualized and when
   - No intrusive package manager or global state

2. **Flexibility**:
   - Visualize any part of your system
   - Create custom visualization patterns
   - Integrate with existing monitoring systems

3. **Real-time Control**:
   - Update visualization on demand
   - Control node and edge appearances
   - Handle dynamic workflows

## Basic Example

```typescript
import { VizServer, Chain, Agent } from '@wavequery/conductor';

// Initialize visualization
const vizServer = new VizServer(3000);

// Create graph manager for convenience
const graphManager = {
  nodes: new Map(),
  edges: new Map(),
  
  addNode(node) {
    this.nodes.set(node.id, node);
    this.updateViz();
  },
  
  addEdge(edge) {
    this.edges.set(edge.id, edge);
    this.updateViz();
  },
  
  updateViz() {
    vizServer.updateGraph({
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values())
    });
  }
};

// Add your workflow elements
graphManager.addNode({
  id: "chain-1",
  type: "system",
  label: "Analysis Chain",
  status: "running"
});

// Update status when needed
graphManager.updateNode("chain-1", {
  status: "completed",
  data: { duration: 1500 }
});
```

## Visualization Components

### 1. Node Types
```typescript
type NodeType = 'agent' | 'tool' | 'llm' | 'data' | 'system' | 'metric';

interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  status?: 'pending' | 'running' | 'completed' | 'error';
  data?: Record;
}
```

### 2. Edge Types
```typescript
type EdgeType = 'flow' | 'data' | 'control';

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  animated?: boolean;
}
```

## Integration Patterns

### 1. Chain Visualization
```typescript
function visualizeChain(chain: Chain) {
  // Add chain node
  graphManager.addNode({
    id: chain.name,
    type: "system",
    label: chain.name
  });

  // Add tool nodes
  chain.steps.forEach((step, index) => {
    graphManager.addNode({
      id: step.name,
      type: "tool",
      label: step.name
    });

    graphManager.addEdge({
      id: `flow-${index}`,
      source: index === 0 ? chain.name : chain.steps[index - 1].name,
      target: step.name,
      type: "flow"
    });
  });
}
```

### 2. Agent Visualization
```typescript
function visualizeAgent(agent: Agent) {
  // Add agent node
  graphManager.addNode({
    id: agent.name,
    type: "agent",
    label: agent.name
  });

  // Add tool nodes
  agent.tools.forEach(tool => {
    graphManager.addNode({
      id: tool.name,
      type: "tool",
      label: tool.name
    });

    graphManager.addEdge({
      id: `tool-${tool.name}`,
      source: agent.name,
      target: tool.name,
      type: "control"
    });
  });
}
```

## Browser Visualization

The visualization server automatically serves a browser client that:
- Renders an interactive graph visualization
- Supports zooming, panning, and node dragging
- Shows node and edge details on hover
- Updates in real-time
- Provides performance metrics

To view your visualization:
1. Start your application with visualization enabled
2. Open a browser to `http://localhost:3000` (or your configured port)
3. See your workflow in action

## Customization

### 1. Theme Configuration
```typescript
const vizServer = new VizServer(3000, {
  theme: "dark",
  nodeTypes: {
    agent: { shape: "circle", size: 40 },
    tool: { shape: "rectangle", width: 120 }
  }
});
```

### 2. Layout Options
```typescript
const vizServer = new VizServer(8080);
```

## Best Practices

1. **Node Management**:
   - Use meaningful node IDs
   - Update statuses promptly
   - Clean up completed nodes

2. **Edge Visualization**:
   - Use appropriate edge types
   - Keep labels concise
   - Use animation sparingly

3. **Performance**:
   - Batch updates when possible
   - Limit number of visible nodes
   - Clean up disconnected nodes

## Examples

See complete examples:
- [Market Analysis Visualization](../examples/market-analysis/README.md)

