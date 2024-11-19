// import { BaseTool } from "../base-tool";
// import { ToolContext, ToolResult } from "@/types/interfaces/tool";
// import { z } from "zod";

// const visualizationInputSchema = z.object({
//   data: z.array(z.record(z.any())),
//   type: z.enum(["bar", "line", "pie", "scatter", "heatmap", "table"]),
//   options: z.object({
//     x: z.string(),
//     y: z.union([z.string(), z.array(z.string())]),
//     groupBy: z.string().optional(),
//     title: z.string().optional(),
//     aggregate: z.enum(["sum", "average", "count", "min", "max"]).optional(),
//     colorScheme: z.string().optional(),
//     dimensions: z
//       .object({
//         width: z.number(),
//         height: z.number(),
//       })
//       .optional(),
//     labels: z
//       .object({
//         x: z.string().optional(),
//         y: z.string().optional(),
//         title: z.string().optional(),
//       })
//       .optional(),
//   }),
// });

// export type VisualizationInput = z.infer<typeof visualizationInputSchema>;

// export class DataVisualizationTool extends BaseTool {
//   async execute(
//     input: VisualizationInput,
//     context?: ToolContext
//   ): Promise<ToolResult> {
//     const startTime = Date.now();

//     try {
//       const { data, type, options } = input;
//       let processedData = this.preprocessData(data, options);

//       const visualization = await this.createVisualization(
//         processedData,
//         type,
//         options
//       );

//       return {
//         success: true,
//         data: visualization,
//         metrics: {
//           duration: Date.now() - startTime,
//           dataPoints: data.length,
//           visualizationType: type,
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

//   private preprocessData(data: any[], options: VisualizationInput["options"]) {
//     let processed = [...data];

//     // Handle aggregation if specified
//     if (options.aggregate && options.groupBy) {
//       processed = this.aggregateData(
//         processed,
//         options.groupBy,
//         options.y as string,
//         options.aggregate
//       );
//     }

//     // Sort data if it's a time series
//     if (this.isTimeField(options.x)) {
//       processed.sort(
//         (a, b) =>
//           new Date(a[options.x]).getTime() - new Date(b[options.x]).getTime()
//       );
//     }

//     return processed;
//   }

//   private aggregateData(
//     data: any[],
//     groupBy: string,
//     metric: string,
//     aggregationType: string
//   ): any[] {
//     const groups = data.reduce((acc, item) => {
//       const key = item[groupBy];
//       if (!acc[key]) acc[key] = [];
//       acc[key].push(item);
//       return acc;
//     }, {});

//     return Object.entries(groups).map(([key, items]: [string, any[]]) => {
//       const value = this.calculateAggregate(items, metric, aggregationType);
//       return {
//         [groupBy]: key,
//         [metric]: value,
//       };
//     });
//   }

//   private calculateAggregate(
//     items: any[],
//     field: string,
//     type: string
//   ): number {
//     const values = items
//       .map((item) => Number(item[field]))
//       .filter((n) => !isNaN(n));

//     switch (type) {
//       case "sum":
//         return values.reduce((a, b) => a + b, 0);
//       case "average":
//         return values.reduce((a, b) => a + b, 0) / values.length;
//       case "count":
//         return values.length;
//       case "min":
//         return Math.min(...values);
//       case "max":
//         return Math.max(...values);
//       default:
//         throw new Error(`Unsupported aggregate type: ${type}`);
//     }
//   }

//   private async createVisualization(
//     data: any[],
//     type: VisualizationInput["type"],
//     options: VisualizationInput["options"]
//   ) {
//     // Create visualization specification (Vega-Lite compatible)
//     const spec = {
//       $schema: "https://vega.github.io/schema/vega-lite/v5.json",
//       data: { values: data },
//       mark: this.getMarkType(type),
//       encoding: this.getEncoding(type, options),
//       width: options.dimensions?.width || 600,
//       height: options.dimensions?.height || 400,
//       title: options.title,
//       config: {
//         style: { cell: { stroke: "transparent" } },
//         ...(options.colorScheme
//           ? { range: { scheme: options.colorScheme } }
//           : {}),
//       },
//     };

//     return spec;
//   }

//   private getMarkType(type: VisualizationInput["type"]): string {
//     const markMap: Record<VisualizationInput["type"], string> = {
//       bar: "bar",
//       line: "line",
//       pie: "arc",
//       scatter: "point",
//       heatmap: "rect",
//       table: "text",
//     };
//     return markMap[type];
//   }

//   private getEncoding(
//     type: VisualizationInput["type"],
//     options: VisualizationInput["options"]
//   ) {
//     const baseEncoding = {
//       x: {
//         field: options.x,
//         type: this.inferDataType(options.x),
//         title: options.labels?.x || options.x,
//       },
//       y: {
//         field: Array.isArray(options.y) ? options.y[0] : options.y,
//         type: "quantitative",
//         title: options.labels?.y || options.y,
//       },
//     };

//     // Add specific encodings based on chart type
//     switch (type) {
//       case "pie":
//         return {
//           theta: baseEncoding.y,
//           color: baseEncoding.x,
//         };
//       case "heatmap":
//         return {
//           ...baseEncoding,
//           color: { field: options.y as string, type: "quantitative" },
//         };
//       default:
//         return {
//           ...baseEncoding,
//           ...(options.groupBy
//             ? {
//                 color: { field: options.groupBy, type: "nominal" },
//               }
//             : {}),
//         };
//     }
//   }

//   private inferDataType(field: string): string {
//     if (this.isTimeField(field)) return "temporal";
//     // Add more type inference logic as needed
//     return "nominal";
//   }

//   private isTimeField(field: string): boolean {
//     const timeFields = ["date", "time", "timestamp", "datetime"];
//     return timeFields.some((tf) => field.toLowerCase().includes(tf));
//   }
// }
