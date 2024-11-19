import { LLMProvider } from "@/types/interfaces/llm";
import { Tool } from "@/types/interfaces/tool"

export interface AgentConfig {
  name: string;
  llmProvider: LLMProvider;
  tools: Tool[];
  maxIterations?: number;
  defaultTimeout?: number;
}

export interface AgentResponse {
  output: any;
  steps: AgentStep[];
  metrics: {
    totalTokens: number;
    totalCost: number;
    duration: number;
  };
}

export interface AgentStep {
  type: "tool" | "llm" | "observation";
  name: string;
  input: any;
  output: any;
  error?: Error;
  timestamp: Date;
  duration: number;
}

export interface ChainConfig extends AgentConfig {
  steps: Array<{
    name: string;
    tool?: string;
    prompt?: string;
    input?: Record<string, any>;
  }>;
}

export interface WorkflowConfig {
  name: string;
  agents: AgentConfig[];
  graph: {
    nodes: string[];
    edges: Array<{
      from: string;
      to: string;
      condition?: string;
    }>;
  };
}
