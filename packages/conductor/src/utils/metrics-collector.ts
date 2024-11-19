export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface MetricsCollectorConfig {
  flushInterval?: number;
  bufferSize?: number;
  onFlush?: (metrics: Metric[]) => Promise<void>;
}

export class MetricsCollector {
  private metrics: Metric[] = [];
  private config: Required<MetricsCollectorConfig>;
  private flushInterval: NodeJS.Timeout | null = null;
  private static instance: MetricsCollector;

  constructor(config: MetricsCollectorConfig = {}) {
    this.config = {
      flushInterval: 60000, // 1 minute
      bufferSize: 1000,
      onFlush: async (metrics) => {
        console.log("Metrics flushed:", metrics);
      },
      ...config,
    };

    this.startFlushInterval();
  }

  static getInstance(config?: MetricsCollectorConfig): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector(config);
    }
    return MetricsCollector.instance;
  }

  record(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date(),
      tags,
    };

    this.metrics.push(metric);

    if (this.metrics.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  private startFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  async flush(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToFlush = [...this.metrics];
    this.metrics = [];

    try {
      await this.config.onFlush(metricsToFlush);
    } catch (error) {
      // If flush fails, add metrics back to the buffer
      this.metrics = [...metricsToFlush, ...this.metrics].slice(
        0,
        this.config.bufferSize
      );
      throw error;
    }
  }

  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  summarize(
    name: string,
    fromDate?: Date
  ): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  } {
    const relevantMetrics = this.metrics
      .filter((m) => m.name === name && (!fromDate || m.timestamp >= fromDate))
      .map((m) => m.value);

    if (relevantMetrics.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }

    return {
      count: relevantMetrics.length,
      sum: relevantMetrics.reduce((a, b) => a + b, 0),
      avg: relevantMetrics.reduce((a, b) => a + b, 0) / relevantMetrics.length,
      min: Math.min(...relevantMetrics),
      max: Math.max(...relevantMetrics),
    };
  }

  dispose(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
  }
}
