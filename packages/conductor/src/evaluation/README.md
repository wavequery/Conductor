# Evaluation

Testing and evaluation framework.

## Components
- `metrics.ts`: Evaluation metrics
- `eval-runner.ts`: Test execution engine
- `eval-reporter.ts`: Results reporting
- `custom-eval.ts`: Custom evaluation framework

## Usage
```typescript
const runner = new SQLEvaluationRunner(service, {
  metrics: [SQLMetrics.QUERY_SIMILARITY]
});

const results = await runner.evaluateTestCase(testCase);
```