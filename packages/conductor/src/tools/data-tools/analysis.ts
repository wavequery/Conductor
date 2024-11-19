// import { BaseTool } from "../base-tool";
// import { ToolContext, ToolResult } from "@/types/interfaces/tool";
// import { z } from "zod";


// export interface AnalysisMetrics {
//   count?: number;
//   sum?: number;
//   average?: number;
//   [key: string]: number | undefined;
// }

// export interface GroupedMetrics {
//   [key: string]: AnalysisMetrics;
// }

// const analysisInputSchema = z.object({
//   data: z.array(z.record(z.any())),
//   metrics: z.array(z.string()),
//   groupBy: z.string().optional(),
//   filters: z
//     .array(
//       z.object({
//         field: z.string(),
//         operator: z.string(),
//         value: z.any(),
//       })
//     )
//     .optional(),
// });

// export class DataAnalysisTool extends BaseTool {
//   async execute(
//     input: z.infer<typeof analysisInputSchema>,
//     context?: ToolContext
//   ): Promise<ToolResult> {
//     const startTime = Date.now();

//     try {
//       const { data, metrics, groupBy, filters } = input;
//       let processedData = data;

//       // Apply filters if any
//       if (filters?.length) {
//         processedData = this.applyFilters(processedData, filters);
//       }

//       // Calculate metrics
//       const results = groupBy
//         ? this.calculateGroupedMetrics(processedData, metrics, groupBy)
//         : this.calculateMetrics(processedData, metrics);

//       return {
//         success: true,
//         data: results,
//         metrics: {
//           duration: Date.now() - startTime,
//           recordsProcessed: data.length,
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

//   private applyFilters(data: any[], filters: any[]): any[] {
//     return data.filter((item) =>
//       filters.every((filter) => {
//         switch (filter.operator) {
//           case "eq":
//             return item[filter.field] === filter.value;
//           case "gt":
//             return item[filter.field] > filter.value;
//           case "lt":
//             return item[filter.field] < filter.value;
//           // Add more operators as needed
//           default:
//             return true;
//         }
//       })
//     );
//   }

//   protected calculateMetrics(data: any[], metrics: string[]): AnalysisMetrics {
//     return metrics.reduce<AnalysisMetrics>((acc, metric) => {
//       switch (metric) {
//         case 'count':
//           acc.count = data.length;
//           break;
//         case 'sum':
//           acc.sum = data.reduce((sum, item) => 
//             sum + (parseFloat(item.value) || 0), 0);
//           break;
//         // Add other metrics as needed
//       }
//       return acc;
//     }, {});
//   }

//   protected calculateGroupedMetrics(
//     data: any[], 
//     metrics: string[], 
//     groupBy: string
//   ): GroupedMetrics {
//     const groups = this.groupData(data, groupBy);
//     const result: GroupedMetrics = {};
    
//     for (const [key, groupData] of Object.entries(groups)) {
//       result[key] = this.calculateMetrics(groupData, metrics);
//     }
    
//     return result;
//   }

//   private groupData(data: any[], groupBy: string): Record<string, any[]> {
//     return data.reduce<Record<string, any[]>>((acc, item) => {
//       const key = String(item[groupBy] ?? 'unknown');
//       if (!acc[key]) acc[key] = [];
//       acc[key].push(item);
//       return acc;
//     }, {});
//   }
// }
