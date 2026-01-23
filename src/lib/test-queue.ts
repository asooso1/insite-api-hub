import { BatchTestResult } from './api-types';

export interface TestResult {
  testCaseId: string;
  testCaseName: string;
  success: boolean;
  status: number;
  responseTime: number;
  error?: string;
}

export interface QueueItem {
  testCaseId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: TestResult;
}

export interface TestQueue {
  id: string;
  items: QueueItem[];
  status: 'idle' | 'running' | 'paused' | 'cancelled';
  currentIndex: number;
  startedAt?: Date;
  completedAt?: Date;
}

export function createTestQueue(testCaseIds: string[]): TestQueue {
  return {
    id: crypto.randomUUID(),
    items: testCaseIds.map(id => ({
      testCaseId: id,
      status: 'pending' as const
    })),
    status: 'idle',
    currentIndex: 0
  };
}

export function getQueueProgress(queue: TestQueue): {
  completed: number;
  total: number;
  percent: number
} {
  const completed = queue.items.filter(item =>
    item.status === 'completed' || item.status === 'failed' || item.status === 'skipped'
  ).length;

  const total = queue.items.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percent };
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(requestsPerSecond: number = 10) {
    this.maxTokens = requestsPerSecond;
    this.tokens = requestsPerSecond;
    this.refillRate = requestsPerSecond / 1000; // convert to per millisecond
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Calculate wait time needed
    const tokensNeeded = 1 - this.tokens;
    const waitTime = Math.ceil(tokensNeeded / this.refillRate);

    await new Promise(resolve => setTimeout(resolve, waitTime));

    // After waiting, refill and take token
    this.refill();
    this.tokens -= 1;
  }

  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}
