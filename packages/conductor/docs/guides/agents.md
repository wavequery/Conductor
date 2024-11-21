# Working with Agents

## Overview
Learn how to create and work with Agents, which are dynamic decision-makers that can choose and execute tools based on context and goals.

## Basic Agent Structure
```typescript
interface AgentConfig {
  name: string;
  llmProvider: LLMProvider;
  tools: Tool[];
  maxIterations?: number;
  defaultTimeout?: number;
}

// Initialize agent
const agent = new Agent({
  name: "research-agent",
  llmProvider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: "gpt-4o"
  }),
  tools: [/* your tools */],
  maxIterations: 3,
  defaultTimeout: 30000
});
```

## Agent with Tools Example

```typescript
// Define agent tools
class SearchTool extends BaseTool implements Tool {
  private searchFunction: LLMFunction = {
    name: "search",
    description: "Search for information",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        filters: { 
          type: "object",
          properties: {
            date: { type: "string" },
            source: { type: "string" }
          }
        }
      },
      required: ["query"]
    }
  };

  async execute(input: any): Promise<ToolResult> {
    // Implementation
  }
}

class AnalysisTool extends BaseTool implements Tool {
  // Tool implementation
}

// Create agent with tools
const researchAgent = new Agent({
  name: "researcher",
  llmProvider: new OpenAIProvider({/*...*/}),
  tools: [
    new SearchTool(),
    new AnalysisTool()
  ]
});

// Execute agent
const result = await researchAgent.execute({
  instruction: "Research AI advancements in 2024",
  context: {
    depth: "technical",
    focus: ["machine learning", "neural networks"]
  }
});
```

## Agent with Visualization

```typescript
const vizServer = new VizServer(3000);

function visualizeAgent(agent: Agent) {
  // Add agent node
  vizServer.updateGraph({
    nodes: [{
      id: agent.name,
      type: "agent",
      label: agent.name,
      status: "running"
    }]
  });

  // Add tool nodes and connections
  const toolNodes = agent.tools.map(tool => ({
    id: tool.name,
    type: "tool",
    label: tool.name,
    status: "pending"
  }));

  const toolEdges = agent.tools.map(tool => ({
    id: `${agent.name}-${tool.name}`,
    source: agent.name,
    target: tool.name,
    type: "control"
  }));

  vizServer.updateGraph({
    nodes: toolNodes,
    edges: toolEdges
  });
}

// Monitor agent execution
agent.on("toolStart", (toolName) => {
  vizServer.updateNode(toolName, { 
    status: "running" 
  });
});

agent.on("toolComplete", (toolName, result) => {
  vizServer.updateNode(toolName, {
    status: "completed",
    data: { result }
  });
});
```


## Integration Patterns

### 1. Chain and Agent Combination
```typescript
// Chain for structured analysis
const analysisChain = new Chain({/*...*/});

// Agent for dynamic decisions
const strategyAgent = new Agent({/*...*/});

async function processData(data: any) {
  // Run chain first
  const analysis = await analysisChain.runAgentLoop({
    data
  });

  // Use analysis results with agent
  const strategy = await strategyAgent.execute({
    instruction: "Generate strategy",
    context: { analysis }
  });

  return {
    analysis,
    strategy
  };
}
```

### 2. Multiple Agents Collaboration
```typescript
class AgentCoordinator {
  private agents: Map<string, Agent>;
  
  constructor(agents: Agent[]) {
    this.agents = new Map(
      agents.map(agent => [agent.name, agent])
    );
  }

  async coordinate(task: any): Promise<any> {
    // Distribute subtasks to appropriate agents
    const results = new Map();
    
    for (const [name, agent] of this.agents) {
      const result = await agent.execute({
        instruction: task[name],
        context: {
          previousResults: Object.fromEntries(results)
        }
      });
      
      results.set(name, result);
    }

    return results;
  }
}
```

## Best Practices

1. **Clear Instructions**
```typescript
await agent.execute({
  instruction: `
    Analyze market trends with these requirements:
    1. Focus on tech sector
    2. Consider last 6 months
    3. Identify key patterns
    4. Provide actionable insights
  `,
  context: {
    dataSource: "market-data",
    depth: "detailed"
  }
});
```

2. **Resource Management**
```typescript
const agent = new Agent({
  maxIterations: 5,
  defaultTimeout: 30000,
  resourceLimits: {
    maxTokens: 4000,
    maxCost: 0.50
  }
});
```

3. **Monitoring and Logging**
```typescript
agent.on("start", (context) => {
  logger.info("Agent started", { agentId: agent.name, context });
});

agent.on("toolSelect", (toolName, context) => {
  logger.debug("Tool selected", { tool: toolName, context });
});

agent.on("complete", (result) => {
  logger.info("Agent completed", { 
    agentId: agent.name,
    duration: result.metrics.duration
  });
});
```

## Next Steps
- Learn about [Tool Creation](./custom-tools.md)
- Explore [Visualization](./visualization.md)
- Study [Chain Integration](./first-chain.md)