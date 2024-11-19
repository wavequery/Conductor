import type { Pipeline } from "@xenova/transformers";
import {
  LLMProvider,
  LLMConfig,
  LLMResponse,
  LLMFunction,
  LLMFunctionResponse,
} from "@/types/interfaces/llm";

export interface HuggingFaceProviderConfig {
  model: string;
  useGPU?: boolean;
}

interface CustomPipeline extends Omit<Pipeline, "processor"> {
  processor?: any;
  (text: string, options?: any): Promise<any>;
}

export class HuggingFaceProvider implements LLMProvider {
  private model: string;
  private pipeline: CustomPipeline | null = null;

  constructor(config: HuggingFaceProviderConfig) {
    this.model = config.model;
  }

  private async ensurePipeline() {
    if (!this.pipeline) {
      const transformers = await import("@xenova/transformers");
      this.pipeline = (await transformers.pipeline(
        "text-generation",
        this.model
      )) as CustomPipeline;
    }
    return this.pipeline;
  }

  async complete(
    prompt: string,
    options: LLMConfig = {}
  ): Promise<LLMResponse> {
    try {
      const pipe = await this.ensurePipeline();
      const response = await pipe(prompt, {
        max_new_tokens: options.maxTokens,
        temperature: options.temperature,
      });

      return {
        content: response[0].generated_text,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        raw: response,
      };
    } catch (error) {
      throw new Error(`HuggingFace completion error: ${error.message}`);
    }
  }

  async completeWithFunctions(
    prompt: string,
    functions: LLMFunction[],
    options: LLMConfig = {}
  ): Promise<LLMFunctionResponse> {
    // Similar to Anthropic, format functions as part of the prompt
    const functionsPrompt = `
      You must respond using one of these functions:
      ${JSON.stringify(functions, null, 2)}
      
      Your response must be a JSON object with a "name" field indicating the function
      and an "arguments" object containing the function parameters.
      
      Original request: ${prompt}
    `;

    try {
      const response = await this.complete(functionsPrompt, options);

      try {
        const parsedResponse = JSON.parse(response.content);
        return {
          ...response,
          functionCall: {
            name: parsedResponse.name,
            arguments: parsedResponse.arguments,
          },
        };
      } catch (parseError) {
        throw new Error(
          "Failed to parse function call response from HuggingFace model"
        );
      }
    } catch (error) {
      throw new Error(
        `HuggingFace function completion error: ${error.message}`
      );
    }
  }
}
