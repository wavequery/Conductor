import { z } from "zod";
import { ToolType, ToolExecutionMode } from "@/types/enums/tool-type";

export const toolConfigSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(ToolType),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string(),
  author: z.string().optional(),
  executionMode: z.nativeEnum(ToolExecutionMode),

  authentication: z
    .object({
      required: z.boolean(),
      type: z.enum(["API_KEY", "OAUTH", "BASIC", "NONE"]).optional(),
      scopes: z.array(z.string()).optional(),
    })
    .optional(),

  input: z.object({
    schema: z.any(), // Actual JSON schema
    required: z.array(z.string()),
    examples: z.array(z.any()).optional(),
  }),

  output: z.object({
    schema: z.any(), // Actual JSON schema
    examples: z.array(z.any()).optional(),
  }),

  options: z.record(z.any()).optional(),

  dependencies: z
    .array(
      z.object({
        name: z.string(),
        version: z.string(),
        optional: z.boolean().optional(),
      })
    )
    .optional(),

  limits: z
    .object({
      maxExecutionTime: z.number().optional(),
      maxRetries: z.number().optional(),
      concurrency: z.number().optional(),
    })
    .optional(),

  metadata: z.record(z.any()).optional(),
});

export type ToolConfig = z.infer<typeof toolConfigSchema>;
