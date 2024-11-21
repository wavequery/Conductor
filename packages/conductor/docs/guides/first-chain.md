# Building Your First Chain

## Overview
Learn how to create a simple analysis chain that processes text through multiple stages. This guide will walk you through creating a basic chain with multiple tools and visualization.

## Prerequisites
```typescript
import {
  Chain,
  OpenAIProvider,
  BaseTool,
  Tool,
  ToolType,
  VizServer
} from '@wavequery/conductor';
```

## Step 1: Create Basic Tools

```typescript
class TextAnalyzerTool extends BaseTool implements Tool {
  private analyzeFunction: LLMFunction = {
    name: "analyzeText",
    description: "Analyze text content",
    parameters: {
      type: "object",
      properties: {
        sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
        topics: { type: "array", items: { type: "string" } },
        summary: { type: "string" }
      },
      required: ["sentiment", "topics", "summary"]
    }
  };

  constructor() {
    super({
      name: "text-analyzer",
      type: ToolType.ANALYSIS,
      version: "0.0.1",
      description: "Analyzes text content",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["text"],
        schema: {
          type: "object",
          properties: {
            text: { type: "string" }
          }
        }
      }
    });
  }

  async execute(input: { text: string }): Promise<ToolResult> {
    const llm = new OpenAIProvider({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await llm.completeWithFunctions(
      `Analyze this text: "${input.text}"`,
      [this.analyzeFunction]
    );

    return {
      success: true,
      data: response.functionCall?.arguments || response.content,
      metrics: { duration: Date.now() }
    };
  }
}

class SummarizerTool extends BaseTool implements Tool {
  // Similar implementation
}
```

## Step 2: Initialize Chain

```typescript
const chain = new Chain({
  name: "text-analysis-chain",
  llmProvider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY
  }),
  tools: [
    new TextAnalyzerTool(),
    new SummarizerTool()
  ],
  steps: [
    {
      name: "analyze",
      tool: "text-analyzer",
      input: {
        text: "Your input text here"
      }
    },
    {
      name: "summarize",
      tool: "summarizer",
      input: (prevResults) => ({
        text: prevResults.analyze.text,
        analysis: prevResults.analyze
      })
    }
  ]
});
```

## Step 3: Add Visualization

```typescript
const vizServer = new VizServer(3000);

const graphManager = {
  nodes: new Map(),
  edges: new Map(),
  
  initializeChain() {
    // Add chain node
    this.addNode({
      id: "analysis-chain",
      type: "system",
      label: "Text Analysis Chain",
      status: "pending"
    });

    // Add step nodes
    chain.steps.forEach((step, index) => {
      this.addNode({
        id: step.name,
        type: "tool",
        label: step.name,
        status: "pending"
      });

      this.addEdge({
        id: `flow-${index}`,
        source: index === 0 ? "analysis-chain" : chain.steps[index - 1].name,
        target: step.name,
        type: "flow"
      });
    });
  },

  // ... rest of graphManager implementation
};
```

## Step 4: Execute Chain

```typescript
async function runAnalysis() {
  try {
    // Initialize visualization
    graphManager.initializeChain();

    // Update chain status
    graphManager.updateNode("analysis-chain", {
      status: "running"
    });

    // Run chain
    const result = await chain.runAgentLoop({
      text: "Sample text for analysis"
    });

    // Update visualization with results
    chain.steps.forEach(step => {
      graphManager.updateNode(step.name, {
        status: "completed",
        data: {
          result: result.output[step.name],
          duration: result.metrics?.duration
        }
      });
    });

    graphManager.updateNode("analysis-chain", {
      status: "completed",
      data: {
        duration: result.metrics?.duration,
        totalSteps: result.steps?.length
      }
    });

    return result;
  } catch (error) {
    // Handle errors appropriately
    graphManager.updateNode("analysis-chain", {
      status: "error",
      data: { error }
    });
    throw error;
  }
}
```

## Step 5: Add Event Handling

```typescript
// Listen for chain events
chain.on("step", (step) => {
  graphManager.updateNode(step.name, {
    status: "completed",
    data: {
      duration: step.duration,
      output: step.output
    }
  });
});

// Listen for visualization events
vizServer.on("nodeClick", (node) => {
  console.log("Node clicked:", node);
  // Handle node interactions
});
```

## Complete Example

```typescript
async function main() {
  // Configure environment
  ConfigurationManager.getInstance().setConfig({
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    }
  });

  // Initialize visualization
  const vizServer = new VizServer(3000);
  const graphManager = createGraphManager(vizServer);

  // Create chain
  const chain = new Chain({
    name: "text-analysis",
    llmProvider: new OpenAIProvider(),
    tools: [
      new TextAnalyzerTool(),
      new SummarizerTool()
    ],
    steps: [
      {
        name: "analyze",
        tool: "text-analyzer",
        input: { text: "Sample text" }
      },
      {
        name: "summarize",
        tool: "summarizer",
        input: (prev) => ({
          text: prev.analyze.text,
          analysis: prev.analyze
        })
      }
    ]
  });

  try {
    // Initialize visualization
    graphManager.initializeChain(chain);

    // Run analysis
    const result = await chain.runAgentLoop({});

    console.log("Analysis completed:", result);
  } catch (error) {
    console.error("Analysis failed:", error);
  }
}

main().catch(console.error);
```

## Next Steps
- Learn about [Custom Tools](./custom-tools.md)
- Explore [Agent Integration](./agents.md)
- Understand [Error Handling](./error-handling.md)
- Master [Visualization](./visualization.md)