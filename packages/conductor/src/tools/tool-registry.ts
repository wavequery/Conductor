import { Tool } from '@/types/interfaces/tool';
import { ToolType } from '@/types/enums/tool-type';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private typeIndex: Map<ToolType, Set<string>> = new Map();

  register(tool: Tool, type: ToolType): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool with name ${tool.name} is already registered`);
    }

    this.tools.set(tool.name, tool);
    
    if (!this.typeIndex.has(type)) {
      this.typeIndex.set(type, new Set());
    }
    this.typeIndex.get(type)!.add(tool.name);
  }

  get(name: string): Tool {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return tool;
  }

  getByType(type: ToolType): Tool[] {
    const toolNames = this.typeIndex.get(type);
    if (!toolNames) {
      return [];
    }
    return Array.from(toolNames).map(name => this.tools.get(name)!);
  }

  unregister(name: string): void {
    const tool = this.tools.get(name);
    if (tool) {
      this.tools.delete(name);
      for (const [type, tools] of this.typeIndex.entries()) {
        if (tools.has(name)) {
          tools.delete(name);
          if (tools.size === 0) {
            this.typeIndex.delete(type);
          }
        }
      }
    }
  }

  listTools(): string[] {
    return Array.from(this.tools.keys());
  }

  listTypes(): ToolType[] {
    return Array.from(this.typeIndex.keys());
  }
}