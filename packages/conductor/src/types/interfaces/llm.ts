import OpenAI from "openai";

export type LLMChatModel = OpenAI.ChatModel;

export interface LLMConfig {
  temperature?: number;
  maxTokens?: number;
  model?: LLMChatModel;
  enableFunctionCalling?: boolean;
  responseFormat?: "json_object" | "text";
  systemPrompt?: string;
}

export interface LLMProvider {
  complete(prompt: string, options?: LLMConfig): Promise<LLMResponse>;
  completeWithFunctions(
    prompt: string,
    functions: LLMFunction[],
    options?: LLMConfig
  ): Promise<LLMFunctionResponse>;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  raw?: any;
}

export interface LLMFunctionResponse extends LLMResponse {
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface LLMFunction {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}
