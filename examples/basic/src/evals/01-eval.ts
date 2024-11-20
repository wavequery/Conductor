import {
  ToolResult,
  Logger,
  LogLevel,
  BaseEvaluator,
  EvalResult,
  EvalConfig,
  ConfigurationManager,
  EvalReporter,
  ReportOptions,
} from "@wavequery/conductor";
import {promises as fs} from "fs";

import { TextAnalysisTool } from "../01-text-analysis-agent-visulaization";

import dotenv from "dotenv";

dotenv.configDotenv();

ConfigurationManager.getInstance().setConfig({
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
});

async function evaluateTextAnalysis(
  result: ToolResult,
  expected: any
): Promise<EvalResult[]> {
  const results: EvalResult[] = [];
  const data = result.data as any;

  // Sentiment Accuracy
  results.push({
    metricName: "sentimentAccuracy",
    score: data.sentiment === expected.sentiment ? 1 : 0,
    metadata: { expected: expected.sentiment, actual: data.sentiment },
    timestamp: new Date(),
  });

  // Concepts Coverage
  const conceptOverlap = data.concepts.filter((c) =>
    expected.concepts.some((ec) => ec.toLowerCase() === c.toLowerCase())
  ).length;
  results.push({
    metricName: "conceptsCoverage",
    score: conceptOverlap / expected.concepts.length,
    metadata: { found: conceptOverlap, expected: expected.concepts.length },
    timestamp: new Date(),
  });

  // Entity Recognition
  const entityOverlap = data.entities.filter((e) =>
    expected.entities.some((ee) => ee.toLowerCase() === e.toLowerCase())
  ).length;
  results.push({
    metricName: "entityRecognition",
    score: entityOverlap / expected.entities.length,
    metadata: { found: entityOverlap, expected: expected.entities.length },
    timestamp: new Date(),
  });

  // Emotional Tone Accuracy
  results.push({
    metricName: "emotionalToneAccuracy",
    score: data.emotionalTone === expected.emotionalTone ? 1 : 0,
    metadata: { expected: expected.emotionalTone, actual: data.emotionalTone },
    timestamp: new Date(),
  });

  // Performance
  results.push({
    metricName: "responseTime",
    score:
      result.metrics.duration < 3000
        ? 1
        : result.metrics.duration < 5000
          ? 0.5
          : 0,
    metadata: { duration: result.metrics.duration },
    timestamp: new Date(),
  });

  // Confidence Score
  if (data.confidence && expected.confidence) {
    results.push({
      metricName: "confidenceAccuracy",
      score: Math.max(0, 1 - Math.abs(data.confidence - expected.confidence)),
      metadata: { expected: expected.confidence, actual: data.confidence },
      timestamp: new Date(),
    });
  }

  return results;
}

export async function runTextAnalysisEval() {
  const logger = new Logger({
    level: LogLevel.DEBUG,
    prefix: "TextAnalysisEval",
  });

  const testCases = [
    {
      input:
        "I absolutely love how this new AI technology is transforming our work! The possibilities seem endless.",
      expected: {
        sentiment: "positive",
        concepts: [
          "AI",
          "technology",
          "transformation",
          "work",
          "possibilities",
        ],
        summary:
          "Enthusiastic expression about AI technology's impact on work.",
        entities: ["AI technology"],
        emotionalTone: "excited",
        confidence: 0.9,
      },
    },
    {
      input:
        "The customer service was disappointing. Long wait times and unresolved issues left me frustrated.",
      expected: {
        sentiment: "negative",
        concepts: ["customer service", "wait times", "issues", "frustration"],
        summary:
          "Negative experience with customer service due to delays and unresolved problems.",
        entities: ["customer service"],
        emotionalTone: "frustrated",
        confidence: 0.85,
      },
    },
  ];

  const reporter = new EvalReporter();
  const allResults: EvalResult[] = [];

  const analysisTool = new TextAnalysisTool();

  for (const testCase of testCases) {
    logger.info(`Evaluating text: "${testCase.input}"`);

    try {
      const result = await analysisTool.execute({
        text: testCase.input,
      });

      const evalResults = await evaluateTextAnalysis(result, testCase.expected);

      logger.info("Evaluation results:", evalResults);

      // Calculate overall score
      const avgScore =
        evalResults.reduce((sum, r) => sum + r.score, 0) / evalResults.length;
      logger.info(`Overall score: ${(avgScore * 100).toFixed(2)}%`);

      evalResults.forEach((result) => {
        logger.info(
          `${result.metricName}: ${(result.score * 100).toFixed(2)}%`
        );
      });

      allResults.push(...evalResults);
    } catch (error) {
      logger.error(`Evaluation failed for test case:`, error);
    }
  }

  const jsonReport = reporter.exportToJSON(allResults);
  logger.info("Final JSON Report:", jsonReport);

  try {
    await fs.writeFile('01-eval-report.json', jsonReport, 'utf8');
    logger.info("Report saved to eval-report.json");
  } catch (error) {
    logger.error("Failed to save report:", error);
  }
}

runTextAnalysisEval().catch(console.error);
