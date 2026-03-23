export class ExpiringCache<T> {
  private data: T | null = null;
  private timestamp = 0;

  constructor(private ttlMs: number) {}

  get(): T | null {
    if (this.data !== null && Date.now() - this.timestamp < this.ttlMs) {
      return this.data;
    }
    return null;
  }

  set(data: T): void {
    this.data = data;
    this.timestamp = Date.now();
  }

  invalidate(): void {
    this.data = null;
    this.timestamp = 0;
  }
}
