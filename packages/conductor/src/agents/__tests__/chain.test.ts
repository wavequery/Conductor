import { Chain } from "../chain";
import { ChainConfig } from "@/types/interfaces/agent";
import { Tool } from "@/types/interfaces/tool";
import { LLMProvider } from "@/types/interfaces/llm";

describe("Chain", () => {
  let mockTool: jest.Mocked<Tool>;
  let mockLLM: jest.Mocked<LLMProvider>;
  let chain: Chain;

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

    const config: ChainConfig = {
      name: "test-chain",
      llmProvider: mockLLM,
      tools: [mockTool],
      steps: [
        {
          name: "step1",
          tool: "test-tool",
          input: { test: true },
        },
        {
          name: "step2",
          prompt: "Process {input}",
        },
      ],
    };

    chain = new Chain(config);
  });

  it("should execute chain steps in order", async () => {
    mockTool.execute.mockResolvedValueOnce({ result: "step1" });
    mockLLM.complete.mockResolvedValueOnce({ content: "step2 result" });

    const result = await chain.execute({ initial: "input" });

    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].output).toEqual({ result: "step1" });
    expect(result.steps[1].output.content).toEqual("step2 result");
  });
});
