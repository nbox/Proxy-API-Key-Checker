import { sleep } from "./utils";

export class RateLimiter {
  private maxRps: number;
  private nextAvailable: number;

  constructor(maxRps: number) {
    this.maxRps = Math.max(0.1, maxRps);
    this.nextAvailable = Date.now();
  }

  setMaxRps(maxRps: number) {
    this.maxRps = Math.max(0.1, maxRps);
  }

  async wait() {
    const interval = 1000 / this.maxRps;
    const now = Date.now();
    const waitMs = Math.max(0, this.nextAvailable - now);
    this.nextAvailable = Math.max(this.nextAvailable, now) + interval;
    if (waitMs > 0) {
      await sleep(waitMs);
    }
  }
}
