# Memory Management

State and context management.

## Components
- `context-manager.ts`: Conversation context handling
- `memory-store.ts`: Memory storage implementation
- `store-provider.ts`: Storage provider interface

## Usage
```typescript
const store = new MemoryStore({
  provider: new InMemoryStore()
});

await store.remember('key', data, {
  type: 'analysis',
  ttl: 3600
});
```