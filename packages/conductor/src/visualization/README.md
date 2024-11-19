# Visualization

Real-time visualization of LLM executions.

## Components
- `graph-renderer.ts`: D3-based graph visualization
- `viz-server.ts`: WebSocket server for real-time updates
- `event-stream.ts`: Event handling for updates
- `components/`: Reusable graph components

## Usage
```typescript
const viz = new VizServer(3000);
viz.updateGraph({
  nodes: [...],
  edges: [...]
});
```