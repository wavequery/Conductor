import { z } from 'zod';

export const evalMetricSchema = z.object({
  name: z.string(),
  weight: z.number().min(0).max(1),
  threshold: z.number().optional(),
  compareFunction: z.enum([
    'EXACT_MATCH',
    'FUZZY_MATCH',
    'NUMERIC_DIFFERENCE',
    'SEMANTIC_SIMILARITY',
    'CUSTOM'
  ]),
  options: z.record(z.any()).optional()
});

export const evalConfigSchema = z.object({
  name: z.string(),
  description: z.string().optional(), 
  testSuite: z.object({
    parallel: z.boolean().optional(),
    timeout: z.number().optional(),
    retries: z.number().optional(),
    stopOnFailure: z.boolean().optional()
  }),
  metrics: z.array(evalMetricSchema),
  reporting: z.object({
    format: z.enum(['JSON', 'HTML', 'MARKDOWN', 'CSV']),
    destination: z.enum(['FILE', 'CONSOLE', 'API']).optional(),
    includeMetadata: z.boolean().optional(),
    detailed: z.boolean().optional()
  }).optional(),
  
  environment: z.object({
    variables: z.record(z.string()).optional(),
    setup: z.array(z.string()).optional(),
    teardown: z.array(z.string()).optional()
  }).optional(),
  
  hooks: z.object({
    beforeAll: z.string().optional(),
    afterAll: z.string().optional(),
    beforeEach: z.string().optional(),
    afterEach: z.string().optional()
  }).optional()
});

export type EvalConfig = z.infer<typeof evalConfigSchema>;
export type EvalMetricConfig = z.infer<typeof evalMetricSchema>;