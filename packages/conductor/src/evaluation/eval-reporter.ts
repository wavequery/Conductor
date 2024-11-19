import {
  EvaluationResult,
  EvaluationReport,
  EvaluationOptions,
  MetricResult,
} from "@/types/interfaces/evaluation";

export class SQLEvaluationReporter {
  private options: EvaluationOptions;

  constructor(options: EvaluationOptions) {
    this.options = options;
  }

  generateReport(results: EvaluationResult[]): EvaluationReport {
    const summary = {
      totalTests: results.length,
      passedTests: results.filter((r) => !r.error).length,
      failedTests: results.filter((r) => r.error).length,
      averageMetrics: this.calculateAverageMetrics(results),
    };

    return {
      summary,
      results,
      metadata: {
        timestamp: new Date(),
        duration: results.reduce((sum, r) => sum + r.duration, 0),
        options: this.options,
      },
    };
  }

  private calculateAverageMetrics(
    results: EvaluationResult[]
  ): Record<string, number> {
    const metrics: Record<string, number[]> = {};

    for (const result of results) {
      for (const [name, metric] of Object.entries(result.metrics)) {
        if (!metrics[name]) metrics[name] = [];
        metrics[name].push(metric.value);
      }
    }

    return Object.fromEntries(
      Object.entries(metrics).map(([name, values]) => [
        name,
        values.reduce((sum, val) => sum + val, 0) / values.length,
      ])
    );
  }
}
