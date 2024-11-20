import {
  OpenAIProvider,
  Chain,
  Logger,
  LogLevel,
  VizServer,
  config,
  Tool,
  ToolResult,
  GraphNode,
  GraphEdge,
  LLMChatModel,
  ConfigurationManager,
  BaseTool,
  ChainConfig,
  ToolType,
  LLMFunction,
  ToolExecutionMode,
} from "@wavequery/conductor";

export class ContentGeneratorTool extends BaseTool implements Tool {
  private logger = new Logger({
    level: LogLevel.DEBUG,
    prefix: "ContentGenerator",
  });

  constructor() {
    super({
      name: "content-generator",
      type: ToolType.GENERATION,
      version: "0.0.1",
      description: "Generates blog post content from outline",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["topic", "outline"],
        schema: {
          type: "object",
          properties: {
            topic: { type: "string" },
            outline: { type: "array", items: { type: "string" } },
            style: { type: "string", default: "professional" },
            targetAudience: { type: "string" },
          },
        },
      },
      output: {
        schema: {
          type: "object",
          required: [
            "title",
            "introduction",
            "sections",
            "conclusion"
          ],
        },
      },
    });
  }

  private generateFunction: LLMFunction = {
    name: "generateBlogPost",
    description: "Generate a blog post from a topic and outline",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title of the blog post" },
        introduction: { type: "string", description: "Introduction paragraph" },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              heading: { type: "string" },
              content: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
            },
            required: ["heading", "content", "keywords"],
          },
        },
        conclusion: { type: "string", description: "Concluding paragraph" },
      },
      required: ["title", "introduction", "sections", "conclusion"],
    },
  };

  async execute(input: {
    topic: string;
    outline: string[];
    style?: string;
    targetAudience?: string;
  }): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      this.logger.debug("Starting content generation with functions");

      const llm = new OpenAIProvider({
        apiKey: config?.openai?.apiKey || "",
        defaultModel: config?.openai?.model as LLMChatModel,
      });

      const prompt = `
        Generate a blog post about ${input.topic}.
        Style: ${input.style || "professional"}
        Target Audience: ${input.targetAudience || "general"}

        Follow this outline:
        ${input.outline.map((item, i) => `${i + 1}. ${item}`).join("\n")}

        Use the generateBlogPost function to structure the response.
      `;

      const response = await llm.completeWithFunctions(prompt, [
        this.generateFunction,
      ]);

      return {
        success: true,
        data: response.functionCall?.arguments || response.content,
        metrics: {
          duration: Date.now() - startTime,
          tokens: response.usage?.totalTokens,
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

export class SEOOptimizerTool extends BaseTool implements Tool {
  private seoFunction: LLMFunction = {
    name: "optimizeForSEO",
    description: "Optimize content for search engines",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "SEO optimized title",
        },
        metaDescription: {
          type: "string",
          description: "Meta description for search results",
        },
        optimizedSections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              heading: { type: "string" },
              content: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
            },
          },
        },
        suggestedTags: {
          type: "array",
          items: { type: "string" },
        },
        seoScore: {
          type: "number",
          description: "SEO score from 0-100",
        },
      },
      required: [
        "title",
        "metaDescription",
        "optimizedSections",
        "suggestedTags",
        "seoScore",
      ],
    },
  };

    constructor() {
    super({
      name: "seo-optimizer",
      type: ToolType.TRANSFORMATION,
      version: "0.0.1",
      description: "Optimizes content for SEO",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["content"],
        schema: {
          type: "object",
          properties: {
            content: { type: "object" },
            keywords: { type: "array", items: { type: "string" } },
          },
        },
      },
      output: {
        schema: {
          type: "object",
          required: [
            "title",
            "metaDescription",
            "optimizedSections",
            "suggestedTags",
            "seoScore"
          ],
        },
      },
    });
  }

  async execute(input: {
    content: any;
    keywords?: string[];
  }): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const llm = new OpenAIProvider({
        apiKey: config?.openai?.apiKey || "",
        defaultModel: config?.openai?.model as LLMChatModel,
      });

      const prompt = `
        Optimize this content for SEO:
        ${JSON.stringify(input.content, null, 2)}
        ${input.keywords ? `Target keywords: ${input.keywords.join(", ")}` : ""}

        Use the optimizeForSEO function to provide optimized content.
      `;

      const response = await llm.completeWithFunctions(prompt, [
        this.seoFunction,
      ]);

      return {
        success: true,
        data: response.functionCall?.arguments || response.content,
        metrics: {
          duration: Date.now() - startTime,
          tokens: response.usage?.totalTokens,
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

export class ContentEditorTool extends BaseTool implements Tool {
  private editFunction: LLMFunction = {
    name: "editContent",
    description: "Edit and improve content quality",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        content: {
          type: "object",
          properties: {
            introduction: { type: "string" },
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  heading: { type: "string" },
                  content: { type: "string" },
                },
              },
            },
            conclusion: { type: "string" },
          },
        },
        improvements: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              description: { type: "string" },
              location: { type: "string" },
            },
          },
        },
        readabilityScore: {
          type: "number",
          description: "Readability score from 0-100",
        },
      },
      required: ["title", "content", "improvements", "readabilityScore"],
    },
  };

    constructor() {
    super({
      name: "content-editor",
      type: ToolType.TRANSFORMATION,
      version: "0.0.1",
      description: "Edits and improves content quality",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["content"],
        schema: {
          type: "object",
          properties: {
            content: { type: "object" },
            style: { type: "string" },
            suggestions: { type: "array", items: { type: "string" } },
          },
        },
      },
      output: {
        schema: {
          type: "object",
          required: [
            "title",
            "content",
            "improvements",
            "readabilityScore",
          ],
        },
      },
    });
  }

  async execute(input: {
    content: any;
    style?: string;
    suggestions?: string[];
  }): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const llm = new OpenAIProvider({
        apiKey: config?.openai?.apiKey || "",
        defaultModel: config?.openai?.model as LLMChatModel,
      });

      const prompt = `
        Edit and improve this content:
        ${JSON.stringify(input.content, null, 2)}
        Style: ${input.style || "professional"}
        ${input.suggestions ? `Consider these suggestions: ${input.suggestions.join(", ")}` : ""}

        Use the editContent function to return improved content.
      `;

      const response = await llm.completeWithFunctions(prompt, [
        this.editFunction,
      ]);

      return {
        success: true,
        data: response.functionCall?.arguments || response.content,
        metrics: {
          duration: Date.now() - startTime,
          tokens: response.usage?.totalTokens,
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

async function runContentCreationChain() {
  const logger = new Logger({
    level: LogLevel.DEBUG,
    prefix: "ContentChain",
  });

  ConfigurationManager.getInstance().setConfig({
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  });

  const contentGenerator = new ContentGeneratorTool();
  const seoOptimizer = new SEOOptimizerTool();
  const contentEditor = new ContentEditorTool();

  const llmProvider = new OpenAIProvider({
    apiKey: config?.openai?.apiKey || "",
    defaultModel: config?.openai?.model as LLMChatModel,
  });

  const chainConfig: ChainConfig = {
    name: "content-creation-chain",
    llmProvider,
    tools: [contentGenerator, seoOptimizer, contentEditor],
    maxIterations: 1,
    steps: [
      {
        name: "generate",
        tool: "content-generator",
        input: {
          style: "professional",
          targetAudience: "tech professionals",
        },
      },
      {
        name: "optimize",
        tool: "seo-optimizer",
        input: {
          keywords: ["AI", "machine learning", "technology"],
        },
      },
      {
        name: "edit",
        tool: "content-editor",
        input: {
          style: "technical but accessible",
        },
      },
    ],
  };

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

  const chain = new Chain(chainConfig);

  graphManager.addNode({
    id: "content-processor",
    type: "system",
    label: "Content Creation System",
    data: { status: "initializing" },
    status: "running",
  });

  chainConfig.steps.forEach((step, index) => {
    const stepNode: GraphNode = {
      id: step.name,
      type: "tool",
      label: step.name.charAt(0).toUpperCase() + step.name.slice(1),
      status: "pending",
    };

    const edge: GraphEdge = {
      id: `flow-to-${step.name}`,
      source:
        index === 0 ? "content-processor" : chainConfig.steps[index - 1].name,
      target: step.name,
      type: "flow",
    };

    graphManager.addNode(stepNode);
    graphManager.addEdge(edge);
  });

  // Event listeners
  chain.on("step", (step) => {
    logger.debug(`Step completed: ${step.name}`, {
      duration: step.duration,
      type: step.type,
    });

    graphManager.updateNode(step.name, {
      status: "completed",
      data: {
        result: step.output,
        duration: step.duration,
      },
    });
  });

  try {
    const input = {
      topic: "The Future of AI in Software Development",
      outline: [
        "Introduction to AI in Development",
        "Current AI Development Tools",
        "Impact on Developer Productivity",
        "Challenges and Limitations",
        "Future Predictions",
        "Conclusion",
      ],
    };

    logger.info("Starting content creation");
    const result = await chain.runAgentLoop(input);

    graphManager.updateNode("content-processor", {
      status: "completed",
      data: {
        duration: result.metrics?.duration,
        totalSteps: result.steps?.length,
      },
    });

    logger.info("Content creation completed", {
      duration: result.metrics?.duration,
      steps: result.steps?.length,
      output: result.output,
    });
  } catch (error) {
    logger.error("Content creation failed:", error);
    chainConfig.steps.forEach((step) => {
      const node = graphManager.nodes.get(step.name);
      if (node?.status === "pending" || node?.status === "running") {
        graphManager.updateNode(step.name, {
          status: "error",
          data: { error: {} },
        });
      }
    });
  }

  process.on("SIGINT", () => {
    vizServer.close();
    process.exit();
  });
}

runContentCreationChain().catch(console.error);
