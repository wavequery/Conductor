// import {
//   BaseEvaluator,
//   EvalResult,
//   EvalConfig,
//   Chain,
//   Logger,
//   LogLevel,
//   ChainConfig,
// } from "@wavequery/conductor";

// import {
//   ContentGeneratorTool,
//   SEOOptimizerTool,
//   ContentEditorTool,
// } from "../03-content-creator-chain-functions";

// export async function runContentCreationEval() {
//   const logger = new Logger({
//     level: LogLevel.DEBUG,
//     prefix: "ContentCreationEval",
//   });

//   const testCases = [
//     {
//       input: {
//         topic: "The Future of AI in Software Development",
//         outline: [
//           "Introduction to AI in Development",
//           "Current AI Development Tools",
//           "Impact on Developer Productivity",
//           "Challenges and Limitations",
//           "Future Predictions",
//           "Conclusion",
//         ],
//       },
//       expected: {
//         structure: ["title", "introduction", "sections", "conclusion"],
//         keywords: [
//           "AI",
//           "software development",
//           "automation",
//           "machine learning",
//         ],
//         minSections: 6,
//         minWordsPerSection: 200,
//         readabilityScore: 80,
//         seoScore: 85,
//       },
//     },
//   ];

//   const contentGenerator = new ContentGeneratorTool();
//   const seoOptimizer = new SEOOptimizerTool();
//   const contentEditor = new ContentEditorTool();

//   const chainConfig: ChainConfig = {
//     name: "content-creation-eval",
//     tools: [contentGenerator, seoOptimizer, contentEditor],
//     maxIterations: 1,
//     steps: [
//       {
//         name: "generate",
//         tool: "content-generator",
//         input: {
//           style: "professional",
//           targetAudience: "tech professionals",
//         },
//       },
//       {
//         name: "optimize",
//         tool: "seo-optimizer",
//         input: {
//           keywords: ["AI", "software development", "automation"],
//         },
//       },
//       {
//         name: "edit",
//         tool: "content-editor",
//         input: {
//           style: "technical but accessible",
//         },
//       },
//     ],
//   };

//   const chain = new Chain(chainConfig);

//   for (const testCase of testCases) {
//     logger.info(
//       `Evaluating content creation for topic: "${testCase.input.topic}"`
//     );

//     try {
//       const result = await chain.runAgentLoop(testCase.input);
//       const evalResults = await evaluateContentCreation(
//         result,
//         testCase.expected
//       );
//       logger.info("Evaluation results:", evalResults);

//       // Calculate overall score
//       const avgScore =
//         evalResults.reduce((sum, r) => sum + r.score, 0) / evalResults.length;
//       logger.info(`Overall score: ${(avgScore * 100).toFixed(2)}%`);

//       // Log specific metrics
//       evalResults.forEach((result) => {
//         logger.info(
//           `${result.metricName}: ${(result.score * 100).toFixed(2)}%`
//         );
//       });
//     } catch (error) {
//       logger.error(`Evaluation failed for test case:`, error);
//     }
//   }
// }

// async function evaluateContentCreation(
//   chainResult: any,
//   expected: any
// ): Promise<EvalResult[]> {
//   const results: EvalResult[] = [];
//   const generatedContent = chainResult.steps.find((s) => s.name === "generate")
//     .output.data;
//   const seoResults = chainResult.steps.find((s) => s.name === "optimize").output
//     .data;
//   const editedContent = chainResult.steps.find((s) => s.name === "edit").output
//     .data;

//   // Structure Completeness
//   const structureScore =
//     expected.structure.filter((section) => editedContent[section]).length /
//     expected.structure.length;

//   results.push({
//     metricName: "structureCompleteness",
//     score: structureScore,
//     metadata: {
//       present: expected.structure.filter((s) => editedContent[s]),
//       missing: expected.structure.filter((s) => !editedContent[s]),
//     },
//     timestamp: new Date(),
//   });

//   // Content Length
//   const sections = editedContent.sections || [];
//   const sectionsWithMinLength = sections.filter(
//     (s) => s.content.split(" ").length >= expected.minWordsPerSection
//   ).length;

//   results.push({
//     metricName: "contentLength",
//     score: sectionsWithMinLength / expected.minSections,
//     metadata: {
//       sectionsWithMinLength,
//       totalSections: sections.length,
//     },
//     timestamp: new Date(),
//   });

//   // Keyword Usage
//   const allContent = [
//     editedContent.title,
//     editedContent.introduction,
//     ...sections.map((s) => s.content),
//     editedContent.conclusion,
//   ]
//     .join(" ")
//     .toLowerCase();

//   const keywordPresence = expected.keywords.map((keyword) => ({
//     keyword,
//     present: allContent.includes(keyword.toLowerCase()),
//   }));

//   results.push({
//     metricName: "keywordUsage",
//     score:
//       keywordPresence.filter((k) => k.present).length /
//       expected.keywords.length,
//     metadata: { keywordPresence },
//     timestamp: new Date(),
//   });

//   // SEO Score
//   results.push({
//     metricName: "seoOptimization",
//     score: Math.min(1, seoResults.seoScore / expected.seoScore),
//     metadata: {
//       actual: seoResults.seoScore,
//       expected: expected.seoScore,
//     },
//     timestamp: new Date(),
//   });

//   // Readability Score
//   results.push({
//     metricName: "readability",
//     score: Math.min(
//       1,
//       editedContent.readabilityScore / expected.readabilityScore
//     ),
//     metadata: {
//       actual: editedContent.readabilityScore,
//       expected: expected.readabilityScore,
//     },
//     timestamp: new Date(),
//   });

//   // Chain Performance
//   results.push({
//     metricName: "executionTime",
//     score:
//       chainResult.metrics.duration < 15000
//         ? 1
//         : chainResult.metrics.duration < 30000
//           ? 0.5
//           : 0,
//     metadata: { duration: chainResult.metrics.duration },
//     timestamp: new Date(),
//   });

//   return results;
// }

// // Run evaluation if this is the main module
// if (require.main === module) {
//   runContentCreationEval().catch(console.error);
// }
