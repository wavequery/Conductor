import {
  OpenAIProvider,
  Agent,
  BaseTool,
  ToolType,
  Tool,
  ToolResult,
  Logger,
  LogLevel,
  config,
  ToolExecutionMode,
  LLMFunction,
} from "@wavequery/conductor";

import dotenv from "dotenv";

dotenv.configDotenv();

class WebSearchTool extends BaseTool implements Tool {
  private searchFunction: LLMFunction = {
    name: "searchWeb",
    description: "Search web for relevant information",
    parameters: {
      type: "object",
      properties: {
        results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              url: { type: "string" },
              snippet: { type: "string" },
              relevanceScore: { type: "number" },
            },
          },
        },
        metadata: {
          type: "object",
          properties: {
            totalResults: { type: "number" },
            searchTime: { type: "number" },
          },
        },
      },
      required: ["results", "metadata"],
    },
  };

  constructor() {
    super({
      name: "web-search",
      type: ToolType.SEARCH,
      version: "0.0.1",
      description: "Searches web for information",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["query"],
        schema: {
          type: "object",
          properties: {
            query: { type: "string" },
            limit: { type: "number", default: 5 },
          },
        },
      },
      output: {
        schema: {
          type: "object",
          required: ["results", "metadata"],
        },
      },
    });
  }

  async execute(input: { query: string; limit?: number }): Promise<ToolResult> {
    const startTime = Date.now();
    const llm = new OpenAIProvider({
      apiKey: config?.openai?.apiKey || "",
     defaultModel: 'gpt-4o-mini'
    });

    const prompt = `
        Search the web for: "${input.query}"
        Limit results to: ${input.limit || 5}
        Return relevant search results using the searchWeb function.
      `;

    const response = await llm.completeWithFunctions(prompt, [
      this.searchFunction,
    ]);

    return {
      success: true,
      data: response.functionCall?.arguments || response.content,
      metrics: {
        duration: Date.now() - startTime,
      },
    };
  }
}

class SummarizerTool extends BaseTool implements Tool {
  private summarizeFunction: LLMFunction = {
    name: "generateSummary",
    description: "Generate concise summary of text",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string" },
        keyPoints: {
          type: "array",
          items: { type: "string" },
        },
        sentiment: {
          type: "object",
          properties: {
            overall: { type: "string" },
            confidence: { type: "number" },
          },
        },
        wordCount: { type: "number" },
      },
      required: ["summary", "keyPoints", "sentiment", "wordCount"],
    },
  };

  constructor() {
    super({
      name: "summarizer",
      type: ToolType.ANALYSIS,
      version: "0.0.1",
      description: "Summarizes text content",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["text"],
        schema: {
          type: "object",
          properties: {
            text: { type: "string" },
            maxLength: { type: "number", default: 200 },
          },
        },
      },
      output: {
        schema: {
          type: "object",
          required: ["summary", "keyPoints", "sentiment", "wordCount"],
        },
      },
    });
  }

  async execute(input: {
    text: string;
    maxLength?: number;
  }): Promise<ToolResult> {
    const startTime = Date.now();
    const llm = new OpenAIProvider({
      apiKey: config?.openai?.apiKey || "",
      defaultModel: 'gpt-4o-mini'
    });

    const prompt = `
        Summarize in ${input.maxLength || 200} characters:
        "${input.text}"
        Use the generateSummary function.
      `;

    const response = await llm.completeWithFunctions(prompt, [
      this.summarizeFunction,
    ]);

    return {
      success: true,
      data: response.functionCall?.arguments || response.content,
      metrics: {
        duration: Date.now() - startTime,
      },
    };
  }
}

class InsightGeneratorTool extends BaseTool implements Tool {
  private insightFunction: LLMFunction = {
    name: "generateInsights",
    description: "Generate insights from analyzed content",
    parameters: {
      type: "object",
      properties: {
        insights: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              description: { type: "string" },
              confidence: { type: "number" },
              impact: { type: "string" },
            },
          },
        },
        trends: {
          type: "array",
          items: { type: "string" },
        },
        recommendations: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["insights", "trends", "recommendations"],
    },
  };

  constructor() {
    super({
      name: "insight-generator",
      type: ToolType.ANALYSIS,
      version: "0.0.1",
      description: "Generates insights from analyzed content",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["content"],
        schema: {
          type: "object",
          properties: {
            content: { type: "object" },
            perspective: { type: "string" },
          },
        },
      },
      output: {
        schema: {
          type: "object",
          required: ["insights", "trends", "recommendations"],
        },
      },
    });
  }

  async execute(input: {
    content: any;
    perspective?: string;
  }): Promise<ToolResult> {
    const startTime = Date.now();
    const llm = new OpenAIProvider({
      apiKey: config?.openai?.apiKey || "",
      defaultModel: 'gpt-4o-mini'
    });

    const prompt = `
        Generate insights from ${input.perspective || "general"} perspective:
        ${JSON.stringify(input.content)}
        Use the generateInsights function.
      `;

    const response = await llm.completeWithFunctions(prompt, [
      this.insightFunction,
    ]);

    return {
      success: true,
      data: response.functionCall?.arguments || response.content,
      metrics: {
        duration: Date.now() - startTime,
      },
    };
  }
}

async function runResearchAgent() {
  const logger = new Logger({
    level: LogLevel.INFO,
    prefix: "ResearchAgent",
  });

  const llm = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY || "",
    defaultModel: 'gpt-4o-mini'
  });

  const searchTool = new WebSearchTool();
  const summarizerTool = new SummarizerTool();
  const insightTool = new InsightGeneratorTool();

  const agent = new Agent({
    name: "research-agent",
    llmProvider: llm,
    tools: [searchTool, summarizerTool, insightTool],
    defaultTimeout: 20000,
    maxIterations: 1,
  });

  agent.on("step", (step) => {
    logger.info(`Step completed: ${step.name}`, {
      duration: step.duration,
      output: step.output,
    });
  });

  const topic = "Impact of AI on software development productivity";

  try {
    logger.info(`Starting research on: ${topic}`);

    const result = await agent.execute({
      topic,
      instruction: "Research this topic and provide key insights",
      perspective: "software engineering",
    });

    logger.info("Research completed", {
      duration: result.metrics.duration,
      insights: result.output,
    });

    return result;
  } catch (error) {
    logger.error("Research failed:", error);
    throw error;
  }
}

console.log(runResearchAgent().catch(console.error));
