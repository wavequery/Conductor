import { EventEmitter } from "events";

export interface EventStreamOptions {
  bufferSize?: number;
  throttleInterval?: number;
}

export class EventStream extends EventEmitter {
  private buffer: any[] = [];
  private bufferSize: number;
  private throttleInterval: number;
  private throttleTimeout: NodeJS.Timeout | null = null;

  constructor(options: EventStreamOptions = {}) {
    super();
    this.bufferSize = options.bufferSize || 1000;
    this.throttleInterval = options.throttleInterval || 100;
  }

  public push(event: any) {
    this.buffer.push({
      ...event,
      timestamp: new Date(),
    });

    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }

    this.scheduleEmit();
  }

  private scheduleEmit() {
    if (this.throttleTimeout) return;

    this.throttleTimeout = setTimeout(() => {
      this.emit("events", this.buffer);
      this.throttleTimeout = null;
    }, this.throttleInterval);
  }

  public getBuffer() {
    return [...this.buffer];
  }

  public clear() {
    this.buffer = [];
    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
      this.throttleTimeout = null;
    }
  }
}
