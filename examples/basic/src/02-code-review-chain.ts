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
  ChainConfig,
  BaseTool,
  ToolType,
  ToolExecutionMode,
} from "@wavequery/conductor";

import dotenv from "dotenv";

dotenv.configDotenv();

export class CodeAnalyzerTool extends BaseTool implements Tool {
  private logger = new Logger({
    level: LogLevel.DEBUG,
    prefix: "CodeAnalyzer",
  });

  constructor() {
    super({
      name: "code-analyzer",
      type: ToolType.ANALYSIS,
      version: "0.0.1",
      description:
        "Analyzes code for patterns, complexity, and potential issues",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["code"],
        schema: {
          type: "object",
          properties: {
            code: { type: "string" },
            extractCode: { type: "boolean", default: true },
          },
        },
      },
      output: {
        schema: {
          type: "object",
          required: [
            "complexity",
            "security",
            "performance",
            "bestPractices",
            "improvements",
          ],
        },
      },
    });
  }

  async execute(input: {
    code: string;
    extractCode?: boolean;
  }): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      this.logger.debug("Starting code analysis");

      const llm = new OpenAIProvider({
        apiKey: config?.openai?.apiKey || "",
        defaultModel: config?.openai?.model as LLMChatModel,
      });

      const prompt = `
        Analyze the following code and provide:
        1. Code complexity assessment (1-10 scale)
        2. Security issues identification
        3. Performance considerations
        4. Best practices compliance
        5. Suggested improvements

        Code: """${input.code}"""

        Format your response as JSON with these fields:
        {
          "complexity": {
            "score": number,
            "details": string[]
          },
          "security": {
            "issues": string[],
            "severity": "low" | "medium" | "high"
          },
          "performance": string[],
          "bestPractices": {
            "followed": string[],
            "violations": string[]
          },
          "improvements": string[]
        }
      `;

      const response = await llm.complete(prompt, {
        responseFormat: "json_object",
      });

      this.logger.debug("response code analysis", response);

      this.logger.debug("Analysis completed", {
        duration: Date.now() - startTime,
      });

      return {
        success: true,
        data: JSON.parse(response?.content),
        metrics: {
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      this.logger.error("Analysis failed:", error);
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

export class SecurityScannerTool extends BaseTool implements Tool {
  private logger = new Logger({
    level: LogLevel.DEBUG,
    prefix: "SecurityScanner",
  });

  constructor() {
    super({
      name: "security-scanner",
      type: ToolType.VALIDATION,
      version: "0.0.1",
      description: "Scans code for security vulnerabilities",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["code"],
        schema: {
          type: "object",
          properties: {
            code: { type: "string" },
            context: { type: "object" },
            includeContext: { type: "boolean", default: true },
          },
        },
      },
      output: {
        schema: {
          type: "object",
          required: ["vulnerabilities", "riskScore", "recommendations"],
        },
      },
    });
  }

  async execute(input: { code: string; context?: any }): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      this.logger.debug("Starting security scan");

      const llm = new OpenAIProvider({
        apiKey: config?.openai?.apiKey || "",
        defaultModel: config?.openai?.model as LLMChatModel,
      });

      const prompt = `
        Perform a security audit on the following code. Consider:
        1. Common vulnerabilities (XSS, CSRF, SQL Injection, etc.)
        2. Input validation
        3. Authentication/Authorization issues
        4. Data exposure risks
        5. Dependencies security

        Code: """${input.code}"""
        ${input.context ? `\nContext: ${JSON.stringify(input.context)}` : ""}

        Format your response as JSON with these fields:
        {
          "vulnerabilities": Array<{
            "type": string,
            "severity": "low" | "medium" | "high",
            "description": string,
            "recommendation": string,
            "lineNumbers": number[]
          }>,
          "riskScore": number,
          "criticalIssues": number,
          "recommendations": string[]
        }
      `;

      const response = await llm.complete(prompt, {
        responseFormat: "json_object",
      });

      this.logger.debug("Security scan completed", {
        duration: Date.now() - startTime,
      });

      return {
        success: true,
        data: JSON.parse(response?.content),
        metrics: {
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      this.logger.error("Security scan failed:", error);
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

export class DocumentationGeneratorTool extends BaseTool implements Tool {
  private logger = new Logger({
    level: LogLevel.DEBUG,
    prefix: "DocumentationGenerator",
  });

  constructor() {
    super({
      name: "documentation-generator",
      type: ToolType.GENERATION,
      version: "0.0.1",
      description: "Generates documentation for code",
      executionMode: ToolExecutionMode.BATCH,
      input: {
        required: ["code"],
        schema: {
          type: "object",
          properties: {
            code: { type: "string" },
            analysis: { type: "object" },
            includeSecurity: { type: "boolean", default: true },
            includeAnalysis: { type: "boolean", default: true },
          },
        },
      },
      output: {
        schema: {
          type: "object",
          required: ["overview", "functions", "examples"],
        },
      },
    });
  }

  async execute(input: { code: string; analysis?: any }): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      this.logger.debug("Starting documentation generation");

      const llm = new OpenAIProvider({
        apiKey: config?.openai?.apiKey || "",
        defaultModel: config?.openai?.model as LLMChatModel,
      });

      const prompt = `
        Generate comprehensive documentation for the following code.
        Include:
        1. Overview and purpose
        2. Function/method documentation
        3. Input/output specifications
        4. Dependencies
        5. Usage examples
        
        ${input.analysis ? `\nConsider this analysis: ${JSON.stringify(input.analysis)}` : ""}
        
        Code: """${input.code}"""

        Format your response as JSON with these fields:
        {
          "overview": string,
          "functions": Array<{
            "name": string,
            "description": string,
            "params": Array<{
              "name": string,
              "type": string,
              "description": string
            }>,
            "returns": {
              "type": string,
              "description": string
            }
          }>,
          "examples": string[],
          "dependencies": string[],
          "notes": string[]
        }
      `;

      const response = await llm.complete(prompt, {
        responseFormat: "json_object",
      });

      this.logger.debug("Documentation generation completed", {
        duration: Date.now() - startTime,
      });

      return {
        success: true,
        data: JSON.parse(response?.content),
        metrics: {
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      this.logger.error("Documentation generation failed:", error);
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

async function runCodeReviewChain() {
  const logger = new Logger({
    level: LogLevel.DEBUG,
    prefix: "CodeReviewChain",
  });

  ConfigurationManager.getInstance().setConfig({
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  });

  const analyzer = new CodeAnalyzerTool();
  const security = new SecurityScannerTool();
  const documentation = new DocumentationGeneratorTool();

  const llmProvider = new OpenAIProvider({
    apiKey: config?.openai?.apiKey || "",
    defaultModel: config?.openai?.model as LLMChatModel,
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

  const chainConfig: ChainConfig = {
    name: "code-review-chain",
    llmProvider,
    tools: [analyzer, security, documentation],
    maxIterations: 1,
    steps: [
      {
        name: "analysis",
        tool: "code-analyzer",
        input: {
          extractCode: true,
        },
      },
      {
        name: "security-review",
        tool: "security-scanner",
        input: {
          includeContext: true,
        },
      },
      {
        name: "generate-docs",
        tool: "documentation-generator",
        input: {
          includeSecurity: true,
          includeAnalysis: true,
        },
      },
    ],
  };

  const chain = new Chain(chainConfig);

  // Setup visualization nodes
  graphManager.addNode({
    id: "processor",
    type: "system",
    label: "Code Review System",
    data: { status: "initializing" },
    status: "running",
  });

  // Add step visualization
  chainConfig.steps.forEach((step, index) => {
    const stepNode: GraphNode = {
      id: step.name,
      type: "tool",
      label: step.name.charAt(0).toUpperCase() + step.name.slice(1),
      status: "pending",
    };

    const edge: GraphEdge = {
      id: `flow-to-${step.name}`,
      source: index === 0 ? "processor" : chainConfig.steps[index - 1].name,
      target: step.name,
      type: "flow",
    };

    graphManager.addNode(stepNode);
    graphManager.addEdge(edge);
  });

  // Add chain event listeners
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

  // Sample code to review
  const codeToReview = `
    function processUserData(userData) {
      const sql = 'SELECT * FROM users WHERE id = ' + userData.id;
      db.query(sql, (err, result) => {
        if (err) throw err;
        return result;
      });
    }
  `;

  try {
    logger.info("Starting code review");

    const result = await chain.runAgentLoop({
      code: codeToReview,
      context: {
        language: "javascript",
        environment: "node.js",
      },
    });

    // Update final status
    graphManager.updateNode("processor", {
      status: "completed",
      data: {
        duration: result?.metrics?.duration,
        totalSteps: result?.steps?.length,
      },
    });

    logger.info("Code review completed", {
      duration: result?.metrics?.duration,
      steps: result?.steps?.length,
      output: result?.output,
    });
    
  } catch (error) {
    logger.error("Code review failed:", error);

    // Update error status in visualization
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

  // Cleanup handler
  process.on("SIGINT", () => {
    vizServer.close();
    process.exit();
  });
}

runCodeReviewChain().catch(console.error);
