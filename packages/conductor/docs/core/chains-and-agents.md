# Understanding Chains vs Agents

## Overview

Conductor offers two primary ways to orchestrate LLM operations: Chains and Agents. Understanding when to use each is crucial for building efficient applications.

## Chains

### Definition
Chains are predetermined sequences of operations where each step is explicitly defined.

```typescript
interface ChainConfig extends AgentConfig {
  steps: Array<{
    name: string;
    tool?: string;
    prompt?: string;
    input?: Record<string, any>;
  }>;
}
```

### Key Characteristics
1. **Sequential Execution**: Steps run in a predefined order
2. **Data Flow Control**: Results from previous steps can be used in subsequent steps
3. **Deterministic**: Same input produces same execution path
4. **Visualization Ready**: Easy to visualize and monitor

### Example
```typescript
const analysisChain = new Chain({
  name: "market-analysis-chain",
  llmProvider: new OpenAIProvider({...}),
  tools: [technicalAnalyzer, sentimentAnalyzer, riskAnalyzer],
  steps: [
    {
      name: "technical-analysis",
      tool: "technical-analyzer",
      input: {
        marketData: {
          symbol: "AAPL",
          indicators: {/*...*/}
        }
      }
    },
    {
      name: "sentiment-analysis",
      tool: "sentiment-analyzer",
      input: {
        symbol: "AAPL"
      }
    }
  ]
});
```

## Agents

### Definition
Agents are dynamic decision-makers that can choose tools and actions based on context.

```typescript
interface AgentConfig {
  name: string;
  llmProvider: LLMProvider;
  tools: Tool[];
  maxIterations?: number;
  defaultTimeout?: number;
}
```

### Key Characteristics
1. **Dynamic Execution**: Chooses tools based on context
2. **Autonomous**: Makes decisions about next steps
3. **Flexible**: Can handle varying scenarios
4. **Self-Correcting**: Can retry or change approach

### Example
```typescript
const strategyAgent = new Agent({
  name: "strategy-agent",
  llmProvider: new OpenAIProvider({...}),
  tools: [strategyGenerator, reportGenerator],
  maxIterations: 3,
  defaultTimeout: 30000
});

const result = await agent.execute({
  analysis: chainResult.output,
  instruction: "Generate trading strategy and report"
});
```

## Comparison

| Feature | Chain | Agent |
|---------|-------|-------|
| Execution Flow | Predetermined | Dynamic |
| Tool Selection | Fixed per step | Context-based |
| Error Handling | Step-specific | Adaptive |
| Visualization | Linear graph | Dynamic graph |
| Use Case | Known workflows | Complex reasoning |
| Performance | More predictable | Can vary |
| Debugging | Easier | More complex |

## When to Use What

### Use Chains When:
1. Process is well-defined
2. Steps are sequential
3. Data flow is predictable
4. Monitoring is crucial
5. Performance is critical

### Use Agents When:
1. Task requires reasoning
2. Steps are not predetermined
3. Multiple approaches possible
4. Flexibility is needed
5. Complex decision-making required

## Combined Usage

Often, the most powerful applications combine both:

```typescript
// Chain for structured analysis
const analysisChain = new Chain({
  name: "analysis",
  tools: [analyzer1, analyzer2]
});

// Agent for strategic decisions
const strategyAgent = new Agent({
  name: "strategist",
  tools: [generator1, generator2]
});

// Combined workflow
const chainResult = await analysisChain.runAgentLoop({});
const finalResult = await strategyAgent.execute({
  analysis: chainResult.output
});
```

## Best Practices

1. **Chain Best Practices**
   - Define clear step dependencies
   - Handle errors at each step
   - Use proper input/output validation
   - Implement timeout handling

2. **Agent Best Practices**
   - Set reasonable iteration limits
   - Provide clear instructions
   - Monitor resource usage
   - Implement fallback strategies

## Performance Considerations

1. **Chains**
   - Predictable resource usage
   - Easy to optimize
   - Clear performance bottlenecks
   - Cacheable results

2. **Agents**
   - Variable resource usage
   - Need iteration limits
   - May require optimization
   - Less predictable caching

## Monitoring and Debugging

Both Chains and Agents support comprehensive monitoring through the `VizServer`:

```typescript
const vizServer = new VizServer({
  theme: "light"
});

// Monitor execution
chain.on("step", (step) => {
  vizServer.updateNode(step.name, {
    status: "completed",
    data: { duration: step.duration }
  });
});
```

## Related Topics
- [Tool Creation](../guides/custom-tools.md)
- [Visualization](./visualization.md)
- [Error Handling](../guides/error-handling.md)
- [Performance](../guides/performance.md)