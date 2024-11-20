import { MetricResult, SQLMetric } from "./evaluation";
import { TextToSQLService } from "./sql";

export interface SQLTestCase {
  id: string;
  description: string;
  question: string;
  context: any;
  query: string;
  results?: any[];
  metadata?: Record<string, any>;
}

export interface EvaluationResult {
  testCase: SQLTestCase;
  metrics: Record<string, MetricResult | Promise<MetricResult> >;
  duration: number;
  error?: Error;
}

export interface EvaluationOptions {
  metrics: SQLMetric[];
  timeout?: number;
  parallel?: boolean;
}

export class SQLEvaluationRunner {
  constructor(
    private service: TextToSQLService,
    private options: EvaluationOptions
  ) {}

  async evaluateTestCase(testCase: SQLTestCase): Promise<EvaluationResult> {
    const startTime = Date.now();

    try {
      const generated = await this.service.processQuestion(
        testCase.question,
        testCase.context
      );

      const metrics: Record<string, MetricResult | Promise<MetricResult>> = {};

      for (const metric of this.options.metrics) {
        metrics[metric.name] = metric.compute(
          { ...testCase, query: generated.query },
          testCase
        );
      }

      return {
        testCase,
        metrics,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        testCase,
        metrics: {},
        duration: Date.now() - startTime,
        error,
      };
    }
  }

  async evaluateTestSuite(
    testCases: SQLTestCase[]
  ): Promise<EvaluationResult[]> {
    if (this.options.parallel) {
      return Promise.all(testCases.map((tc) => this.evaluateTestCase(tc)));
    }

    const results: EvaluationResult[] = [];
    for (const testCase of testCases) {
      results.push(await this.evaluateTestCase(testCase));
    }
    return results;
  }
}
