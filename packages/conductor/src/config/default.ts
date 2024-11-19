import { Config } from './types';

export const defaultConfig: Partial<Config> = {
  openai: {
    model: 'gpt-4o-mini',
  },
  server: {
    port: 3000,
    host: 'localhost',
  },
  logging: {
    level: 'info',
  },
};