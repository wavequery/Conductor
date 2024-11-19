import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  ToolValidation,
  ValidationResult,
  ValidationError,
} from "@/types/interfaces/tool";

export interface ValidationOptions {
  strict?: boolean;
  stripUnknown?: boolean;
}

export class ToolValidator implements ToolValidation {
  private inputSchema: z.ZodSchema;
  private outputSchema: z.ZodSchema;

  constructor(inputSchema: z.ZodSchema, outputSchema: z.ZodSchema) {
    this.inputSchema = inputSchema;
    this.outputSchema = outputSchema;
  }

  async validateInput<T = any>(input: unknown): Promise<ValidationResult<T>> {
    try {
      const data = (await this.inputSchema.parseAsync(input)) as T;
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: this.formatZodErrors(error),
        };
      }
      throw error;
    }
  }

  async validateOutput<T = any>(output: unknown): Promise<ValidationResult<T>> {
    try {
      const data = (await this.outputSchema.parseAsync(output)) as T;
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: this.formatZodErrors(error),
        };
      }
      throw error;
    }
  }

  private formatZodErrors(error: z.ZodError): ValidationError[] {
    return error.errors.map((err) => ({
      path: err.path.map((p) => p.toString()),
      message: err.message,
    }));
  }

  getInputSchema(): Record<string, any> {
    return this.schemaToJSON(this.inputSchema);
  }

  getOutputSchema(): Record<string, any> {
    return this.schemaToJSON(this.outputSchema);
  }

  private schemaToJSON(schema: z.ZodSchema): Record<string, any> {
    return zodToJsonSchema(schema, {
      $refStrategy: "none",
      definitionPath: "definitions",
    });
  }

  // private zodTypeToJSON(type: z.ZodTypeAny): any {
  //   if (type instanceof z.ZodString) return { type: 'string' };
  //   if (type instanceof z.ZodNumber) return { type: 'number' };
  //   if (type instanceof z.ZodBoolean) return { type: 'boolean' };
  //   if (type instanceof z.ZodArray) return {
  //     type: 'array',
  //     items: this.zodTypeToJSON(type.element)
  //   };
  //   if (type instanceof z.ZodObject) return {
  //     type: 'object',
  //     properties: this.schemaToJSON(type)
  //   };
  //   return { type: 'any' };
  // }
}

// Example schema builders for common tool patterns
// export const schemaBuilders = {
//   /**
//    * Creates a schema for paginated inputs
//    */
//   withPagination: <T extends z.ZodSchema>(schema: T) => {
//     return schema.extend({
//       page: z.number().int().min(1).optional().default(1),
//       limit: z.number().int().min(1).max(100).optional().default(10)
//     });
//   },

//   /**
//    * Creates a schema for filterable inputs
//    */
//   withFilters: <T extends z.ZodSchema>(schema: T, filterSchema: z.ZodSchema) => {
//     return schema.extend({
//       filters: z.array(filterSchema).optional()
//     });
//   },

//   /**
//    * Creates a schema for sortable inputs
//    */
//   withSorting: <T extends z.ZodSchema>(schema: T, sortableFields: string[]) => {
//     return schema.extend({
//       sortBy: z.enum(sortableFields as [string, ...string[]]).optional(),
//       sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
//     });
//   }
// };

// Helper function to create tool validator
// export function createToolValidator<
//   Input = any,
//   Output = any
// >(config: {
//   input: z.ZodSchema<Input>;
//   output: z.ZodSchema<Output>;
// }): ToolValidator {
//   return new ToolValidator(
//     config.input,
//     config.output
//   );
// }
