import { EventEmitter } from "events";
import { Workflow } from "../workflow";
import {
  WorkflowConfig,
  AgentResponse,
  AgentStep,
} from "@/types/interfaces/agent";
import { Tool } from "@/types/interfaces/tool";
import { Agent } from "../agent";

jest.mock("../agent");

describe("Workflow", () => {
  let workflow: Workflow;
  let config: WorkflowConfig;

  beforeEach(() => {
    // Define the mock agent with explicit typing

    const mockEventEmitter = new EventEmitter();
    const eventEmitterMethods = Object.getOwnPropertyNames(
      EventEmitter.prototype
    ).reduce(
      (acc, method) => {
        if (method !== "constructor") {
          acc[method] = jest
            .fn()
            .mockImplementation((...args: any[]) =>
              mockEventEmitter[method as keyof EventEmitter].apply(
                mockEventEmitter,
                args
              )
            );
        }
        return acc;
      },
      {} as Record<string, jest.Mock>
    );

    const mockAgent = {
      ...eventEmitterMethods,
      config: {
        name: "test-agent",
        llmProvider: {} as any,
        tools: [] as Tool[],
      },
      steps: [] as AgentStep[],
      startTime: 0,
      execute: jest.fn().mockResolvedValue({
        output: { result: "success" },
        steps: [],
        metrics: {
          totalTokens: 0,
          totalCost: 0,
          duration: 100,
        },
      } as AgentResponse),
      runAgentLoop: jest.fn(),
      executeStep: jest.fn(),
      decideTool: jest.fn(),
      getTool: jest.fn(),
      createToolSelectionPrompt: jest.fn(),
      shouldStop: jest.fn(),
      createResponse: jest.fn(),
    };

    (Agent as jest.MockedClass<typeof Agent>).mockImplementation(
      () => mockAgent as unknown as Agent
    );

    config = {
      name: "test-workflow",
      agents: [
        {
          name: "agent1",
          llmProvider: {} as any,
          tools: [],
        },
        {
          name: "agent2",
          llmProvider: {} as any,
          tools: [],
        },
      ],
      graph: {
        nodes: ["agent1", "agent2"],
        edges: [
          {
            from: "agent1",
            to: "agent2",
          },
        ],
      },
    };

    workflow = new Workflow(config);
  });

  it("should create a workflow with the correct execution order", () => {
    workflow = new Workflow(config);
    expect(workflow).toBeDefined();
  });

  it("should execute agents in the correct order", async () => {
    const results = await workflow.execute({ test: true });
    expect(results).toHaveProperty("agent1");
    expect(results).toHaveProperty("agent2");
  });

  it("should detect cycles in the workflow graph", () => {
    config.graph.edges.push({
      from: "agent2",
      to: "agent1",
    });

    expect(() => new Workflow(config)).toThrow("Workflow has cycles");
  });

  it("should handle agent execution errors", async () => {
    // Update the mock for this specific test
    const mockAgent = (Agent as jest.MockedClass<typeof Agent>).mock.results[0]
      .value;
    mockAgent.execute.mockRejectedValueOnce(
      new Error("Agent execution failed")
    );

    await expect(workflow.execute({ test: true })).rejects.toThrow(
      "Agent execution failed"
    );
  });

  // it("should pass results from previous agents as input", async () => {
  //   let capturedInput: any;
  //   (Agent as jest.MockedClass<typeof Agent>).mockImplementation(() => ({
  //     execute: jest.fn().mockImplementation((input) => {
  //       capturedInput = input;
  //       return {
  //         output: { result: "success" },
  //         steps: [],
  //         metrics: {
  //           totalTokens: 0,
  //           totalCost: 0,
  //           duration: 100,
  //         },
  //       };
  //     }),
  //     on: jest.fn(),
  //     emit: jest.fn(),
  //     // Other EventEmitter methods
  //     addListener: jest.fn(),
  //     removeListener: jest.fn(),
  //     removeAllListeners: jest.fn(),
  //     listeners: jest.fn(),
  //     rawListeners: jest.fn(),
  //     listenerCount: jest.fn(),
  //     prependListener: jest.fn(),
  //     prependOnceListener: jest.fn(),
  //     eventNames: jest.fn(),
  //     once: jest.fn(),
  //     off: jest.fn(),
  //   }));

  //   workflow = new Workflow(config);
  //   await workflow.execute({ initialInput: true });

  //   // Check that agent2 received agent1's output
  //   expect(capturedInput).toHaveProperty("agent1");
  // });

  it("should emit events for agent completion", (done) => {
    workflow = new Workflow(config);

    workflow.on("agentComplete", ({ agent, result }) => {
      expect(agent).toBe("agent1");
      expect(result.output.result).toBe("success");
      done();
    });

    workflow.execute({ test: true });
  });

  it("should handle conditional edges", async () => {
    config.graph.edges[0].condition = "result.success === true";

    workflow = new Workflow(config);
    const results = await workflow.execute({ test: true });

    expect(results).toHaveProperty("agent1");
    expect(results).toHaveProperty("agent2");
  });
});
