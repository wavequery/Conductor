import {
  OpenAIProvider,
  Chain,
  Agent,
  BaseTool,
  ToolType,
  Tool,
  ToolResult,
  Logger,
  LogLevel,
  VizServer,
  config,
  ToolExecutionMode,
  LLMFunction,
  ChainConfig,
  GraphNode,
  GraphEdge,
  LLMChatModel,
  ConfigurationManager,
} from "@wavequery/conductor";

interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: string;
  indicators: {
    rsi: number;
    macd: number;
    volatility: number;
  };
}

interface TechnicalAnalysis {
  trendStrength: number;
  supportLevels: number[];
  resistanceLevels: number[];
  patterns: string[];
  signals: {
    type: "buy" | "sell" | "hold";
    confidence: number;
    reason: string;
  }[];
}

interface SentimentAnalysis {
  score: number;
  keywords: string[];
  sources: string[];
  mainTopics: string[];
  marketMood: "bullish" | "bearish" | "neutral";
}

interface RiskAssessment {
  riskScore: number;
  factors: {
    name: string;
    impact: number;
    probability: number;
  }[];
  recommendations: string[];
}

// Chain Tools
class TechnicalAnalyzerTool extends BaseTool implements Tool {
  private analyzeFunction: LLMFunction = {
    name: "analyzeTechnicals",
    description: "Analyze technical indicators and patterns",
    parameters: {
      type: "object",
      properties: {
        trendStrength: { type: "number" },
        supportLevels: { type: "array", items: { type: "number" } },
        resistanceLevels: { type: "array", items: { type: "number" } },
        patterns: { type: "array", items: { type: "string" } },
        signals: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["buy", "sell", "hold"] },
              confidence: { type: "number" },
              reason: { type: "string" },
            },
          },
        },
      },
      required: [
        "trendStrength",
        "supportLevels",
        "resistanceLevels",
        "patterns",
        "signals",
      ],
    },
  };

  constructor() {
    super({
      name: "technical-analyzer",
      type: ToolType.ANALYSIS,
      version: "0.0.1",
      description: "Analyzes technical market data",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["marketData"],
        schema: {
          type: "object",
          properties: {
            marketData: { type: "object" },
          },
        },
      },
      output: {
        schema: {
          type: "object",
          required: [
            "trendStrength",
            "supportLevels",
            "resistanceLevels",
            "patterns",
            "signals",
          ],
        },
      },
    });
  }

  async execute(input: { marketData: MarketData }): Promise<ToolResult> {
    const llm = new OpenAIProvider({
      apiKey: config?.openai?.apiKey || "",
      defaultModel: config?.openai?.model as LLMChatModel,
    });

    const prompt = `
        Analyze these technical indicators:
        Symbol: ${input.marketData.symbol}
        RSI: ${input.marketData.indicators.rsi}
        MACD: ${input.marketData.indicators.macd}
        Volatility: ${input.marketData.indicators.volatility}
        
        Use the analyzeTechnicals function to provide technical analysis.
      `;

    const response = await llm.completeWithFunctions(prompt, [
      this.analyzeFunction,
    ]);

    return {
      success: true,
      data: response.functionCall?.arguments || response.content,
      metrics: {
        duration: Date.now(),
      },
    };
  }
}

class SentimentAnalyzerTool extends BaseTool implements Tool {
  private sentimentFunction: LLMFunction = {
    name: "analyzeSentiment",
    description: "Analyze market sentiment",
    parameters: {
      type: "object",
      properties: {
        score: { type: "number" },
        keywords: { type: "array", items: { type: "string" } },
        sources: { type: "array", items: { type: "string" } },
        mainTopics: { type: "array", items: { type: "string" } },
        marketMood: { type: "string", enum: ["bullish", "bearish", "neutral"] },
      },
      required: ["score", "keywords", "sources", "mainTopics", "marketMood"],
    },
  };

