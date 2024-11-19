import { ContextManager } from '../context-manager';
import { MemoryStore } from '../memory-store';
import { InMemoryStore } from '../store-provider';

describe('ContextManager', () => {
  let contextManager: ContextManager;
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore({
      provider: new InMemoryStore(),
      namespace: 'test'
    });
    contextManager = new ContextManager(store, 'test-context');
  });

  it('should initialize empty context', async () => {
    await contextManager.initialize();
    const summary = await contextManager.summarize();
    expect(summary.messageCount).toBe(0);
  });

  it('should add and retrieve messages', async () => {
    await contextManager.addMessage('user', 'test message');
    const messages = contextManager.getRecentMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('test message');
  });

  it('should manage state', async () => {
    await contextManager.setState('test', 123);
    const value = await contextManager.getState<number>('test');
    expect(value).toBe(123);
  });

  it('should persist context between instances', async () => {
    await contextManager.addMessage('user', 'test message');
    
    const newContextManager = new ContextManager(store, 'test-context');
    await newContextManager.initialize();
    
    const messages = newContextManager.getRecentMessages();
    expect(messages).toHaveLength(1);
  });

  it('should clear context', async () => {
    await contextManager.addMessage('user', 'test message');
    await contextManager.clear();
    
    const summary = await contextManager.summarize();
    expect(summary.messageCount).toBe(0);
  });
});