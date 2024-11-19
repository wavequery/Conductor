# Tools

Modular components for specific tasks.

## Core Components
- `base-tool.ts`: Abstract base for all tools
- `tool-registry.ts`: Tool management and discovery
- `tool-validation.ts`: Input/output validation
- `retry-handler.ts`: Error handling and retries

## Data Tools
- `analysis.ts`: Data analysis and metrics
- `comparison.ts`: Dataset comparison
- `visualization.ts`: Data visualization specs

## Usage
```typescript
class MyTool extends BaseTool {
  async execute(input: any): Promise<ToolResult> {
    // Implementation
  }
}

const registry = new ToolRegistry();
registry.register(new MyTool(), ToolType.ANALYSIS);
```