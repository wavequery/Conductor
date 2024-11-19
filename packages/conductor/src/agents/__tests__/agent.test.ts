import { Agent } from "../agent";
import { AgentConfig } from "@/types/interfaces/agent";
import { Tool } from "@/types/interfaces/tool";
import { LLMProvider } from "@/types/interfaces/llm";

describe("Agent", () => {
  let mockTool: jest.Mocked<Tool>;
  let mockLLM: jest.Mocked<LLMProvider>;
  let agent: Agent;

  beforeEach(() => {
    mockTool = {
      name: "test-tool",
      description: "Test tool",
      execute: jest.fn(),
    };

    mockLLM = {
      complete: jest.fn(),
      completeWithFunctions: jest.fn(),
    };

    const config: AgentConfig = {
      name: "test-agent",
      llmProvider: mockLLM,
      tools: [mockTool],
    };

    agent = new Agent(config);
  });

  it("should execute tools based on LLM decisions", async () => {
    mockLLM.complete.mockResolvedValueOnce({
      content: JSON.stringify({
        tool: "test-tool",
        action: { test: true },
      }),
    });

    mockTool.execute.mockResolvedValueOnce({ result: "success" });

    const result = await agent.execute({ input: "test" });

    expect(result.steps).toHaveLength(1);
    expect(mockTool.execute).toHaveBeenCalledWith({ test: true });
    expect(result.output).toEqual({ result: "success" });
  });

  it("should handle tool execution errors", async () => {
    mockLLM.complete.mockResolvedValueOnce({
      content: JSON.stringify({
        tool: "test-tool",
        action: { test: true },
      }),
    });

    mockTool.execute.mockRejectedValueOnce(new Error("Tool error"));

    await expect(agent.execute({ input: "test" })).rejects.toThrow(
      "Tool error"
    );
  });
});
