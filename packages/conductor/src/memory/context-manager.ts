import { MemoryStore } from "./memory-store";
import { ContextData } from "@/types/interfaces/memory";

export class ContextManager {
  private store: MemoryStore;
  private contextId: string;
  private context: ContextData;

  constructor(store: MemoryStore, contextId: string) {
    this.store = store;
    this.contextId = contextId;
    this.context = {
      messages: [],
      metadata: {},
      state: {},
    };
  }

  async initialize(): Promise<void> {
    const savedContext = await this.store.recall<ContextData>(this.contextId);
    if (savedContext) {
      this.context = savedContext;
    }
  }

  async addMessage(role: string, content: string): Promise<void> {
    this.context.messages.push({
      role,
      content,
      timestamp: new Date(),
    });

    await this.save();
  }

  async updateMetadata(metadata: Record<string, any>): Promise<void> {
    this.context.metadata = {
      ...this.context.metadata,
      ...metadata,
    };

    await this.save();
  }

  async setState(key: string, value: any): Promise<void> {
    this.context.state[key] = value;
    await this.save();
  }

  async getState<T>(key: string): Promise<T | undefined> {
    return this.context.state[key] as T;
  }

  getRecentMessages(count: number = 10): Array<{
    role: string;
    content: string;
    timestamp: Date;
  }> {
    return this.context.messages.slice(-count);
  }

  async summarize(): Promise<{
    messageCount: number;
    lastMessageTime: Date | null;
    metadata: Record<string, any>;
  }> {
    return {
      messageCount: this.context.messages.length,
      lastMessageTime:
        this.context.messages.length > 0
          ? this.context.messages[this.context.messages.length - 1].timestamp
          : null,
      metadata: this.context.metadata,
    };
  }

  private async save(): Promise<void> {
    await this.store.remember(this.contextId, this.context, {
      type: "context",
      tags: ["context", this.contextId],
    });
  }

  async clear(): Promise<void> {
    this.context = {
      messages: [],
      metadata: {},
      state: {},
    };
    await this.save();
  }
}
