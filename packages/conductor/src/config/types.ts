import { z } from 'zod';
import {LLMChatModel} from '@/types/interfaces/llm';

export const configSchema = z.object({
  openai: z.object({
    apiKey: z.string().min(1),
    model: z.string().optional(),
    organization: z.string().optional(),
  }),
  server: z.object({
    port: z.number().default(3000),
    host: z.string().default('localhost'),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),
});

export type Config = z.infer<typeof configSchema>;