  constructor() {
    super({
      name: "sentiment-analyzer",
      type: ToolType.ANALYSIS,
      version: "0.0.1",
      description: "Analyzes market sentiment",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["symbol"],
        schema: {
          type: "object",
          properties: {
            symbol: { type: "string" },
          },
        },
      },
      output: {
        schema: {
          type: "object",
          required: [
            "score",
            "keywords",
            "sources",
            "mainTopics",
            "marketMood",
          ],
        },
      },
    });
  }

  async execute(input: { symbol: string }): Promise<ToolResult> {
    const llm = new OpenAIProvider({
      apiKey: config?.openai?.apiKey || "",
      defaultModel: config?.openai?.model as LLMChatModel,
    });

    const prompt = `
        Analyze market sentiment for ${input.symbol}.
        Consider recent news, social media trends, and market dynamics.
        Use the analyzeSentiment function to provide sentiment analysis.
      `;

    const response = await llm.completeWithFunctions(prompt, [
      this.sentimentFunction,
    ]);

    return {
      success: true,
      data: response.functionCall?.arguments || response.content,
      metrics: {
        duration: Date.now(),
      },
    };
  }
}

class RiskAnalyzerTool extends BaseTool implements Tool {
  private riskFunction: LLMFunction = {
    name: "analyzeRisk",
    description: "Analyze market risks",
    parameters: {
      type: "object",
      properties: {
        riskScore: { type: "number" },
        factors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              impact: { type: "number" },
              probability: { type: "number" },
            },
          },
        },
        recommendations: { type: "array", items: { type: "string" } },
      },
      required: ["riskScore", "factors", "recommendations"],
    },
  };

  constructor() {
    super({
      name: "risk-analyzer",
      type: ToolType.ANALYSIS,
      version: "0.0.1",
      description: "Analyzes market risks",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["technicals", "sentiment"],
        schema: {
          type: "object",
          properties: {
            technicals: { type: "object" },
            sentiment: { type: "object" },
          },
        },
      },
      output: {
        schema: {
          type: "object",
          required: ["riskScore", "factors", "recommendations"],
        },
      },
    });
  }

  async execute(input: {
    technicals: TechnicalAnalysis;
    sentiment: SentimentAnalysis;
  }): Promise<ToolResult> {
    const llm = new OpenAIProvider({
      apiKey: config?.openai?.apiKey || "",
      defaultModel: config?.openai?.model as LLMChatModel,
    });

    const prompt = `
        Analyze market risks based on:
        Technical Analysis: ${JSON.stringify(input.technicals)}
        Sentiment Analysis: ${JSON.stringify(input.sentiment)}
        
        Use the analyzeRisk function to provide risk assessment.
      `;

    const response = await llm.completeWithFunctions(prompt, [
      this.riskFunction,
    ]);

    return {
      success: true,
      data: response.functionCall?.arguments || response.content,
      metrics: {
        duration: Date.now(),
      },
    };
  }
}

// Agent Tools
class StrategyGeneratorTool extends BaseTool implements Tool {
  private strategyFunction: LLMFunction = {
    name: "generateStrategy",
    description: "Generate trading strategy",
    parameters: {
      type: "object",
      properties: {
        strategy: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["buy", "sell", "hold"] },
            timeframe: { type: "string" },
            entryPoints: { type: "array", items: { type: "number" } },
            exitPoints: { type: "array", items: { type: "number" } },
            stopLoss: { type: "number" },
            rationale: { type: "string" },
          },
        },
        confidence: { type: "number" },
      },
      required: ["strategy", "confidence"],
    },
  };

  constructor() {
    super({
      name: "strategy-generator",
      type: ToolType.GENERATION,
      version: "0.0.1",
      description: "Generates trading strategies",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["analysis"],
        schema: {
          type: "object",
          properties: {
            analysis: { type: "object" },
          },
        },
      },
      output: {
        schema: {
          type: "object",
          required: ["strategy", "confidence"],
        },
      },
    });
  }

  async execute(input: {
    analysis: {
      technicals: TechnicalAnalysis;
      sentiment: SentimentAnalysis;
      risk: RiskAssessment;
    };
  }): Promise<ToolResult> {
    const llm = new OpenAIProvider({
      apiKey: config?.openai?.apiKey || "",
      defaultModel: config?.openai?.model as LLMChatModel,
    });

    const prompt = `
        Generate a trading strategy based on:
        ${JSON.stringify(input.analysis, null, 2)}
        
        Use the generateStrategy function to provide the strategy.
      `;

    const response = await llm.completeWithFunctions(prompt, [
      this.strategyFunction,
    ]);

    return {
      success: true,
      data: response.functionCall?.arguments || response.content,
      metrics: {
        duration: Date.now(),
      },
    };
  }
}

