import OpenAI from "openai";
import {
  LLMProvider,
  LLMConfig,
  LLMResponse,
  LLMChatModel,
  LLMFunction,
  LLMFunctionResponse,
} from "@/types/interfaces/llm";

export interface OpenAIProviderConfig {
  apiKey: string;
  organizationId?: string;
  defaultModel?: LLMChatModel;
}

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private defaultModel: LLMChatModel;

  constructor(config: OpenAIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organizationId,
    });
    this.defaultModel = config.defaultModel;
  }

  async complete(
    prompt: string,
    options: LLMConfig = {}
  ): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || this.defaultModel,
        messages: [{ role: "user", content: prompt }],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        response_format: options.responseFormat
          ? { type: options.responseFormat }
          : undefined,
      });

      const completion = response.choices[0];

      return {
        content: completion.message.content || "",
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        raw: response,
      };
    } catch (error) {
      throw new Error(`OpenAI completion error: ${error.message}`);
    }
  }

  async completeWithFunctions(
    prompt: string,
    functions: LLMFunction[],
    options: LLMConfig = {}
  ): Promise<LLMFunctionResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || this.defaultModel,
        messages: [{ role: "user", content: prompt }],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        tools: functions.map((fn) => ({
          type: "function",
          function: fn,
        })),
        tool_choice: "auto",
      });

      const completion = response.choices[0];
      const toolCall = completion.message.tool_calls?.[0];

      return {
        content: completion.message.content || "",
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        functionCall: toolCall
          ? {
              name: toolCall.function.name,
              arguments: JSON.parse(toolCall.function.arguments),
            }
          : undefined,
        raw: response,
      };
    } catch (error) {
      throw new Error(`OpenAI function completion error: ${error.message}`);
    }
  }
}
