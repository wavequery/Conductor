export interface MemoryItem {
    id: string;
    content: any;
    metadata: {
      timestamp: Date;
      type: string;
      ttl?: number;
      tags?: string[];
    };
  }
  
  export interface StoreProvider {
    get(key: string): Promise<MemoryItem | null>;
    set(key: string, item: MemoryItem): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    search(query: {
      type?: string;
      tags?: string[];
      fromDate?: Date;
      toDate?: Date;
    }): Promise<MemoryItem[]>;
  }
  
  export interface ContextData {
    messages: Array<{
      role: string;
      content: string;
      timestamp: Date;
    }>;
    metadata: Record<string, any>;
    state: Record<string, any>;
  }