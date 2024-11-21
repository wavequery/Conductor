# Real-time Visualization Guide

## Overview
Learn how to visualize your LLM workflows in real-time using Conductor's visualization system. This guide covers setup, customization, and best practices for creating interactive visualizations.

## Basic Setup

```typescript
import { VizServer, GraphNode, GraphEdge } from '@wavequery/conductor';

// Initialize visualization server
const vizServer = new VizServer(3000, {
  theme: "light",
  autoLayout: true,
  fitView: true
});

// Create basic graph manager
const graphManager = {
  nodes: new Map<string, GraphNode>(),
  edges: new Map<string, GraphEdge>(),
  
  addNode(node: GraphNode) {
    this.nodes.set(node.id, node);
    this.updateViz();
  },
  
  addEdge(edge: GraphEdge) {
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
```

## Node Types and States

```typescript
// Available node types
type NodeType = 'agent' | 'tool' | 'llm' | 'data' | 'system' | 'metric';

// Node states
type NodeStatus = 'pending' | 'running' | 'completed' | 'error' | 'warning';

// Example node creation
graphManager.addNode({
  id: "analysis-tool",
  type: "tool",
  label: "Text Analysis",
  status: "pending",
  data: {
    description: "Analyzes text content",
    metrics: { duration: 0 }
  }
});

// Update node status
graphManager.updateNode("analysis-tool", {
  status: "completed",
  data: {
    metrics: { duration: 1500 },
    result: { sentiment: "positive" }
  }
});
```

## Edge Types and Animation

```typescript
// Available edge types
type EdgeType = 'flow' | 'data' | 'control';

// Create animated edge
graphManager.addEdge({
  id: "flow-1",
  source: "tool-1",
  target: "tool-2",
  type: "flow",
  label: "processes",
  animated: true
});

// Update edge animation
vizServer.updateGraph({
  edges: [{
    id: "flow-1",
    animated: false,
    data: { transferComplete: true }
  }]
});
```

## Visualization Patterns

### 1. Chain Visualization
```typescript
function visualizeChain(chain: Chain) {
  // Add chain node
  graphManager.addNode({
    id: chain.name,
    type: "system",
    label: "Analysis Chain",
    status: "running"
  });

  // Add and connect tools
  chain.steps.forEach((step, index) => {
    // Add tool node
    graphManager.addNode({
      id: step.name,
      type: "tool",
      label: step.name,
      status: "pending"
    });

    // Connect to previous node
    graphManager.addEdge({
      id: `flow-${index}`,
      source: index === 0 ? chain.name : chain.steps[index - 1].name,
      target: step.name,
      type: "flow",
      animated: true
    });
  });

  // Monitor progress
  chain.on("step", (step) => {
    graphManager.updateNode(step.name, {
      status: "completed",
      data: {
        duration: step.duration,
        result: step.output
      }
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
    label: agent.name,
    status: "running"
  });

  // Add tool nodes
  agent.tools.forEach(tool => {
    graphManager.addNode({
      id: tool.name,
      type: "tool",
      label: tool.name,
      status: "pending"
    });

    // Connect agent to tool
    graphManager.addEdge({
      id: `agent-${tool.name}`,
      source: agent.name,
      target: tool.name,
      type: "control",
      animated: true
    });
  });
}
```

## Interactive Features

### 1. Node Click Handling
```typescript
vizServer.on("nodeClick", (node: GraphNode) => {
  console.log(`Node clicked: ${node.id}`);
  
  // Show node details
  if (node.type === "tool") {
    showToolDetails(node);
  }
});

function showToolDetails(node: GraphNode) {
  // Update node with details panel
  graphManager.updateNode(node.id, {
    data: {
      ...node.data,
      showDetails: true
    }
  });
}
```

### 2. Layout Control
```typescript
// Pin node to specific position
vizServer.pinNode("important-node", {
  x: 100,
  y: 100
});

// Unpin node
vizServer.unpinNode("important-node");

// Fit view to show all nodes
vizServer.fitView(50); // 50px padding
```

## Real-time Updates

