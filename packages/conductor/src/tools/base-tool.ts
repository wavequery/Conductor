import { EventEmitter } from "events";
import {
  Tool,
  ToolMetadata,
  ToolContext,
  ToolResult,
} from "@/types/interfaces/tool";
import { ToolType, ToolExecutionMode } from "@/types/enums/tool-type";
import { ToolConfig } from "@/types/schemas/tool-config";
import { toolConfigSchema } from "@/types/schemas/tool-config";

export abstract class BaseTool extends EventEmitter implements Tool {
  protected config: ToolConfig;
  protected metadata: ToolMetadata;

  constructor(config: ToolConfig) {
    super();
    this.validateConfig(config);
    this.config = config;
    this.metadata = {
      name: config.name,
      description: config.description,
      version: config.version,
      author: config.author,
    };
  }

  get name(): string {
    return this.config.name;
  }

  get description(): string {
    return this.config.description;
  }

  abstract execute(input: any, context?: ToolContext): Promise<ToolResult>;

  protected validateConfig(config: ToolConfig): void {
    try {
      toolConfigSchema.parse(config);
    } catch (error) {
      throw new Error(`Invalid tool configuration: ${error.message}`);
    }
  }

  protected createContext(): ToolContext {
    return {
      sessionId: Math.random().toString(36).substring(7),
      timestamp: new Date(),
    };
  }

  protected async executeWithRetry(
    fn: () => Promise<any>,
    maxRetries: number = this.config.limits?.maxRetries || 3
  ): Promise<any> {
    let lastError: Error;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        this.emit("retry", { attempt, error, tool: this.name });
        if (attempt < maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
      }
    }
    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
