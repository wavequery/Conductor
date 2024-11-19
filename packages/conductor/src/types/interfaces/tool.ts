export interface Tool {
  name: string;
  description: string;
  version?: string;
  execute(input: any): Promise<any>;
}

export interface ToolMetrics {
  duration: number;
  resourceUsage?: Record<string, number>;
  [key: string]: any;
}

export interface ToolMetadata {
  name: string;
  description: string;
  version: string;
  author?: string;
  category?: string;
  tags?: string[];
  requires?: {
    authentication?: boolean;
    permissions?: string[];
    dependencies?: string[];
  };
}

export interface ToolContext {
  sessionId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data: any;
  error?: Error;
  metrics?: ToolMetrics;
}


export interface ValidationError {
  path: string[];
  message: string;
}

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ToolValidation {
  validateInput(input: unknown): Promise<ValidationResult>;
  validateOutput(output: unknown): Promise<ValidationResult>;
  getInputSchema(): Record<string, any>;
  getOutputSchema(): Record<string, any>;
}

