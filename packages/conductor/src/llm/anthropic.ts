import Anthropic from "@anthropic-ai/sdk";
import {
  LLMProvider,
  LLMConfig,
  LLMResponse,
  LLMFunction,
  LLMFunctionResponse,
} from "@/types/interfaces/llm";

export interface AnthropicProviderConfig {
  apiKey: string;
  defaultModel?: string;
}

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private defaultModel: string;

  constructor(config: AnthropicProviderConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.defaultModel = config.defaultModel || "claude-3-opus-20240229";
  }

  async complete(
    prompt: string,
    options: LLMConfig = {}
  ): Promise<LLMResponse> {
    try {
      const response = await this.client.messages.create({
        model: options.model || this.defaultModel,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        messages: [{ role: "user", content: prompt }],
        system: options.systemPrompt,
      });

      return {
        content: response.content[0].text,
        usage: {
          // Anthropic doesn't provide token usage in the same way
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        raw: response,
      };
    } catch (error) {
      throw new Error(`Anthropic completion error: ${error.message}`);
    }
  }

  async completeWithFunctions(
    prompt: string,
    functions: LLMFunction[],
    options: LLMConfig = {},
  ): Promise<LLMFunctionResponse> {
    try {
      // Claude doesn't have native function calling, so we format functions as JSON schema
      const functionsPrompt = `
        You must respond using one of these functions:
        ${JSON.stringify(functions, null, 2)}
        
        Your response must be a JSON object with a "name" field indicating the function
        and an "arguments" object containing the function parameters.
        
        Original request: ${prompt}
      `;

      const response = await this.complete(functionsPrompt, options);

      // Parse the response as a function call
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
          "Failed to parse function call response from Anthropic"
        );
      }
    } catch (error) {
      throw new Error(`Anthropic function completion error: ${error.message}`);
    }
  }
}
