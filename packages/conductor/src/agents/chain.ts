import { Agent } from "@/agents/agent";
import { ChainConfig, AgentResponse, AgentStep } from '@/types/interfaces/agent';

export class Chain extends Agent {
  protected config: ChainConfig;

  constructor(config: ChainConfig) {
    super(config);
    this.config = config;
    this.steps = [];
  }

  public async runAgentLoop(input: any): Promise<any> {
    let currentInput = input;
    const startTime = Date.now();
    
    for (const step of this.config.steps) {
      const stepResult = await this.executeChainStep(step, currentInput);
      this.steps.push(stepResult);
      this.emit('step', stepResult);

      if (stepResult.error) {
        throw stepResult.error;
      }

      currentInput = {...input ,...stepResult.output};
    }

    return { 
      output: currentInput,
      metrics: {
        duration: Date.now() - startTime
      },
      steps:  this.steps 
    };
  }

  private async executeChainStep(
    stepConfig: ChainConfig['steps'][0],
    input: any
  ): Promise<AgentStep> {
    const startTime = Date.now();

    try {
      let output;
      if (stepConfig.tool) {
        const tool = this.getTool(stepConfig.tool);
        output = await tool.execute({
          ...stepConfig.input,
          ...input
        });
      } else if (stepConfig.prompt) {
        output = await this.config.llmProvider.complete(
          this.replaceVariables(stepConfig.prompt, input)
        );
      } else {
        throw new Error('Step must have either tool or prompt');
      }

      return {
        type: stepConfig.tool ? 'tool' : 'llm',
        name: stepConfig.name,
        input,
        output,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        type: 'tool',
        name: stepConfig.name,
        input,
        output: null,
        error,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    }
  }

  private replaceVariables(prompt: string, input: any): string {
    return prompt.replace(/\{([^}]+)\}/g, (_, key) => {
      return input[key] || `{${key}}`;
    });
  }
}