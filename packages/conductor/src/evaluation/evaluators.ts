import { Logger, LogLevel } from "@/utils/logger";
import { EvalResult, EvalConfig, EvalMetric } from "@/types/interfaces/evals";


export interface FeedbackData extends Record<string, any> {
  evaluator: string;
  [key: string]: any;
}

export abstract class BaseEvaluator {
  protected config: EvalConfig;
  protected logger: Logger;

  constructor(config: EvalConfig) {
    this.config = config;
    this.logger = new Logger({
      level: LogLevel.DEBUG,
      prefix: "Evaluator",
    });
  }

  abstract evaluate(input: any, expected?: any): Promise<EvalResult[]>;
}

export class AutomatedEvaluator extends BaseEvaluator {
  async evaluate(input: any, expected?: any): Promise<EvalResult[]> {
    const results: EvalResult[] = [];
    const startTime = Date.now();

    for (const metric of this.config.metrics) {
      if (metric.type !== "automated") continue;

      try {
        const result = await this.evaluateMetric(metric, input, expected);
        results.push(result);
      } catch (error) {
        this.logger.error(`Metric ${metric.name} failed:`, error);
      }
    }

    return results;
  }

  private async evaluateMetric(
    metric: EvalMetric,
    input: any,
    expected?: any
  ): Promise<EvalResult> {
    switch (metric.name) {
      case "responseTime":
        return this.evaluateResponseTime(input);
      case "tokenUsage":
        return this.evaluateTokenUsage(input);
      case "errorRate":
        return this.evaluateErrorRate(input);
      default:
        throw new Error(`Unknown metric: ${metric.name}`);
    }
  }

  private async evaluateResponseTime(input: any): Promise<EvalResult> {
    const duration = input.metrics?.duration || 0;
    const score = Math.min(1, 5000 / duration);

    return {
      metricName: "responseTime",
      score,
      metadata: { duration },
      timestamp: new Date(),
    };
  }

  private async evaluateTokenUsage(input: any): Promise<EvalResult> {
    const tokens = input.metrics?.tokens || 0;
    const score = Math.min(1, 2000 / tokens);

    return {
      metricName: "tokenUsage",
      score,
      metadata: { tokens },
      timestamp: new Date(),
    };
  }

  private async evaluateErrorRate(input: any): Promise<EvalResult> {
    const success = input.success === true;
    return {
      metricName: "errorRate",
      score: success ? 1 : 0,
      metadata: { error: input.error },
      timestamp: new Date(),
    };
  }
}

export class HumanEvaluator extends BaseEvaluator {
  async evaluate(
    input: any,
    feedback: FeedbackData
  ): Promise<EvalResult[]> {
    const results: EvalResult[] = [];

    for (const metric of this.config.metrics) {
      if (metric.type !== "human") continue;

      const score = feedback[metric.name] || 0;
      results.push({
        metricName: metric.name,
        score,
        metadata: { feedback: feedback[`${metric.name}_feedback`] },
        timestamp: new Date(),
        evaluator: feedback.evaluator,
      });
    }

    return results;
  }
}

export class CustomEvaluator extends BaseEvaluator {
  private customMetrics: Map<
    string,
    (input: any, expected?: any) => Promise<number>
  >;

  constructor(config: EvalConfig) {
    super(config);
    this.customMetrics = new Map();
  }

  registerMetric(
    name: string,
    evaluator: (input: any, expected?: any) => Promise<number>
  ) {
    this.customMetrics.set(name, evaluator);
  }

  async evaluate(input: any, expected?: any): Promise<EvalResult[]> {
    const results: EvalResult[] = [];

    for (const [name, evaluator] of this.customMetrics) {
      try {
        const score = await evaluator(input, expected);
        results.push({
          metricName: name,
          score,
          metadata: { input, expected },
          timestamp: new Date(),
        });
      } catch (error) {
        this.logger.error(`Custom metric ${name} failed:`, error);
      }
    }

    return results;
  }
}
