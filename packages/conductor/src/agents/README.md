# Agents

Core orchestration components for LLM interactions.

## Components
- `agent.ts`: Base agent for executing LLM tasks
- `chain.ts`: Sequential execution of multiple steps
- `workflow.ts`: Complex workflows with branching and parallel execution

## Usage
```typescript
const agent = new Agent({
  name: "text-analyzer",
  llmProvider: new OpenAIProvider({ apiKey: "..." }),
  tools: [new TextAnalysisTool()]
});

const result = await agent.execute({ text: "analyze this" });
```