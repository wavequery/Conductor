import { Logger, LogLevel } from "@/utils/logger";
import { EvalResult } from "@/types/interfaces/evals";

export interface ReportOptions {
  format?: "text" | "json" | "markdown";
  includeMetadata?: boolean;
  includeTimestamp?: boolean;
  includeSummary?: boolean;
  includeRecommendations?: boolean;
}

export class EvalReporter {
  private logger: Logger;

  constructor() {
    this.logger = new Logger({
      level: LogLevel.DEBUG,
      prefix: "EvalReporter",
    });
  }

  generateReport(
    results: EvalResult[],
    options: ReportOptions = {
      format: "markdown",
      includeMetadata: true,
      includeTimestamp: true,
      includeSummary: true,
      includeRecommendations: true,
    }
  ): string {
    try {
      const sections = [
        options.includeSummary && this.generateSummary(results),
        this.generateDetailed(results, options),
        options.includeRecommendations && this.generateRecommendations(results),
      ].filter(Boolean);

      return sections.join("\n\n");
    } catch (error) {
      this.logger.error("Report generation failed:", error);
      throw error;
    }
  }

  async generateAsyncReport(
    results: EvalResult[],
    options?: ReportOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const report = this.generateReport(results, options);
        resolve(report);
      } catch (error) {
        reject(error);
      }
    });
  }

  private generateSummary(results: EvalResult[]): string {
    const avgScore =
      results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const timestamp = new Date().toISOString();
    const successfulMetrics = results.filter((r) => r.score >= 0.7).length;

    return `
        # Evaluation Summary
        - Overall Score: ${(avgScore * 100).toFixed(2)}%
        - Total Metrics: ${results.length}
        - Successful Metrics: ${successfulMetrics}
        - Failed Metrics: ${results.length - successfulMetrics}
        - Timestamp: ${timestamp}
    `.trim();
  }

  private generateDetailed(
    results: EvalResult[],
    options: ReportOptions
  ): string {
    return `
          # Detailed Results

          ${results
            .map(
              (r) => `
          ## ${r.metricName}
          - Score: ${(r.score * 100).toFixed(2)}%
          ${options.includeMetadata ? this.formatMetadata(r.metadata) : ""}
          ${options.includeTimestamp ? `- Timestamp: ${r.timestamp.toISOString()}` : ""}
          ${r.evaluator ? `- Evaluator: ${r.evaluator}` : ""}
          `
        )
        .join("\n")}
          `.trim();
  }

  private formatMetadata(metadata: Record<string, any>): string {
    return Object.entries(metadata)
      .map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`)
      .join("\n");
  }

  private generateRecommendations(results: EvalResult[]): string {
    const lowScores = results.filter((r) => r.score < 0.7);

    if (lowScores.length === 0) {
      return "# Recommendations\nAll metrics are performing well! No immediate improvements needed.";
    }

    return `
          # Recommendations

          ${lowScores
            .map(
              (r) => `
          - Improve ${r.metricName}
            - Current score: ${(r.score * 100).toFixed(2)}%
            - Action needed: ${this.getRecommendation(r)}
          `
        )
        .join("\n")}
          `.trim();
  }

  private getRecommendation(result: EvalResult): string {
    switch (result.metricName) {
      case "responseTime":
        return "Consider optimizing performance or increasing compute resources";
      case "tokenUsage":
        return "Review prompt engineering to reduce token consumption";
      case "accuracy":
        return "Review model configuration and input preprocessing";
      default:
        return "Review implementation and configuration";
    }
  }

  exportToJSON(results: EvalResult[]): string {
    return JSON.stringify(
      {
        summary: {
          averageScore:
            results.reduce((sum, r) => sum + r.score, 0) / results.length,
          totalMetrics: results.length,
          timestamp: new Date().toISOString(),
        },
        results: results.map((r) => ({
          ...r,
          timestamp: r.timestamp.toISOString(),
        })),
      },
      null,
      2
    );
  }
}
