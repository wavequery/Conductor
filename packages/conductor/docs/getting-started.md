# Getting Started with Conductor

## Overview
Conductor is a powerful LLM orchestration framework that allows you to build complex AI workflows using chains and agents, with built-in visualization capabilities.

## Installation

```bash
# Using npm
npm install @wavequery/conductor

# Using yarn
yarn add @wavequery/conductor
```

## Basic Setup

1. First, set up your environment variables:
```env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key  # Optional
```

2. Create your first application:

```typescript
import { 
  Chain, 
  OpenAIProvider, 
  BaseTool, 
  Tool, 
  ToolType 
} from '@wavequery/conductor';

// Initialize LLM provider
const llmProvider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  defaultModel: 'gpt-4'
});

// Create a simple tool
class SummaryTool extends BaseTool implements Tool {
  constructor() {
    super({
      name: "summarizer",
      type: ToolType.ANALYSIS,
      version: "0.0.1",
      description: "Summarizes text content"
    });
  }

  async execute(input: { text: string }): Promise<ToolResult> {
    // Tool implementation
    return {
      success: true,
      data: { summary: "Processed summary..." }
    };
  }
}

// Create a chain
const chain = new Chain({
  name: "summary-chain",
  llmProvider,
  tools: [new SummaryTool()],
  steps: [
    {
      name: "summarize",
      tool: "summarizer",
      input: {
        text: "Your text to summarize..."
      }
    }
  ]
});

// Execute the chain
const result = await chain.runAgentLoop({});
```

## Core Components

### 1. Chains
Orchestrate sequential operations using multiple tools:
```typescript
const chain = new Chain({
  name: "my-chain",
  tools: [/* tools */],
  steps: [/* steps */]
});
```

### 2. Agents
Handle complex tasks with dynamic tool selection:
```typescript
const agent = new Agent({
  name: "my-agent",
  tools: [/* tools */],
  maxIterations: 3
});
```

### 3. Tools
Building blocks for specific operations:
```typescript
class CustomTool extends BaseTool implements Tool {
  // Tool implementation
}
```

### 4. Visualization
Monitor operations in real-time:
```typescript
const vizServer = new VizServer({
  port: 3000,
  theme: "light"
});
```

## Key Features

1. **Type Safety**
   - Full TypeScript support
   - Runtime type checking
   - Automatic type inference

2. **Modular Design**
   - Custom tool creation
   - Multiple LLM provider support
   - Extensible architecture

3. **Real-time Monitoring**
   - Visual workflow tracking
   - Performance metrics
   - Debug capabilities

4. **Error Handling**
   - Graceful failure recovery
   - Detailed error reporting
   - Retry mechanisms

## Quick Examples

### 1. Text Analysis Chain
```typescript
const analysisChain = new Chain({
  name: "text-analysis",
  steps: [
    {
      name: "analyze",
      tool: "text-analyzer",
      input: { text: "Sample text" }
    }
  ]
});
```

### 2. Multi-Tool Agent
```typescript
const researchAgent = new Agent({
  name: "researcher",
  tools: [
    new WebSearchTool(),
    new SummaryTool(),
    new FactCheckTool()
  ]
});
```

## Best Practices

1. **Tool Design**
   - Keep tools focused and single-purpose
   - Implement proper error handling
   - Include detailed logging

2. **Chain Configuration**
   - Plan step sequence carefully
   - Handle data dependencies
   - Set appropriate timeouts

3. **Performance**
   - Use batch processing when possible
   - Implement caching strategies
   - Monitor resource usage

## Next Steps

1. Learn about [Chains vs Agents](./chains-and-agents.md)
2. Explore [Building Your First Chain](../guides/first-chain.md)
3. Check out [Example Projects](../../examples/)
4. Review [API Reference](../api/chain.md)