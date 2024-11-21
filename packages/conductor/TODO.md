
21/11/2024
Adding error handler to agent

```typescript
try {
  const result = await agent.execute({
    instruction: "Process data",
    maxRetries: 3,
    onError: async (error, context) => {
      // Handle specific errors
      if (error instanceof ToolExecutionError) {
        // Try alternative tool
        return await agent.executeTool(
          agent.getBackupTool(),
          context
        );
      }
      throw error;
    }
  });
} catch (error) {
  // Handle agent failures
}
```

