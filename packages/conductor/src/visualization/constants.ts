import { VisualizationConfig } from "@/types/interfaces/visualization";

export const DEFAULT_CONFIG: Required<VisualizationConfig> = {
  theme: "light",
  autoLayout: true,
  fitView: true,
  interactive: true,
  nodeTypes: {
    agent: { strokeWidth: 3 },
    tool: { strokeWidth: 2, strokeDasharray: "3,3" },
    llm: { strokeWidth: 3 },
    data: { strokeWidth: 2 },
    system: { strokeWidth: 4 },
  },
  edgeTypes: {
    flow: { strokeDasharray: "5,5" },
    data: { strokeWidth: 3 },
    control: { strokeDasharray: "3,3" },
  },
};
