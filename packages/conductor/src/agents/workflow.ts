import { EventEmitter } from "events";
import { WorkflowConfig, AgentResponse } from "@/types/interfaces/agent";
import { Agent } from "@/agents/agent";

export class Workflow extends EventEmitter {
  private config: WorkflowConfig;
  private agents: Map<string, Agent> = new Map();
  private executionOrder: string[] = [];

  constructor(config: WorkflowConfig) {
    super();
    this.config = config;
    this.initializeAgents();
    this.computeExecutionOrder();
  }

  private initializeAgents() {
    for (const agentConfig of this.config.agents) {
      this.agents.set(agentConfig.name, new Agent(agentConfig));
    }
  }

  private computeExecutionOrder() {
    // Simple topological sort for now
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];

    const visit = (node: string) => {
      if (temp.has(node)) {
        throw new Error("Workflow has cycles");
      }
      if (visited.has(node)) return;

      temp.add(node);

      const edges = this.config.graph.edges.filter((e) => e.from === node);
      for (const edge of edges) {
        visit(edge.to);
      }

      temp.delete(node);
      visited.add(node);
      order.unshift(node);
    };

    for (const node of this.config.graph.nodes) {
      if (!visited.has(node)) {
        visit(node);
      }
    }

    this.executionOrder = order;
  }

  async execute(input: any): Promise<Record<string, AgentResponse>> {
    const results: Record<string, AgentResponse> = {};
    const cache: Record<string, any> = { input };

    for (const agentName of this.executionOrder) {
      const agent = this.agents.get(agentName)!;

      // Prepare input from previous steps
      const agentInput = this.prepareInput(agentName, cache);

      // Execute agent
      try {
        const result = await agent.execute(agentInput);
        results[agentName] = result;
        cache[agentName] = result.output;
        this.emit("agentComplete", { agent: agentName, result });
      } catch (error) {
        this.emit("error", { agent: agentName, error });
        throw error;
      }
    }

    return results;
  }

  private prepareInput(agentName: string, cache: Record<string, any>): any {
    const incomingEdges = this.config.graph.edges.filter(
      (e) => e.to === agentName
    );

    if (incomingEdges.length === 0) {
      return cache.input;
    }

    const input: Record<string, any> = {};
    for (const edge of incomingEdges) {
      input[edge.from] = cache[edge.from];
    }

    return input;
  }
}