### 1. Status Updates
```typescript
function updateNodeStatus(nodeId: string, status: NodeStatus, data?: any) {
  graphManager.updateNode(nodeId, {
    status,
    data: {
      ...graphManager.nodes.get(nodeId)?.data,
      ...data,
      updatedAt: new Date().toISOString()
    }
  });
}

// Usage
updateNodeStatus("tool-1", "running", {
  progress: 0.5,
  currentStep: "processing"
});
```

### 2. Batch Updates
```typescript
function batchUpdate(updates: Array<[string, Partial<GraphNode>]>) {
  // Collect all updates
  const updatedNodes = updates.map(([nodeId, update]) => ({
    ...graphManager.nodes.get(nodeId),
    ...update,
    id: nodeId
  }));

  // Single visualization update
  vizServer.updateGraph({
    nodes: updatedNodes
  });
}

// Usage
batchUpdate([
  ["node1", { status: "completed" }],
  ["node2", { status: "running" }],
  ["node3", { status: "pending" }]
]);
```

## Styling and Theming

```typescript
const vizServer = new VizServer(3000, {
  theme: "light",
  nodeTypes: {
    tool: {
      shape: "rectangle",
      width: 120,
      height: 40,
      style: {
        fill: "#f3f4f6",
        stroke: "#d1d5db"
      }
    },
    agent: {
      shape: "circle",
      radius: 30,
      style: {
        fill: "#3b82f6",
        stroke: "#2563eb"
      }
    }
  },
  edgeTypes: {
    flow: {
      style: {
        stroke: "#6366f1",
        strokeWidth: 2
      }
    },
    control: {
      style: {
        stroke: "#8b5cf6",
        strokeDasharray: "5,5"
      }
    }
  }
});
```

## Performance Optimization

```typescript
// Batch multiple updates
let pendingUpdates: Array<[string, Partial<GraphNode>]> = [];

function queueUpdate(nodeId: string, update: Partial<GraphNode>) {
  pendingUpdates.push([nodeId, update]);
  
  if (pendingUpdates.length === 1) {
    requestAnimationFrame(flushUpdates);
  }
}

function flushUpdates() {
  if (pendingUpdates.length > 0) {
    batchUpdate(pendingUpdates);
    pendingUpdates = [];
  }
}

// Clean up unused nodes
function cleanupNodes(activeNodeIds: Set<string>) {
  const currentNodes = Array.from(graphManager.nodes.keys());
  
  currentNodes.forEach(nodeId => {
    if (!activeNodeIds.has(nodeId)) {
      graphManager.nodes.delete(nodeId);
    }
  });
  
  graphManager.updateViz();
}
```

## Best Practices

1. **Node Management**
```typescript
// Use meaningful IDs
graphManager.addNode({
  id: `${tool.type}-${tool.name}-${Date.now()}`,
  type: "tool",
  label: tool.name
});

// Keep node data clean
function sanitizeNodeData(data: any) {
  const { sensitive, ...rest } = data;
  return rest;
}
```

2. **Error Handling**
```typescript
function handleError(nodeId: string, error: Error) {
  graphManager.updateNode(nodeId, {
    status: "error",
    data: {
      error: {
        message: error.message,
        timestamp: new Date().toISOString()
      }
    }
  });

  // Show error in UI
  vizServer.highlightNode(nodeId);
}
```

3. **Memory Management**
```typescript
// Clean up on completion
function onWorkflowComplete() {
  graphManager.nodes.clear();
  graphManager.edges.clear();
  graphManager.updateViz();
}

// Remove old nodes
function pruneOldNodes(maxAge: number) {
  const now = Date.now();
  Array.from(graphManager.nodes.entries())
    .forEach(([id, node]) => {
      const age = now - new Date(node.data?.createdAt).getTime();
      if (age > maxAge) {
        graphManager.nodes.delete(id);
      }
    });
  graphManager.updateViz();
}
```

## Next Steps
- Explore [Chain Integration](./first-chain.md)
- Learn about [Agents](./agents.md)
- Study [Custom Tools](./custom-tools.md)