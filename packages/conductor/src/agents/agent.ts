import { EventEmitter } from "events";
import {
  AgentConfig,
  AgentResponse,
  AgentStep,
} from "@/types/interfaces/agent";
import { Tool } from "@/types/interfaces/tool";

export class Agent extends EventEmitter {
  protected config: AgentConfig;
  protected steps: AgentStep[] = [];
  protected startTime: number = 0;

  constructor(config: AgentConfig) {
    super();
    this.config = {
      maxIterations: 1,
      defaultTimeout: 15000,
      ...config,
    };
  }

  async execute(input: any): Promise<AgentResponse> {
    this.startTime = Date.now();
    this.steps = [];

    try {
      const output = await this.runAgentLoop(input);
      return this.createResponse(output);
    } catch (error) {
      this.emit("error", error);
      throw error;
    }
  }

  protected async runAgentLoop(input: any): Promise<any> {
    let iteration = 0;
    let currentInput = input;

    while (iteration < this.config.maxIterations!) {
      const step = await this.executeStep(currentInput);
      this.steps.push(step);
      this.emit("step", step);

      if (step.error) {
        throw step.error;
      }

      currentInput = step.output;
      iteration++;

      if (this.shouldStop(step)) {
        break;
      }
    }

    return { output: currentInput, steps: this.steps };
  }

  protected async executeStep(input: any): Promise<AgentStep> {
    const startTime = Date.now();

    try {
      const { action, toolName } = await this.decideTool(input);
      const tool = this.getTool(toolName);
      const output = await tool.execute(action);

      return {
        type: "tool",
        name: toolName,
        input: action,
        output,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    } catch (error: unknown) {
      return {
        type: "tool",
        name: "error",
        input,
        output: null,
        error: error as Error,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  protected async decideTool(
    input: any
  ): Promise<{ action: any; toolName: string }> {
    const prompt = this.createToolSelectionPrompt(input);
    const response = await this.config.llmProvider.complete(prompt);

    try {
      const decision = JSON.parse(response.content);
      return {
        action: decision.action,
        toolName: decision.tool,
      };
    } catch (error) {
      throw new Error("Failed to parse tool decision");
    }
  }

  protected getTool(name: string): Tool {
    const tool = this.config.tools.find((t) => t.name === name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return tool;
  }

  protected createToolSelectionPrompt(input: any): string {
    const tools = this.config.tools.map((t) => ({
      name: t.name,
      description: t.description,
      tool_arguments: t.input,
    }));

    return `Given the following input: ${JSON.stringify(input)}
            Available tools: ${JSON.stringify(tools)}
            Select the most appropriate tool and specify the action.
            Response format: { "tool": "tool_name", "action": "arguments to be passed to the tool" }`;
  }

  protected shouldStop(step: AgentStep): boolean {
    return false;
  }

  protected createResponse(response: any): AgentResponse {
    return {
      output: response.output,
      steps: response.steps,
      metrics: {
        totalTokens: 0, // TODO: Implement token counting
        totalCost: 0, // TODO: Implement cost calculation
        duration: Date.now() - this.startTime,
      },
    };
  }
}
