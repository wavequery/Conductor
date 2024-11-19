src/
├── agents/
│   ├── __tests__/
│   │   ├── agent.test.ts
│   │   ├── chain.test.ts
│   │   └── workflow.test.ts
│   ├── agent.ts
│   ├── chain.ts
│   └── workflow.ts
├── tools/
│   ├── __tests__/
│   │   ├── base-tool.test.ts
│   │   └── tool-registry.test.ts
│   ├── base-tool.ts
│   ├── tool-registry.ts
│   ├── tool-validation.ts
│   ├── retry-handler.ts
│   └── data-tools/
│       ├── analysis.ts
│       ├── comparison.ts
│       └── visualization.ts
├── visualization/
│   ├── __tests__/
│   │   └── graph-renderer.test.ts
│   ├── graph-renderer.ts
│   ├── server.ts
│   ├── event-stream.ts
│   └── components/
│       ├── node.ts
│       ├── edge.ts
│       └── controls.ts
├── evaluation/
│   ├── __tests__/
│   │   ├── metrics.test.ts
│   │   └── eval-runner.test.ts
│   ├── metrics.ts
│   ├── eval-runner.ts
│   ├── eval-reporter.ts
│   └── custom-eval.ts
├── types/
│   ├── interfaces/
│   │   ├── agent.ts
│   │   ├── llm.ts
│   │   ├── tool.ts
│   │   ├── visualization.ts
│   │   └── evaluation.ts
│   ├── enums/
│   │   ├── agent-status.ts
│   │   └── tool-type.ts
│   └── schemas/
│       ├── tool-config.ts
│       └── eval-config.ts
├── memory/
│   ├── __tests__/
│   │   ├── context-manager.test.ts
│   │   └── memory-store.test.ts
│   ├── context-manager.ts
│   ├── memory-store.ts
│   └── store-provider.ts
├── llm/
│   ├── __tests__/
│   │   ├── openai.test.ts
│   │   └── anthropic.test.ts
│   ├── base-llm.ts
│   ├── openai.ts
│   ├── anthropic.ts
│   ├── huggingface.ts
│   └── llm-registry.ts
├── utils/
│   ├── logger.ts
│   ├── metrics-collector.ts
│   └── config-manager.ts
└── index.ts