import { MemoryItem, StoreProvider } from "@/types/interfaces/memory";

export class InMemoryStore implements StoreProvider {
  private store: Map<string, MemoryItem> = new Map();

  async get(key: string): Promise<MemoryItem | null> {
    const item = this.store.get(key);
    if (!item) return null;

    if (this.isExpired(item)) {
      await this.delete(key);
      return null;
    }

    return item;
  }

  async set(key: string, item: MemoryItem): Promise<void> {
    this.store.set(key, item);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async search(query: {
    type?: string;
    tags?: string[];
    fromDate?: Date;
    toDate?: Date;
  }): Promise<MemoryItem[]> {
    return Array.from(this.store.values()).filter((item) => {
      if (query.type && item.metadata.type !== query.type) return false;

      if (query.tags?.length) {
        const hasAllTags = query.tags.every((tag) =>
          item.metadata.tags?.includes(tag)
        );
        if (!hasAllTags) return false;
      }

      if (query.fromDate && item.metadata.timestamp < query.fromDate)
        return false;
      if (query.toDate && item.metadata.timestamp > query.toDate) return false;

      return !this.isExpired(item);
    });
  }

  private isExpired(item: MemoryItem): boolean {
    if (!item.metadata.ttl) return false;

    const expiryTime =
      new Date(item.metadata.timestamp).getTime() + item.metadata.ttl * 1000;
    return Date.now() > expiryTime;
  }
}

export class PersistentStore implements StoreProvider {
  private filename: string;
  private store: Map<string, MemoryItem>;

  constructor(filename: string) {
    this.filename = filename;
    this.store = new Map();
    this.load();
  }

  private async load() {
    try {
      const fs = await import("fs/promises");
      const data = await fs.readFile(this.filename, "utf-8");
      const items = JSON.parse(data);
      this.store = new Map(Object.entries(items));
    } catch (error) {
      this.store = new Map();
    }
  }

  private async save() {
    const fs = await import("fs/promises");
    const data = JSON.stringify(Object.fromEntries(this.store));
    await fs.writeFile(this.filename, data, "utf-8");
  }

  async get(key: string): Promise<MemoryItem | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, item: MemoryItem): Promise<void> {
    this.store.set(key, item);
    await this.save();
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    await this.save();
  }

  async clear(): Promise<void> {
    this.store.clear();
    await this.save();
  }

  async search(query: {
    type?: string;
    tags?: string[];
    fromDate?: Date;
    toDate?: Date;
  }): Promise<MemoryItem[]> {
    return Array.from(this.store.values()).filter((item) => {
      if (query.type && item.metadata.type !== query.type) return false;

      if (query.tags?.length) {
        const hasAllTags = query.tags.every((tag) =>
          item.metadata.tags?.includes(tag)
        );
        if (!hasAllTags) return false;
      }

      if (query.fromDate && item.metadata.timestamp < query.fromDate)
        return false;
      if (query.toDate && item.metadata.timestamp > query.toDate) return false;

      return true;
    });
  }
}
