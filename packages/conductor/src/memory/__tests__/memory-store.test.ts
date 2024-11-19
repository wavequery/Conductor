import { MemoryStore } from '../memory-store';
import { InMemoryStore } from '../store-provider';

describe('MemoryStore', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore({
      provider: new InMemoryStore(),
      namespace: 'test'
    });
  });

  it('should store and retrieve values', async () => {
    await store.remember('key', { test: true });
    const value = await store.recall('key');
    expect(value).toEqual({ test: true });
  });

  it('should handle TTL expiration', async () => {
    await store.remember('key', { test: true }, { ttl: 0 });
    const value = await store.recall('key');
    expect(value).toBeNull();
  });

  it('should search by type', async () => {
    await store.remember('key1', { test: 1 }, { type: 'test' });
    await store.remember('key2', { test: 2 }, { type: 'test' });
    
    const results = await store.searchByType('test');
    expect(results).toHaveLength(2);
  });

  it('should search by tags', async () => {
    await store.remember('key1', { test: 1 }, { tags: ['tag1'] });
    await store.remember('key2', { test: 2 }, { tags: ['tag1', 'tag2'] });
    
    const results = await store.searchByTags(['tag1']);
    expect(results).toHaveLength(2);
  });
});