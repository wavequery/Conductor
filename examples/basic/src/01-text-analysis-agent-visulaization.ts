import {
  OpenAIProvider,
  Agent,
  ToolRegistry,
  BaseTool,
  ToolType,
  MemoryStore,
  InMemoryStore,
  Logger,
  LogLevel,
  VizServer,
  config,
  ToolExecutionMode,
  Tool,
  ToolResult,
  GraphNode,
  GraphEdge,
  Graph,
  LLMChatModel,
  ConfigurationManager,
} from "@wavequery/conductor";

import dotenv from "dotenv";

dotenv.configDotenv();

export class TextAnalysisTool extends BaseTool implements Tool {
  private logger = new Logger({
    level: LogLevel.DEBUG,
    prefix: "TextAnalysis",
  });

  constructor() {
    super({
      name: "text-analysis",
      type: ToolType.ANALYSIS,
      version: "0.0.1",
      description: "Analyzes text for sentiment and key concepts",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        schema: {},
        required: ["text"],
      },
      output: {
        schema: {},
      },
    });
  }

  async execute(input: { text: string }): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const llm = new OpenAIProvider({
        apiKey: config?.openai?.apiKey || "",
        defaultModel: config?.openai?.model as LLMChatModel,
      });

      const prompt = `
        Analyze the following text and provide:
        1. Sentiment (positive, negative, neutral)
        2. Key concepts
        3. Summary in 2 sentences
        4. Key entities mentioned
        5. Emotional tone

        Text: "${input.text}"

        Format your response as JSON with these fields: 
        {
          "sentiment": string,
          "concepts": string[],
          "summary": string,
          "entities": string[],
          "emotionalTone": string,
          "confidence": number
        }
      `;

      const response = await llm.complete(prompt, {
        responseFormat: "json_object",
      });

      // const response = await llm.completeWithFunctions(prompt, {
      //   responseFormat: "json_object",
      // });

      return {
        success: true,
        data: JSON.parse(response?.content),
        metrics: {
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error as Error,
        metrics: {
          duration: Date.now() - startTime,
        },
      };
    }
  }
}

async function runAnalysis() {
  const logger = new Logger({
    level: LogLevel.DEBUG,
    prefix: "TextAnalysis",
  });

  ConfigurationManager.getInstance().setConfig({
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  });

  const llm = new OpenAIProvider({
    apiKey: config?.openai?.apiKey || "",
    defaultModel: config?.openai?.model as LLMChatModel,
  });

  const toolRegistry = new ToolRegistry();
  const analysisTool = new TextAnalysisTool();
  toolRegistry.register(analysisTool, ToolType.ANALYSIS);

  const memoryStore = new MemoryStore({
    provider: new InMemoryStore(),
    namespace: "text-analysis",
  });

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
        this.nodes.set(nodeId, { ...node, ...updates });
        this.updateViz();
      }
    },
    updateViz() {
      vizServer.updateGraph({
        nodes: Array.from(this.nodes.values()),
        edges: Array.from(this.edges.values()),
      });
    },
  };

  vizServer.on("nodeClick", (node: GraphNode) => {
    logger.info("Node clicked:", node);
    // Handle node click - trigger actions
  });

  vizServer.on("command", (cmd: string) => {
    logger.info("Command received:", cmd);
    // Handle visualization commands
  });

  const agent = new Agent({
    name: "text-analyzer",
    llmProvider: llm,
    tools: [analysisTool],
    defaultTimeout: 0,
    maxIterations: 1,
  });

  const texts = [
    "I absolutely love how this new AI technology is transforming our work! The possibilities seem endless.",
    "The customer service was disappointing. Long wait times and unresolved issues left me frustrated.",
    "While the market showed some positive signals in tech stocks, concerns about inflation persist.",
    "The new environmental policies could significantly impact industrial sectors, but renewable energy companies might benefit.",
  ];

  graphManager.addNode({
    id: "processor",
    type: "system",
    label: "Text Analysis System",
    data: { status: "initializing" },
    status: "running",
  });

  for (const [index, text] of texts.entries()) {
    logger.info(`\nAnalyzing text: "${text}"`);

    const inputNode: GraphNode = {
      id: `input-${index}`,
      type: "data",
      label: `Input ${index + 1}`,
      data: { text },
      status: "running",
    };
    graphManager.addNode(inputNode);

    graphManager.addEdge({
      id: `flow-to-input-${index}`,
      source: "processor",
      target: `input-${index}`,
      type: "flow",
    });

    try {
      const result = await agent.execute({
        text,
        instruction: "Analyze this text for sentiment and key concepts",
      });

      const analysisNode: GraphNode = {
        id: `analysis-${index}`,
        type: "tool",
        label: `Analysis ${index + 1}`,
        data: {
          ...result.output,
          duration: result.metrics.duration,
        },
        status: "completed",
        position: { x: 600, y: 100 + index * 150 },
      };

      graphManager.addNode(analysisNode);

      graphManager.addEdge({
        id: `flow-analysis-${index}`,
        source: `input-${index}`,
        target: `analysis-${index}`,
        type: "flow",
        label: `${result.metrics.duration}ms`,
      });

      logger.info("Analysis result:", result);

      await memoryStore.remember(`analysis_${Date.now()}`, result.output, {
        type: "text-analysis",
        tags: ["sentiment", "concepts"],
      });

      graphManager.updateNode(inputNode.id, {
        status: "completed",
        data: {
          ...inputNode.data,
          processingTime: result.metrics.duration,
        },
      });
    } catch (error) {
      logger.error("Analysis failed:", error);
      vizServer.updateNode(`input-${index}`, { status: "error" });
    }
  }

  const analyses = await memoryStore.searchByType("text-analysis");
  logger.info("\nAnalysis summary:", analyses);

  process.on("SIGINT", () => {
    vizServer.close();
    process.exit();
  });
}

runAnalysis().catch(console.error);
