
import { Config, configSchema } from "./types";
import { defaultConfig } from "./default";
import dotenv from "dotenv";

export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: Config;

  private constructor() {
    dotenv.config();
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  private loadConfig(): Config {
    const config = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY!,
        model: process.env.OPENAI_MODEL || defaultConfig.openai?.model,
        organization: process.env.OPENAI_ORG,
      },
      server: {
        port: parseInt(
          process.env.SERVER_PORT || String(defaultConfig.server?.port),
          10
        ),
        host: process.env.SERVER_HOST || defaultConfig.server?.host,
      },
      logging: {
        level: (process.env.LOG_LEVEL ||
          defaultConfig.logging?.level) as Config["logging"]["level"],
      },
    };

    try {
      return configSchema.parse(config);
    } catch (error) {
      console.error("Invalid configuration:", error);
      process.exit(1);
    }
  }

  getConfig(): Config {
    return this.config;
  }

  // Allow overriding config for testing
  setConfig(config: Partial<Config>) {
    this.config = {
      ...this.config,
      ...config,
    };
    return configSchema.parse(this.config);
  }
}

// Export a default instance
export const config = ConfigurationManager.getInstance().getConfig();

// Export types
export type { Config } from "./types";
