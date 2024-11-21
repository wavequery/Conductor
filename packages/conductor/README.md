# Conductor | LLM Orchestration Framework

![DEMO](https://s11.gifyu.com/images/SGsPZ.gif)

<div align="center">
  <p>
      <h3>Orchestrate, Visualize, and Master Your LLM Workflows</h3>
  <p>
    <a href="https://www.npmjs.com/package/@wavequery/conductor">
      <img src="https://img.shields.io/npm/v/@wavequery/conductor.svg" alt="npm version" />
    </a>
    <img src="https://img.shields.io/badge/TypeScript-Ready-blue" alt="TypeScript Ready" />
    <img src="https://img.shields.io/badge/Node.js-%3E%3D20-green" alt="Node.js Version" />
  </p>
  </p>
</div>

Build powerful AI applications with real-time visualization and dynamic orchestration. Conductor helps you create, monitor, and control complex LLM workflows through an intuitive chain and agent system.

## Features

- **Chain & Agent System**: Build complex workflows combining multiple LLM tools
- **Real-time Visualization**: Monitor your LLM operations with interactive graphs
- **Modular Architecture**: Easily extend with custom tools and capabilities
- **Multiple LLM Support**: Works with OpenAI, Anthropic, and more
- **Performance Tracking**: Built-in metrics and logging
- **Type Safety**: Full TypeScript support
- **Customizable UI**: Flexible visualization options

## 🚀 Quick Start

```bash
npm install @wavequery/conductor
# or
yarn add @wavequery/conductor
```

### Create Your First Chain
```typescript
import { Chain, OpenAIProvider, VizServer } from '@wavequery/conductor';

// Initialize visualization
const vizServer = new VizServer(3000);

// Create your chain
const chain = new Chain({
  name: "analysis-chain",
  llmProvider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY
  }),
  tools: [analyzerTool, summarizerTool],
  steps: [
    {
      name: "analyze",
      tool: "analyzer",
      input: { text: "Your text here" }
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

// Execute and visualize
const result = await chain.runAgentLoop({});
// Visit http://localhost:3000 to see your workflow in action
```

## Featured Examples

### Market Analysis System
```typescript
const analysisChain = new Chain({
  name: "market-analysis",
  tools: [technicalAnalyzer, sentimentAnalyzer, riskAnalyzer],
  steps: [/* steps */]
});

const strategyAgent = new Agent({
  name: "strategy-agent",
  tools: [strategyGenerator, reportGenerator]
});

// Real-time visualization included!
```
[View Full Example →](examples/basic/src/04-multi-tool-agent-visualization.ts)

## 📚 Documentation

### Core Concepts
- [Getting Started](packages/conductor/docs/getting-started.md)
- [Chains vs Agents](packages/conductor/docs/core/chains-and-agents.md)
- [Visualization System](packages/conductor/docs/core/visualization.md)

### Guides
- [Building Your First Chain](packages/conductor/docs/guides/first-chain.md)
- [Creating Custom Tools](packages/conductor/docs/guides/custom-tools.md)
- [Working with Agents](packages/conductor/docs/guides/agents.md)
- [Real-time Visualization](packages/conductor/docs/guides/visualization.md)

### Example Projects
- [📝 Text Analysis](packages/conductor/docs/examples/text-analysis/README.md)
  - Single Agent with Tool
  - Real-time visualization
- [📊 Market Analysis](packages/conductor/docs/examples/market-analysis/README.md)
  - Multi-Chain workflow
  - Agent-based decision making
- [✍️ Content Generation](packages/conductor/docs/examples/content-generation/README.md)
  - Pipeline architecture
  - Multiple tool coordination

## Requirements

- Node.js >= 20.0.0
- OpenAI API key and/or Anthropic API key
- Environment variables setup (see [Configuration Guide](packages/conductor/docs/getting-started.md))

## Contributing

We are extremely open to contributions, whether it be in the form of a new feature, improved infrastructure, or better documentation.

Please make a PR on github! Contribution guide will be added soon.

## License

MIT © [WaveQuery](https://wavequery.com/)
