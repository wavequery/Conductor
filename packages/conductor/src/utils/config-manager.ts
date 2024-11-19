import { z } from "zod";

export interface ConfigOptions {
  schema?: z.ZodSchema;
  defaultValues?: Record<string, any>;
  onUpdate?: (config: Record<string, any>) => void;
  persist?: boolean;
  storage?: Storage;
}

export class ConfigManager {
  private config: Record<string, any>;
  private options: Required<ConfigOptions>;
  private static instance: ConfigManager;

  constructor(options: ConfigOptions = {}) {
    this.options = {
      schema: z.record(z.any()),
      defaultValues: {},
      onUpdate: () => {},
      persist: false,
      storage:
        typeof localStorage !== "undefined" ? localStorage : (null as any),
      ...options,
    };

    this.config = this.loadConfig();
  }

  static getInstance(options?: ConfigOptions): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(options);
    }
    return ConfigManager.instance;
  }

  get<T = any>(key: string): T {
    return this.config[key];
  }

  set(key: string, value: any): void {
    const updates = { [key]: value };
    this.validateUpdates(updates);

    this.config[key] = value;
    this.handleConfigUpdate();
  }

  update(updates: Record<string, any>): void {
    this.validateUpdates(updates);

    this.config = {
      ...this.config,
      ...updates,
    };

    this.handleConfigUpdate();
  }

  reset(): void {
    this.config = { ...this.options.defaultValues };
    this.handleConfigUpdate();
  }

  private validateUpdates(updates: Record<string, any>): void {
    try {
      const newConfig = { ...this.config, ...updates };
      this.options.schema.parse(newConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid config update: ${error.errors.map((e) => e.message).join(", ")}`
        );
      }
      throw error;
    }
  }

  private handleConfigUpdate(): void {
    if (this.options.persist) {
      this.saveConfig();
    }
    this.options.onUpdate(this.config);
  }

  private get storageKey(): string {
    return "conductor_config";
  }

  private loadConfig(): Record<string, any> {
    if (!this.options.persist || !this.options.storage) {
      return { ...this.options.defaultValues };
    }

    try {
      const stored = this.options.storage.getItem(this.storageKey);
      if (!stored) {
        return { ...this.options.defaultValues };
      }

      const parsed = JSON.parse(stored);
      const validated = this.options.schema.parse(parsed);

      return {
        ...this.options.defaultValues,
        ...validated,
      };
    } catch (error) {
      return { ...this.options.defaultValues };
    }
  }

  private saveConfig(): void {
    if (!this.options.storage) return;

    try {
      this.options.storage.setItem(
        this.storageKey,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  }

  getSnapshot(): Record<string, any> {
    return { ...this.config };
  }

  watchKey<T>(key: string, callback: (value: T) => void): () => void {
    const handler = (config: Record<string, any>) => {
      callback(config[key]);
    };

    this.options.onUpdate = handler;
    return () => {
      if (this.options.onUpdate === handler) {
        this.options.onUpdate = () => {};
      }
    };
  }
}
