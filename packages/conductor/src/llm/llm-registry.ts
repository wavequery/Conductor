import { LLMProvider } from "@/types/interfaces/llm";

/**
 * Registry for managing LLM providers
 */
export class LLMRegistry {
  private providers: Map<string, LLMProvider> = new Map();

  /**
   * Register a new LLM provider
   */
  register(name: string, provider: LLMProvider): void {
    if (this.providers.has(name)) {
      throw new Error(`Provider ${name} is already registered`);
    }
    this.providers.set(name, provider);
  }

  /**
   * Get a registered provider
   */
  get(name: string): LLMProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider ${name} not found`);
    }
    return provider;
  }

  /**
   * Remove a provider from the registry
   */
  unregister(name: string): void {
    this.providers.delete(name);
  }

  /**
   * List all registered providers
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
