export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponential?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryStrategy {
  shouldRetry: (error: Error, attempt: number) => boolean;
  getDelay: (attempt: number) => number;
}

export class RetryHandler {
  private options: Required<RetryOptions>;
  private strategy: RetryStrategy;

  constructor(options: RetryOptions) {
    this.options = {
      exponential: true,
      onRetry: () => {},
      ...options,
    };

    this.strategy = {
      shouldRetry: this.defaultShouldRetry.bind(this),
      getDelay: this.defaultGetDelay.bind(this),
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    let lastError: Error;

    while (attempt < this.options.maxRetries) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        attempt++;

        if (!this.strategy.shouldRetry(error, attempt)) {
          throw error;
        }

        const delay = this.strategy.getDelay(attempt);
        this.options.onRetry(attempt, error);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  setStrategy(strategy: Partial<RetryStrategy>): void {
    this.strategy = {
      ...this.strategy,
      ...strategy,
    };
  }

  private defaultShouldRetry(error: Error, attempt: number): boolean {
    // Retry on network errors or rate limits
    return (
      (error.name === "NetworkError" ||
        error.name === "RateLimitError" ||
        error.message.includes("timeout")) &&
      attempt < this.options.maxRetries
    );
  }

  private defaultGetDelay(attempt: number): number {
    if (this.options.exponential) {
      return Math.min(
        this.options.baseDelay * Math.pow(2, attempt - 1),
        this.options.maxDelay
      );
    }
    return this.options.baseDelay;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
