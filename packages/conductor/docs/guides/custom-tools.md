# Creating Custom Tools

## Overview
Learn how to create custom tools for your chains and agents. This guide covers tool design patterns.

## Tool Types
```typescript
enum ToolType {
  ANALYSIS = "analysis",
  GENERATION = "generation",
  TRANSFORMATION = "transformation",
  VALIDATION = "validation"
}

enum ToolExecutionMode {
  BATCH = "batch",
  STREAM = "stream"
}
```

## Basic Tool Structure

```typescript
class CustomTool extends BaseTool implements Tool {
  // Define LLM function schema
  private customFunction: LLMFunction = {
    name: "customOperation",
    description: "Perform custom operation",
    parameters: {
      type: "object",
      properties: {
        // Define your parameters
      },
      required: []
    }
  };

  constructor() {
    super({
      name: "custom-tool",
      type: ToolType.ANALYSIS,
      version: "0.0.1",
      description: "Custom tool description",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["data"],
        schema: {
          type: "object",
          properties: {
            data: { type: "object" }
          }
        }
      }
    });
  }

  async execute(input: any): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // Tool implementation
      return {
        success: true,
        data: { result: "processed" },
        metrics: {
          duration: Date.now() - startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metrics: {
          duration: Date.now() - startTime
        }
      };
    }
  }
}
```

## Tool Patterns

### 1. Analysis Tool
```typescript
class AnalysisTool extends BaseTool implements Tool {
  private analyzeFunction: LLMFunction = {
    name: "analyze",
    description: "Analyze data",
    parameters: {
      type: "object",
      properties: {
        findings: {
          type: "array",
          items: { type: "string" }
        },
        score: { type: "number" },
        confidence: { type: "number" }
      },
      required: ["findings", "score", "confidence"]
    }
  };

  async execute(input: any): Promise<ToolResult> {
    const llm = new OpenAIProvider({/*...*/});
    const response = await llm.completeWithFunctions(
      this.buildPrompt(input),
      [this.analyzeFunction]
    );

    return {
      success: true,
      data: response.functionCall?.arguments
    };
  }

  private buildPrompt(input: any): string {
    // Build prompt based on input
  }
}
```

### 2. Generation Tool
```typescript
class GenerationTool extends BaseTool implements Tool {
  private generateFunction: LLMFunction = {
    name: "generate",
    description: "Generate content",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string" },
        metadata: {
          type: "object",
          properties: {
            type: { type: "string" },
            tags: { type: "array", items: { type: "string" } }
          }
        }
      },
      required: ["content"]
    }
  };

  async execute(input: any): Promise<ToolResult> {
    // Implementation
  }
}
```

### 3. Transformation Tool
```typescript
class TransformationTool extends BaseTool implements Tool {
  private transformFunction: LLMFunction = {
    name: "transform",
    description: "Transform data",
    parameters: {
      type: "object",
      properties: {
        transformed: { type: "object" },
        changes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              from: { type: "string" },
              to: { type: "string" }
            }
          }
        }
      },
      required: ["transformed", "changes"]
    }
  };

  async execute(input: any): Promise<ToolResult> {
    // Implementation
  }
}
```

## Advanced Features

### 1. Input Validation
```typescript
class ValidatedTool extends BaseTool implements Tool {
  private validateInput(input: unknown): ValidationResult {
    // Implement validation
    return {
      success: true,
      data: input
    };
  }

  async execute(input: unknown): Promise<ToolResult> {
    const validation = await this.validateInput(input);
    if (!validation.success) {
      return {
        success: false,
        error: new Error("Invalid input"),
        data: validation.errors
      };
    }
    // Continue with execution
  }
}
```

### 2. Streaming Support
```typescript
class StreamingTool extends BaseTool implements Tool {
  constructor() {
    super({
      // ...other config
      executionMode: ToolExecutionMode.STREAM
    });
  }

  async *executeStream(input: any): AsyncGenerator<ToolResult> {
    // Yield partial results
    yield {
      success: true,
      data: { partial: "result" }
    };
  }
}
```

### 3. Context Awareness
```typescript
class ContextAwareTool extends BaseTool implements Tool {
  async execute(input: any, context?: ToolContext): Promise<ToolResult> {
    // Use context for enhanced processing
    const { sessionId, metadata } = context || {};
    
    // Implementation using context
  }
}
```

## Integration Examples

### 1. Chain Integration
```typescript
const chain = new Chain({
  name: "processing-chain",
  tools: [new CustomTool()],
  steps: [
    {
      name: "process",
      tool: "custom-tool",
      input: { data: "input" }
    }
  ]
});
```

### 2. Agent Integration
```typescript
const agent = new Agent({
  name: "processor",
  tools: [new CustomTool()]
});

const result = await agent.execute({
  instruction: "Process this data",
  data: { /* ... */ }
});
```

## Best Practices

1. **Error Handling**
```typescript
class RobustTool extends BaseTool implements Tool {
  async execute(input: any): Promise<ToolResult> {
    try {
      // Normal execution
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error,
          data: { validationDetails: error.details }
        };
      }
      // Handle other errors
    }
  }
}
```

2. **Metrics Collection**
```typescript
class MetricsTool extends BaseTool implements Tool {
  async execute(input: any): Promise<ToolResult> {
    const metrics = {
      startTime: Date.now(),
      memory: process.memoryUsage()
    };

    // Execute tool
    
    return {
      success: true,
      data: result,
      metrics: {
        duration: Date.now() - metrics.startTime,
        memory: process.memoryUsage(),
        // Add custom metrics
      }
    };
  }
}
```

3. **Documentation**
```typescript
/**
 * CustomTool processes data using specific algorithm
 * @implements {Tool}
 */
class CustomTool extends BaseTool implements Tool {
  /**
   * Execute tool operation
   * @param {Object} input - Tool input
   * @param {Object} input.data - Data to process
   * @returns {Promise<ToolResult>} Processing result
   */
  async execute(input: any): Promise<ToolResult> {
    // Implementation
  }
}
```

## Next Steps
- Learn about [Chain Integration](./first-chain.md)
- Explore [Agents](./agents.md)
- Master [Visualization](./visualization.md)