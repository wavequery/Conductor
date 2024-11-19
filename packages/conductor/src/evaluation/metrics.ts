import { SQLTestCase } from "@/types/interfaces/evaluation";

export interface MetricResult {
  value: number;
  details?: Record<string, any>;
}

export interface SQLMetric {
  name: string;
  description: string;
  compute(generated: SQLTestCase, expected: SQLTestCase): MetricResult;
}

export class SQLMetrics {
  static readonly QUERY_SIMILARITY: SQLMetric = {
    name: "query_similarity",
    description:
      "Measures similarity between generated and expected SQL queries",
    compute(generated, expected) {
      // Normalize and compare queries
      const normalizedGenerated = this.normalizeQuery(generated.query);
      const normalizedExpected = this.normalizeQuery(expected.query);

      return {
        value: this.calculateSimilarity(
          normalizedGenerated,
          normalizedExpected
        ),
        details: {
          normalized: {
            generated: normalizedGenerated,
            expected: normalizedExpected,
          },
        },
      };
    },
  };

  static readonly RESULT_ACCURACY: SQLMetric = {
    name: "result_accuracy",
    description: "Compares query results with expected results",
    compute(generated, expected) {
      return {
        value: this.compareResults(generated.results, expected.results),
        details: {
          differences: this.getResultDifferences(
            generated.results,
            expected.results
          ),
        },
      };
    },
  };

  private static normalizeQuery(query: string): string {
    // Remove whitespace, standardize syntax, etc.
    return query.toLowerCase().replace(/\s+/g, " ").trim();
  }

  private static calculateSimilarity(query1: string, query2: string): number {
    // Implement similarity calculation (e.g., Levenshtein distance)
    // Return value between 0 and 1
    return 0;
  }

  private static compareResults(results1: any[], results2: any[]): number {
    // Implement result comparison logic
    return 0;
  }

  private static getResultDifferences(results1: any[], results2: any[]): any[] {
    // Return detailed differences between results
    return [];
  }
}
