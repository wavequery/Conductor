import { ToolRegistry } from "../tool-registry";
import { Tool } from "@/types/interfaces/tool";
import { ToolType } from "@/types/enums/tool-type";

describe("ToolRegistry", () => {
  let registry: ToolRegistry;
  let mockTool: Tool;

  beforeEach(() => {
    registry = new ToolRegistry();
    mockTool = {
      name: "test-tool",
      description: "Test tool",
      execute: jest.fn(),
    };
  });

  it("should register and retrieve tools", () => {
    registry.register(mockTool, ToolType.ANALYSIS);

    const retrieved = registry.get("test-tool");
    expect(retrieved).toBe(mockTool);
  });

  it("should retrieve tools by type", () => {
    registry.register(mockTool, ToolType.ANALYSIS);

    const tools = registry.getByType(ToolType.ANALYSIS);
    expect(tools).toHaveLength(1);
    expect(tools[0]).toBe(mockTool);
  });

  it("should prevent duplicate registration", () => {
    registry.register(mockTool, ToolType.ANALYSIS);

    expect(() => {
      registry.register(mockTool, ToolType.ANALYSIS);
    }).toThrow();
  });

  it("should unregister tools", () => {
    registry.register(mockTool, ToolType.ANALYSIS);
    registry.unregister("test-tool");

    expect(() => registry.get("test-tool")).toThrow();
    expect(registry.getByType(ToolType.ANALYSIS)).toHaveLength(0);
  });

  it("should list all tools and types", () => {
    registry.register(mockTool, ToolType.ANALYSIS);

    expect(registry.listTools()).toContain("test-tool");
    expect(registry.listTypes()).toContain(ToolType.ANALYSIS);
  });
});