class ReportGeneratorTool extends BaseTool implements Tool {
  private reportFunction: LLMFunction = {
    name: "generateReport",
    description: "Generate analysis report",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string" },
        keyFindings: { type: "array", items: { type: "string" } },
        recommendations: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } },
        nextSteps: { type: "array", items: { type: "string" } },
      },
      required: [
        "summary",
        "keyFindings",
        "recommendations",
        "risks",
        "nextSteps",
      ],
    },
  };

  constructor() {
    super({
      name: "report-generator",
      type: ToolType.GENERATION,
      version: "0.0.1",
      description: "Generates comprehensive reports",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["analysis", "strategy"],
        schema: {
          type: "object",
          properties: {
            analysis: { type: "object" },
            strategy: { type: "object" },
          },
        },
      },
      output: {
        schema: {
          type: "object",
          required: [
            "summary",
            "keyFindings",
            "recommendations",
            "risks",
            "nextSteps",
          ],
        },
      },
    });
  }

  async execute(input: { analysis: any; strategy: any }): Promise<ToolResult> {
    const llm = new OpenAIProvider({
      apiKey: config?.openai?.apiKey || "",
      defaultModel: config?.openai?.model as LLMChatModel,
    });

    const prompt = `
        Generate a comprehensive report based on:
        Analysis: ${JSON.stringify(input.analysis)}
        Strategy: ${JSON.stringify(input.strategy)}
        
        Use the generateReport function to provide the report.
      `;

    const response = await llm.completeWithFunctions(prompt, [
      this.reportFunction,
    ]);

    return {
      success: true,
      data: response.functionCall?.arguments || response.content,
      metrics: {
        duration: Date.now(),
      },
    };
  }
}

