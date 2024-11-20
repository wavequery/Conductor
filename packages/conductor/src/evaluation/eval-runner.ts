import { Logger, LogLevel } from "@/utils/logger";
import { GraphNode } from "@/types/interfaces/visualization";
import { VizServer } from "@/visualization/server";
import {
  AutomatedEvaluator,
  HumanEvaluator,
  CustomEvaluator,
  BaseEvaluator,
} from "./evaluators";

import { EvalConfig, EvalResult } from "@/types/interfaces/evals";

export class EvalRunner {
  private evaluators: BaseEvaluator[];
  private config: EvalConfig;
  private logger: Logger;
  private vizServer?: VizServer;

  constructor(config: EvalConfig) {
    this.config = config;
    this.logger = new Logger({
      level: LogLevel.DEBUG,
      prefix: "EvalRunner",
    });

    this.evaluators = [
      new AutomatedEvaluator(config),
      new HumanEvaluator(config),
      new CustomEvaluator(config),
    ];

    if (config.visualization) {
      this.initializeVizServer();
    }
  }

  private initializeVizServer() {
    this.vizServer = new VizServer(undefined, {
      theme: "light",
    });
  }

  async runEvaluation(input: any, expected?: any): Promise<EvalResult[]> {
    const startTime = Date.now();
    const allResults: EvalResult[] = [];

    try {
      for (const evaluator of this.evaluators) {
        try {
          const results = await evaluator.evaluate(input, expected);
          allResults.push(...results);

          if (this.config.visualization) {
            await this.visualizeResults(results);
          }
        } catch (error) {
          this.logger.error(`Evaluator failed:`, error);
        }
      }

      const aggregatedResults = this.aggregateResults(allResults);

      this.logger.info("Evaluation completed", {
        duration: Date.now() - startTime,
        totalMetrics: aggregatedResults.length,
      });

      return aggregatedResults;
    } catch (error) {
      this.logger.error("Evaluation failed:", error);
      throw error;
    }
  }

  private async visualizeResults(results: EvalResult[]) {
    if (!this.vizServer) return;

    const nodes: GraphNode[] = results.map((result) => ({
      id: `metric-${result.metricName}`,
      type: 'metric',
      label: result.metricName,
      data: {
        score: result.score,
        metadata: result.metadata,
      },
      status:
        result.score >= (this.config.threshold || 0.7) ? "completed" : "warning",
    }));

    this.vizServer.updateGraph({ nodes, edges: [] });
  }

  private aggregateResults(results: EvalResult[]): EvalResult[] {
    const { aggregation = "mean" } = this.config;

    if (aggregation === "weighted") {
      return results.map((result) => {
        const weight =
          this.config.metrics.find((m) => m.name === result.metricName)
            ?.weight || 1;
        return {
          ...result,
          score: result.score * weight,
        };
      });
    }

    return results;
  }

  async cleanup() {
    if (this.vizServer) {
      await this.vizServer.close();
    }
  }
}
