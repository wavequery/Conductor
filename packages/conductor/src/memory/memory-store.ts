import { EventEmitter } from "events";
import { MemoryItem, StoreProvider } from "@/types/interfaces/memory";

export interface MemoryStoreOptions {
  provider: StoreProvider;
  namespace?: string;
  defaultTTL?: number;
}

export class MemoryStore extends EventEmitter {
  private provider: StoreProvider;
  private namespace: string;
  private defaultTTL: number;

  constructor(options: MemoryStoreOptions) {
    super();
    this.provider = options.provider;
    this.namespace = options.namespace || "default";
    this.defaultTTL = options.defaultTTL || 3600; // 1 hour default
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async remember<T>(
    key: string,
    value: T,
    options: {
      type?: string;
      ttl?: number;
      tags?: string[];
    } = {}
  ): Promise<void> {
    const item: MemoryItem = {
      id: key,
      content: value,
      metadata: {
        timestamp: new Date(),
        type: options.type || "generic",
        ttl: options.ttl || this.defaultTTL,
        tags: options.tags,
      },
    };

    await this.provider.set(this.getKey(key), item);
    this.emit("set", key, item);
  }

  async recall<T>(key: string): Promise<T | null> {
    const item = await this.provider.get(this.getKey(key));
    if (!item) return null;

    this.emit("get", key, item);
    return item.content as T;
  }

  async forget(key: string): Promise<void> {
    await this.provider.delete(this.getKey(key));
    this.emit("delete", key);
  }

  async searchByType<T>(type: string): Promise<T[]> {
    const items = await this.provider.search({ type });
    return items.map((item) => item.content as T);
  }

  async searchByTags<T>(tags: string[]): Promise<T[]> {
    const items = await this.provider.search({ tags });
    return items.map((item) => item.content as T);
  }

  async clear(): Promise<void> {
    await this.provider.clear();
    this.emit("clear");
  }
}