async function runMarketAnalysis() {
  const logger = new Logger({
    level: LogLevel.DEBUG,
    prefix: "MarketAnalysis",
  });

  ConfigurationManager.getInstance().setConfig({
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  });

  const technicalAnalyzer = new TechnicalAnalyzerTool();
  const sentimentAnalyzer = new SentimentAnalyzerTool();
  const riskAnalyzer = new RiskAnalyzerTool();
  const strategyGenerator = new StrategyGeneratorTool();
  const reportGenerator = new ReportGeneratorTool();

  const vizServer = new VizServer(config.server?.port, {
    theme: "light",
  });

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
    updateNode(nodeId: string, updates: Partial<GraphNode>) {
      const node = this.nodes.get(nodeId);
      if (node) {
        this.nodes.set(nodeId, {
          ...node,
          ...updates,
        });
        this.updateViz();
      }
    },
    removeNode(nodeId: string) {
      this.nodes.delete(nodeId);
      this.updateViz();
    },
    updateViz() {
      vizServer.updateGraph({
        nodes: Array.from(this.nodes.values()),
        edges: Array.from(this.edges.values()),
      });
    },
    clearAll() {
      this.nodes.clear();
      this.edges.clear();
      this.updateViz();
    },
  };

  const analysisChainConfig: ChainConfig = {
    name: "market-analysis-chain",
    llmProvider: new OpenAIProvider({
      apiKey: config?.openai?.apiKey || "",
      defaultModel: config?.openai?.model as LLMChatModel,
    }),
    tools: [technicalAnalyzer, sentimentAnalyzer, riskAnalyzer],
    maxIterations: 3,
    steps: [
      {
        name: "technical-analysis",
        tool: "technical-analyzer",
        input: {
          marketData: {
            symbol: "AAPL",
            price: 180.25,
            volume: 1500000,
            timestamp: new Date().toISOString(),
            indicators: {
              rsi: 65.5,
              macd: 0.75,
              volatility: 0.12,
            },
          },
        },
      },
      {
        name: "sentiment-analysis",
        tool: "sentiment-analyzer",
        input: {
          symbol: "AAPL",
        },
      },
      {
        name: "risk-analysis",
        tool: "risk-analyzer",
        input: (prevResults: any) => ({
          technicals: prevResults["technical-analysis"],
          sentiment: prevResults["sentiment-analysis"],
        }),
      },
    ],
  };

  const chain = new Chain(analysisChainConfig);

  // Initialize Agent with custom configuration
  const agent = new Agent({
    name: "strategy-agent",
    llmProvider: new OpenAIProvider({
      apiKey: config?.openai?.apiKey || "",
      defaultModel: config?.openai?.model as LLMChatModel,
    }),
    tools: [strategyGenerator, reportGenerator],
    defaultTimeout: 30000,
    maxIterations: 1,
  });

  function initializeVisualization() {
    graphManager.addNode({
      id: "market-analysis-system",
      type: "system",
      label: "Market Analysis System",
      data: { status: "initializing" },
      status: "running",
    });

    // Add analysis chain node
    graphManager.addNode({
      id: "analysis-chain",
      type: "system",
      label: "Market Analysis Chain",
      data: { status: "initializing" },
      status: "running",
    });

    // Connect system to chain
    graphManager.addEdge({
      id: "system-to-chain",
      source: "market-analysis-system",
      target: "analysis-chain",
      type: "flow",
      label: "initialize",
    });

    // Add chain steps
    analysisChainConfig.steps.forEach((step, index) => {
      const stepNode: GraphNode = {
        id: step.name,
        type: "tool",
        label: step.name
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        status: "pending",
      };

      const edge: GraphEdge = {
        id: `flow-to-${step.name}`,
        source:
          index === 0
            ? "analysis-chain"
            : analysisChainConfig.steps[index - 1].name,
        target: step.name,
        type: "flow",
        label: "analyze",
      };

      graphManager.addNode(stepNode);
      graphManager.addEdge(edge);
    });

    // Add results collection node
    graphManager.addNode({
      id: "analysis-results",
      type: "data",
      label: "Analysis Results",
      status: "pending",
    });

    // Connect last analysis step to results
    graphManager.addEdge({
      id: "flow-to-results",
      source:
        analysisChainConfig.steps[analysisChainConfig.steps.length - 1].name,
      target: "analysis-results",
      type: "flow",
      label: "collect",
    });
  }

  // Initialize strategy agent visualization
  function initializeStrategyAgent() {
    const strategyAgentNode: GraphNode = {
      id: "strategy-agent",
      type: "system",
      label: "Strategy Agent",
      status: "running",

      data: { analysisComplete: true },
    };

    graphManager.addNode(strategyAgentNode);

    graphManager.addEdge({
      id: "flow-to-strategy-agent",
      source: "analysis-results",
      target: "strategy-agent",
      type: "flow",
      label: "process",
    });

    // Add agent tools
    const agentTools = [
      { id: "strategy-generation", label: "Strategy Generation" },
      { id: "report-generation", label: "Report Generation" },
    ];

    agentTools.forEach((tool, index) => {
      graphManager.addNode({
        id: tool.id,
        type: "tool",
        label: tool.label,
        status: "pending",
      });

      graphManager.addEdge({
        id: `flow-to-${tool.id}`,
        source: "strategy-agent",
        target: tool.id,
        type: "flow",
        label: "generate",
      });
    });

    // Add final output node
    graphManager.addNode({
      id: "final-output",
      type: "data",
      label: "Final Strategy & Report",
      status: "pending",
    });

    // Connect tools to final output
    agentTools.forEach((tool) => {
      graphManager.addEdge({
        id: `flow-from-${tool.id}`,
        source: tool.id,
        target: "final-output",
        type: "flow",
        label: "output",
      });
    });
  }

  try {
    logger.info("Initializing market analysis system");
    initializeVisualization();

    // Run the analysis chain
    logger.info("Starting market analysis chain");
    const chainResult = await chain.runAgentLoop({});

    analysisChainConfig.steps.forEach((step) => {
      graphManager.updateNode(step.name, {
        status: "completed",
        data: {
          duration: chainResult.metrics?.duration,
          result: chainResult.output[step.name],
        },
      });
    });

    graphManager.updateNode("analysis-chain", {
      status: "completed",
      data: {
        duration: chainResult.metrics?.duration,
        totalSteps: chainResult.steps?.length,
      },
    });

    graphManager.updateNode("analysis-results", {
      status: "completed",
      data: chainResult.output,
    });

    logger.info("Initializing strategy agent");

    initializeStrategyAgent();

    const agentResult = await agent.execute({
      analysis: chainResult.output,
      instruction:
        "Generate trading strategy and comprehensive report based on the analysis",
    });

    // Update agent visualization
    ["strategy-generation", "report-generation"].forEach((toolId) => {
      graphManager.updateNode(toolId, {
        status: "completed",
        data: {
          result: agentResult.output,
          duration: agentResult.metrics?.duration,
        },
      });
    });

    graphManager.updateNode("final-output", {
      status: "completed",
      data: {
        strategy: agentResult.output.strategy,
        report: agentResult.output.report,
        duration: agentResult.metrics?.duration,
      },
    });

    graphManager.updateNode("strategy-agent", {
      status: "completed",
      data: {
        duration: agentResult.metrics?.duration,
        totalSteps: agentResult.steps?.length,
      },
    });

    // Update system status
    graphManager.updateNode("market-analysis-system", {
      status: "completed",
      data: {
        totalDuration:
          chainResult.metrics?.duration + agentResult.metrics?.duration,
        completionTime: new Date().toISOString(),
      },
    });

    logger.info("Market analysis completed", {
      chainDuration: chainResult.metrics?.duration,
      agentDuration: agentResult.metrics?.duration,
      output: {
        analysis: chainResult.output,
        strategy: agentResult.output,
      },
    });

    return {
      analysis: chainResult.output,
      strategy: agentResult.output,
      metrics: {
        chainDuration: chainResult.metrics?.duration,
        agentDuration: agentResult.metrics?.duration,
        totalDuration:
          chainResult.metrics?.duration + agentResult.metrics?.duration,
      },
    };
  } catch (error) {
    logger.error("Market analysis failed:", error);

    // Update error status in visualization
    [
      "market-analysis-system",
      "analysis-chain",
      ...analysisChainConfig.steps.map((s) => s.name),
      "analysis-results",
      "strategy-agent",
      "strategy-generation",
      "report-generation",
      "final-output",
    ].forEach((nodeId) => {
      const node = graphManager.nodes.get(nodeId);
      if (node?.status === "pending" || node?.status === "running") {
        graphManager.updateNode(nodeId, {
          status: "error",
          data: {
            error: error,
            failureTime: new Date().toISOString(),
          },
        });
      }
    });

    throw error;
  } finally {
    // Setup cleanup handlers
    process.on("SIGINT", () => {
      logger.info("Shutting down market analysis system");
      vizServer.close();
      process.exit(0);
    });

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception:", error);
      vizServer.close();
      process.exit(1);
    });
  }
}

runMarketAnalysis().catch(console.error);
