export interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  category: string;
  source?: 'server' | 'client';
  message: string;
  meta?: Record<string, unknown>;
}

export interface LogSubscriber {
  id: string;
  controller: ReadableStreamDefaultController;
  filters?: {
    level?: string;
    category?: string;
  };
}

export type LogListener = (entry: LogEntry) => void;

class LogBuffer {
  private buffer: LogEntry[] = [];
  private subscribers: Map<string, LogSubscriber> = new Map();
  private listeners: LogListener[] = [];
  private nextId = 1;
  private readonly maxSize = 500;

  push(entry: Omit<LogEntry, "id">): void {
    const full: LogEntry = { ...entry, id: this.nextId++ };
    this.buffer.push(full);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
    this.broadcast(full);
    for (const listener of this.listeners) {
      try { listener(full); } catch { /* non-critical */ }
    }
  }

  onPush(listener: LogListener): void {
    this.listeners.push(listener);
  }

  getRecent(count = 100): LogEntry[] {
    return this.buffer.slice(-count);
  }

  subscribe(subscriber: LogSubscriber): void {
    this.subscribers.set(subscriber.id, subscriber);
  }

  unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  broadcast(entry: LogEntry): void {
    const dead: string[] = [];

    for (const [id, subscriber] of this.subscribers) {
      const { filters } = subscriber;
      if (filters?.level && filters.level !== entry.level) continue;
      if (filters?.category && filters.category !== entry.category) continue;

      try {
        const data = `data: ${JSON.stringify(entry)}\n\n`;
        subscriber.controller.enqueue(new TextEncoder().encode(data));
      } catch {
        dead.push(id);
      }
    }

    for (const id of dead) {
      this.subscribers.delete(id);
    }
  }
}

const globalForLogBuffer = globalThis as unknown as { __logBuffer?: LogBuffer };
export const logBuffer = globalForLogBuffer.__logBuffer ?? (globalForLogBuffer.__logBuffer = new LogBuffer());
