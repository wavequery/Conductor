# WaveQuery LLM Conductor Framework

![DEMO](https://s11.gifyu.com/images/SGsPZ.gif)

<div align="center">
  <p>
    <a href="https://www.npmjs.com/package/@wavequery/conductor">
      <img src="https://img.shields.io/npm/v/@wavequery/conductor.svg" alt="npm version" />
    </a>
    <a href="https://github.com/wavequery/conductor/blob/main/LICENSE">
      <img src="https://img.shields.io/npm/l/@wavequery/conductor.svg" alt="license" />
    </a>
    <a href="https://github.com/wavequery/conductor/tree/main/examples">
      <img src="https://img.shields.io/badge/examples-view%20demos-blue.svg" alt="examples" />
    </a>
  </p>
</div>


An advanced LLM orchestration framework for building intelligent applications with real-time visualization capabilities. Build complex AI workflows by combining chains and agents with visualization tools.

## ✨ Features

-  **Chain & Agent System**: Build complex workflows combining multiple LLM tools
-  **Real-time Visualization**: Monitor your LLM operations with interactive graphs
-  **Modular Architecture**: Easily extend with custom tools and capabilities
-  **Multiple LLM Support**: Works with OpenAI, Anthropic, and more
- **Performance Tracking**: Built-in metrics and logging
- **Type Safety**: Full TypeScript support
- **Customizable UI**: Flexible visualization options

## 🚀 Quick Start

```bash
npm install @wavequery/conductor
# or
yarn add @wavequery/conductor
```

### Basic Chain Example
```typescript
import { Chain, OpenAIProvider } from '@wavequery/conductor';

const chain = new Chain({
  name: "simple-chain",
  llmProvider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY
  }),
  tools: [/* your tools */],
  steps: [
    {
      name: "step-1",
      tool: "your-tool",
      input: {/* input data */}
    }
  ]
});

const result = await chain.runAgentLoop({});
```

### Market Analysis System
```typescript
import { Chain, Agent, OpenAIProvider } from '@wavequery/conductor';

// Setup tools
const technicalAnalyzer = new TechnicalAnalyzerTool();
const sentimentAnalyzer = new SentimentAnalyzerTool();

// Create chain
const analysisChain = new Chain({
  name: "market-analysis",
  tools: [technicalAnalyzer, sentimentAnalyzer],
  steps: [
    {
      name: "technical-analysis",
      tool: "technical-analyzer",
      input: {
        marketData: {
          symbol: "AAPL",
          indicators: {/* data */}
        }
      }
    }
  ]
});

// Execute with visualization
const vizServer = new VizServer();
const result = await chain.runAgentLoop({});
```

[View full market analysis example →](examples/market-analysis/README.md)

## 📚 Documentation

### Core Concepts
- [Getting Started](docs/getting-started.md)
- [Chains vs Agents](docs/core-concepts/chains-and-agents.md)
- [Visualization System](docs/core-concepts/visualization.md)

### Guides
- [Building Your First Chain](docs/guides/first-chain.md)
- [Creating Custom Tools](docs/guides/custom-tools.md)
- [Working with Agents](docs/guides/agents.md)
- [Real-time Visualization](docs/guides/visualization.md)
- [Error Handling](docs/guides/error-handling.md)
- [Performance Optimization](docs/guides/performance.md)

### API Reference
- [Chain API](docs/api/chain.md)
- [Agent API](docs/api/agent.md)
- [Tool API](docs/api/tool.md)
- [LLM Providers](docs/api/llm-providers.md)
- [Visualization API](docs/api/visualization.md)
- [Configuration](docs/api/configuration.md)
- [Types](docs/api/types.md)

### Examples
- [Basic Chain](examples/basic-chain/README.md): Simple chain implementation
- [Market Analysis](examples/market-analysis/README.md): Complete market analysis system
- [Text Analysis](examples/text-analysis/README.md): Text processing with visualization
- [Content Generation](examples/content-generation/README.md): Content generation system
- [Multi-Agent System](examples/multi-agent/README.md): Complex multi-agent workflow

## 🌟 Featured Example

### Market Analysis System

- Real-time market data analysis
- Technical and sentiment analysis
- Risk assessment
- Strategy generation
- [View Code →](examples/market-analysis/README.md)



## 🛡️ Requirements

- Node.js >= 18.0.0
- OpenAI API key and/or Anthropic API key
- Environment variables setup (see [Configuration Guide](docs/guides/configuration.md))

## 🤝 Contributing

This is a private package at this stage. For contribution guidelines, please contact the package maintainers.
We plan to transition to become open source in the future. Stay tuned!

## 📜 License

MIT © [WaveQuery](https://wavequery.com/)