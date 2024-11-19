# LLM Providers

LLM integrations and management.

## Providers
- `openai.ts`: OpenAI API integration
- `anthropic.ts`: Anthropic Claude integration
- `huggingface.ts`: HuggingFace models integration
- `llm-registry.ts`: Provider management

## Usage
```typescript
const llm = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY
});

const response = await llm.complete("Hello", {
  temperature: 0.7
});
```