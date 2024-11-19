import { BaseTool } from "../base-tool";
import { ToolConfig } from "@/types/schemas/tool-config";
import { ToolType, ToolExecutionMode } from "@/types/enums/tool-type";

class TestTool extends BaseTool {
  async execute(input: any) {
    return {
      success: true,
      data: input,
    };
  }
}

describe("BaseTool", () => {
  const validConfig: ToolConfig = {
    name: "test-tool",
    type: ToolType.ANALYSIS,
    version: "1.0.0",
    description: "Test tool",
    executionMode: ToolExecutionMode.SYNC,
    input: {
      schema: {},
      required: [],
    },
    output: {
      schema: {},
    },
  };

  it("should create tool with valid config", () => {
    const tool = new TestTool(validConfig);
    expect(tool.name).toBe("test-tool");
    expect(tool.description).toBe("Test tool");
  });

  it("should throw error for invalid config", () => {
    const invalidConfig = { ...validConfig, version: "invalid" };
    expect(() => new TestTool(invalidConfig as any)).toThrow();
  });

  it("should handle retries", async () => {
    const tool = new TestTool(validConfig);
    let attempts = 0;

    const result = await tool["executeWithRetry"](async () => {
      attempts++;
      if (attempts < 2) throw new Error("Retry test");
      return "success";
    });

    expect(attempts).toBe(2);
    expect(result).toBe("success");
  });
});
