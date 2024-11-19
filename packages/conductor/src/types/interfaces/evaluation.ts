export interface EvaluationMetric<T = any> {
  name: string;
  description: string;
  compute(actual: T, expected: T): Promise<number>;
  normalize?(value: number): number;
  threshold?: number;
}

export interface TestCase<Input = any, Output = any> {
  id: string;
  name: string;
  description?: string;
  input: Input;
  expectedOutput: Output;
  metadata?: Record<string, any>;
  timeout?: number;
}

export interface TestSuite<Input = any, Output = any> {
  name: string;
  description?: string;
  testCases: TestCase<Input, Output>[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  metadata?: Record<string, any>;
}

export interface EvaluationResult {
  testCase: TestCase;
  success: boolean;
  actualOutput: any;
  metrics: Record<string, MetricResult>;
  error?: Error;
  duration: number;
  metadata?: Record<string, any>;
}

export interface EvaluationSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageMetrics: Record<string, number>;
  duration: number;
  timestamp: Date;
}

export interface MetricResult {
  value: number;
  details?: Record<string, any>;
}

export interface SQLTestCase {
  id: string;
  description: string;
  question: string;
  context: any;
  query: string;
  results?: any[];
  metadata?: Record<string, any>;
}

export interface EvaluationOptions {
  metrics: SQLMetric[];
  timeout?: number;
  parallel?: boolean;
}


export interface SQLMetric {
  name: string;
  description: string;
  compute(generated: SQLTestCase, expected: SQLTestCase): Promise<MetricResult>;
}


export interface EvaluationReport {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageMetrics: Record<string, number>;
  };
  results: EvaluationResult[];
  metadata: {
    timestamp: Date;
    duration: number;
    options: EvaluationOptions;
  };
}