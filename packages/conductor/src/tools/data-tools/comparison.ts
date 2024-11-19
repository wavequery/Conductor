// import { BaseTool } from "../base-tool";
// import { ToolContext, ToolResult } from "@/types/interfaces/tool";
// import { z } from "zod";

// interface ComparisonMetrics {
//   [key: string]: {
//     dataset1: number;
//     dataset2: number;
//     difference: number;
//     percentChange: number;
//   };
// }

// const comparisonInputSchema = z.object({
//   dataset1: z.array(z.record(z.any())),
//   dataset2: z.array(z.record(z.any())),
//   keys: z.array(z.string()),
//   metrics: z.array(z.string()),
// });

// export class DataComparisonTool extends BaseTool {
//   async execute(
//     input: z.infer<typeof comparisonInputSchema>,
//     context?: ToolContext
//   ): Promise<ToolResult> {
//     const startTime = Date.now();

//     try {
//       const { dataset1, dataset2, keys, metrics } = input;

//       const comparison = this.compareDatasets(
//         dataset1,
//         dataset2,
//         keys,
//         metrics
//       );

//       return {
//         success: true,
//         data: comparison,
//         metrics: {
//           duration: Date.now() - startTime,
//           dataset1Size: dataset1.length,
//           dataset2Size: dataset2.length,
//         },
//       };
//     } catch (error) {
//       return {
//         success: false,
//         data: null,
//         error,
//         metrics: {
//           duration: Date.now() - startTime,
//         },
//       };
//     }
//   }

//   protected compareDatasets(
//     dataset1: any[],
//     dataset2: any[],
//     metrics: string[]
//   ): Record<string, ComparisonMetrics> {
//     const results: Record<string, ComparisonMetrics> = {};

//     metrics.forEach((metric) => {
//       results[metric] = {
//         dataset1: this.calculateMetric(dataset1, metric),
//         dataset2: this.calculateMetric(dataset2, metric),
//         difference: 0,
//         percentChange: 0,
//       };

//       results[metric].difference =
//         results[metric].dataset2 - results[metric].dataset1;
//       results[metric].percentChange =
//         ((results[metric].dataset2 - results[metric].dataset1) /
//           results[metric].dataset1) *
//         100;
//     });

//     return results;
//   }

//   private calculateMetric(data: any[], metric: string): number {
//     switch (metric) {
//       case "count":
//         return data.length;
//       case "sum":
//         return data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
//       case "average":
//         const sum = data.reduce(
//           (acc, item) => acc + (Number(item.value) || 0),
//           0
//         );
//         return sum / data.length;
//       default:
//         return 0;
//     }
//   }

//   private createKeyMap(dataset: any[], keys: string[]): Record<string, any> {
//     return dataset.reduce((acc, item) => {
//       const key = keys.map((k) => item[k]).join("|");
//       acc[key] = item;
//       return acc;
//     }, {});
//   }
// }
