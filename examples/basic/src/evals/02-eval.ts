import {
  BaseEvaluator,
  EvalResult,
  EvalConfig,
  Chain,
  Logger,
  LogLevel,
  ChainConfig,
  EvalReporter,
  ReportOptions,
  ConfigurationManager,
} from "@wavequery/conductor";
import { promises as fs } from "fs";
import {
  CodeAnalyzerTool,
  SecurityScannerTool,
  DocumentationGeneratorTool,
} from "../02-code-review-chain";

import dotenv from "dotenv";

dotenv.configDotenv();

ConfigurationManager.getInstance().setConfig({
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
});

async function evaluateCodeReview(
  chainResult: any,
  expected: any
): Promise<EvalResult[]> {
  const results: EvalResult[] = [];
  const analysisStep = chainResult.steps.find((s) => s.name === "analysis");
  const securityStep = chainResult.steps.find(
    (s) => s.name === "security-review"
  );

  const complexityDiff = Math.abs(
    analysisStep.output.data.complexity.score - expected.complexity.score
  );
  results.push({
    metricName: "complexityAccuracy",
    score: 1 - complexityDiff / 10,
    metadata: {
      expected: expected.complexity.score,
      actual: analysisStep.output.data.complexity.score,
    },
    timestamp: new Date(),
  });

  const securityIssuesFound = securityStep.output.data.vulnerabilities.map(
    (v) => v.type.toLowerCase()
  );
  const expectedIssues = expected.security.issues.map((i) => i.toLowerCase());
  const securityOverlap = securityIssuesFound.filter((i) =>
    expectedIssues.includes(i)
  ).length;

  results.push({
    metricName: "securityDetection",
    score: securityOverlap / expectedIssues.length,
    metadata: {
      found: securityOverlap,
      expected: expectedIssues.length,
    },
    timestamp: new Date(),
  });

  const practicesFound = analysisStep.output.data.bestPractices.followed.map(
    (p) => p.toLowerCase()
  );
  const expectedPractices = expected.bestPractices.followed.map((p) =>
    p.toLowerCase()
  );
  const practicesOverlap = practicesFound.filter((p) =>
    expectedPractices.includes(p)
  ).length;

  results.push({
    metricName: "bestPractices",
    score: practicesOverlap / expectedPractices.length,
    metadata: {
      found: practicesOverlap,
      expected: expectedPractices.length,
    },
    timestamp: new Date(),
  });

  // results.push({
  //   metricName: "executionTime",
  //   score:
  //     chainResult.metrics.duration < 10000
  //       ? 1
  //       : chainResult.metrics.duration < 15000
  //         ? 0.5
  //         : 0,
  //   metadata: { duration: chainResult.metrics.duration },
  //   timestamp: new Date(),
  // });

  return results;
}

export async function runCodeReviewEval() {
  const logger = new Logger({
    level: LogLevel.DEBUG,
    prefix: "CodeReviewEval",
  });

  const testCases = [
    {
      input: `
        function processUserData(userData) {
          const sql = 'SELECT * FROM users WHERE id = ' + userData.id;
          db.query(sql, (err, result) => {
            if (err) throw err;
            return result;
          });
        }
      `,
      expected: {
        complexity: {
          score: 3,
          details: [
            "SQL injection vulnerability",
            "Simple error handling",
            "Callback usage",
          ],
        },
        security: {
          issues: ["SQL injection", "Unsafe error handling"],
          severity: "high",
        },
        performance: [
          "Direct string concatenation",
          "Synchronous error throwing",
        ],
        bestPractices: {
          followed: ["Function naming", "Parameter naming"],
          violations: [
            "SQL injection prevention",
            "Proper error handling",
            "Async/await usage",
          ],
        },
      },
    },
  ];

  const reporter = new EvalReporter();
  const allResults: EvalResult[] = [];

  const analyzer = new CodeAnalyzerTool();
  const security = new SecurityScannerTool();
  const documentation = new DocumentationGeneratorTool();

  const chainConfig: ChainConfig = {
    name: "code-review-eval",
    tools: [analyzer, security, documentation],
    maxIterations: 1,
    steps: [
      {
        name: "analysis",
        tool: "code-analyzer",
        input: { extractCode: true },
      },
      {
        name: "security-review",
        tool: "security-scanner",
        input: { includeContext: true },
      },
      {
        name: "generate-docs",
        tool: "documentation-generator",
        input: { includeSecurity: true },
      },
    ],
  };

  const chain = new Chain(chainConfig);

  for (const testCase of testCases) {
    logger.info("Evaluating code sample");

    try {
      const result = await chain.runAgentLoop({
        code: testCase.input,
        context: {
          language: "javascript",
          environment: "node.js",
        },
      });
      logger.info("Chain result:", result);

      const evalResults = await evaluateCodeReview(result, testCase.expected);
      logger.info("Evaluation results:", evalResults);

      // Calculate overall score
      const avgScore =
        evalResults.reduce((sum, r) => sum + r.score, 0) / evalResults.length;
      logger.info(`Overall score: ${(avgScore * 100).toFixed(2)}%`);

      // Log specific metrics
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
    await fs.writeFile("02-eval-report.json", jsonReport, "utf8");
    logger.info("Report saved to eval-report.json");
  } catch (error) {
    logger.error("Failed to save report:", error);
  }
}

runCodeReviewEval().catch(console.error);
