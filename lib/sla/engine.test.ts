import { describe, it, expect } from "vitest";
import { computeSLAStatus } from "./engine";

// Fixed reference time for all tests
const BASE = new Date("2025-01-01T00:00:00.000Z");

function hoursLater(h: number): Date {
  return new Date(BASE.getTime() + h * 3600_000);
}

describe("computeSLAStatus", () => {
  // SLA window: created at BASE, deadline 8 hours later
  const deadline = hoursLater(8);

  it("returns OK when less than 75% of the window has elapsed", () => {
    // 4 hours elapsed out of 8 = 50%
    const now = hoursLater(4);
    expect(computeSLAStatus(now, BASE, deadline)).toBe("OK");
  });

  it("returns OK at exactly 0% elapsed (just created)", () => {
    expect(computeSLAStatus(BASE, BASE, deadline)).toBe("OK");
  });

  it("returns AT_RISK at exactly 75% elapsed", () => {
    // 6 out of 8 hours = 75%
    const now = hoursLater(6);
    expect(computeSLAStatus(now, BASE, deadline)).toBe("AT_RISK");
  });

  it("returns AT_RISK between 75% and 100%", () => {
    // 7 out of 8 hours = 87.5%
    const now = hoursLater(7);
    expect(computeSLAStatus(now, BASE, deadline)).toBe("AT_RISK");
  });

  it("returns BREACHED at exactly the deadline", () => {
    expect(computeSLAStatus(deadline, BASE, deadline)).toBe("BREACHED");
  });

  it("returns BREACHED after the deadline has passed", () => {
    const now = hoursLater(10);
    expect(computeSLAStatus(now, BASE, deadline)).toBe("BREACHED");
  });

  it("returns BREACHED even far past the deadline", () => {
    const now = hoursLater(72);
    expect(computeSLAStatus(now, BASE, deadline)).toBe("BREACHED");
  });

  it("handles a 4-hour CRITICAL window correctly", () => {
    const criticalDeadline = hoursLater(4);
    // 3 hours elapsed = 75% → AT_RISK
    expect(computeSLAStatus(hoursLater(3), BASE, criticalDeadline)).toBe("AT_RISK");
    // 4 hours elapsed → BREACHED
    expect(computeSLAStatus(hoursLater(4), BASE, criticalDeadline)).toBe("BREACHED");
  });

  it("returns BREACHED when totalMs is 0 (pathological: created = deadline)", () => {
    // totalMs = 0, pctElapsed treated as 100 → BREACHED unless now < deadline
    // In this case now = created = deadline, so now >= deadline → BREACHED
    expect(computeSLAStatus(BASE, BASE, BASE)).toBe("BREACHED");
  });
});
