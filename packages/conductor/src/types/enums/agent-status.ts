export enum AgentStatus {
    IDLE = 'IDLE',
    INITIALIZING = 'INITIALIZING',
    RUNNING = 'RUNNING',
    WAITING = 'WAITING',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
    TIMEOUT = 'TIMEOUT'
  }
  
  export enum AgentEventType {
    STATUS_CHANGED = 'status_changed',
    STEP_STARTED = 'step_started',
    STEP_COMPLETED = 'step_completed',
    STEP_FAILED = 'step_failed',
    TOOL_CALLED = 'tool_called',
    LLM_CALLED = 'llm_called',
    ERROR = 'error'
  }