interface EvalMetric {
  name: string;
  description: string;
  type: "automated" | "human" | "hybrid";
  weight?: number;
  tags?: string[];
}

interface EvalResult {
  metricName: string;
  score: number;
  metadata: Record<string, any>;
  timestamp: Date;
  evaluator?: string;
}

interface EvalConfig {
  metrics: EvalMetric[];
  threshold?: number;
  aggregation?: "mean" | "weighted" | "min" | "max";
  retries?: number;
  timeout?: number;
  visualization?: boolean;
}

interface HumanFeedback {
  evaluator: string;
  [metricName: string]: string | number;
}

export { EvalConfig, EvalMetric, EvalResult, HumanFeedback };
