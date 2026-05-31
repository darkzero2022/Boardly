import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getSLADeadline,
  formatDate,
  timeAgo,
  parseMentions,
  priorityColor,
  slaStatusColor,
  DEFAULT_SLA_HOURS,
} from "./utils";

// ---------------------------------------------------------------------------
// getSLADeadline
// ---------------------------------------------------------------------------

describe("getSLADeadline", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns deadline using default hours when no policy given", () => {
    const deadline = getSLADeadline("HIGH");
    const expectedMs = DEFAULT_SLA_HOURS.HIGH * 60 * 60 * 1000;
    expect(deadline.getTime()).toBe(new Date("2025-01-01T00:00:00.000Z").getTime() + expectedMs);
  });

  it("uses custom policy hours when policy is provided", () => {
    const policy = { criticalHours: 1, highHours: 2, mediumHours: 3, lowHours: 4 };
    const deadline = getSLADeadline("CRITICAL", policy);
    const expectedMs = 1 * 60 * 60 * 1000;
    expect(deadline.getTime()).toBe(new Date("2025-01-01T00:00:00.000Z").getTime() + expectedMs);
  });

  it("falls back to default when policy is null", () => {
    const deadline = getSLADeadline("LOW", null);
    const expectedMs = DEFAULT_SLA_HOURS.LOW * 60 * 60 * 1000;
    expect(deadline.getTime()).toBe(new Date("2025-01-01T00:00:00.000Z").getTime() + expectedMs);
  });

  it("covers all four default priorities", () => {
    const priorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
    for (const priority of priorities) {
      const deadline = getSLADeadline(priority);
      const expectedMs = DEFAULT_SLA_HOURS[priority] * 60 * 60 * 1000;
      expect(deadline.getTime()).toBe(
        new Date("2025-01-01T00:00:00.000Z").getTime() + expectedMs
      );
    }
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe("formatDate", () => {
  it("returns em-dash for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("returns em-dash for undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });

  it("formats a Date object without throwing", () => {
    const result = formatDate(new Date("2025-06-15T10:30:00.000Z"));
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("formats a date string without throwing", () => {
    const result = formatDate("2025-06-15T10:30:00.000Z");
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// timeAgo
// ---------------------------------------------------------------------------

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for < 1 minute ago", () => {
    const date = new Date("2025-01-01T11:59:30.000Z"); // 30 seconds ago
    expect(timeAgo(date)).toBe("just now");
  });

  it("returns minutes for < 60 minutes ago", () => {
    const date = new Date("2025-01-01T11:45:00.000Z"); // 15 minutes ago
    expect(timeAgo(date)).toBe("15m ago");
  });

  it("returns '59m ago' right before the hour boundary", () => {
    const date = new Date("2025-01-01T11:01:00.000Z"); // 59 minutes ago
    expect(timeAgo(date)).toBe("59m ago");
  });

  it("returns hours for < 24 hours ago", () => {
    const date = new Date("2025-01-01T10:00:00.000Z"); // 2 hours ago
    expect(timeAgo(date)).toBe("2h ago");
  });

  it("returns days for >= 24 hours ago", () => {
    const date = new Date("2024-12-30T12:00:00.000Z"); // 2 days ago
    expect(timeAgo(date)).toBe("2d ago");
  });

  it("accepts a string date", () => {
    const result = timeAgo("2025-01-01T11:45:00.000Z");
    expect(result).toBe("15m ago");
  });
});

// ---------------------------------------------------------------------------
// parseMentions
// ---------------------------------------------------------------------------

describe("parseMentions", () => {
  it("returns empty array when no mentions", () => {
    expect(parseMentions("hello world")).toEqual([]);
  });

  it("parses a single mention", () => {
    expect(parseMentions("hey @alice can you look at this?")).toEqual(["alice"]);
  });

  it("parses multiple mentions", () => {
    expect(parseMentions("@alice and @bob please review")).toEqual(["alice", "bob"]);
  });

  it("handles mentions with dots and hyphens", () => {
    expect(parseMentions("@john.doe and @jane-smith")).toEqual(["john.doe", "jane-smith"]);
  });

  it("handles duplicate mentions", () => {
    expect(parseMentions("@alice @alice")).toEqual(["alice", "alice"]);
  });

  it("returns empty array for empty string", () => {
    expect(parseMentions("")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// priorityColor
// ---------------------------------------------------------------------------

describe("priorityColor", () => {
  it("returns red classes for CRITICAL", () => {
    expect(priorityColor("CRITICAL")).toContain("red");
  });

  it("returns orange classes for HIGH", () => {
    expect(priorityColor("HIGH")).toContain("orange");
  });

  it("returns yellow classes for MEDIUM", () => {
    expect(priorityColor("MEDIUM")).toContain("yellow");
  });

  it("returns green classes for LOW", () => {
    expect(priorityColor("LOW")).toContain("green");
  });
});

// ---------------------------------------------------------------------------
// slaStatusColor
// ---------------------------------------------------------------------------

describe("slaStatusColor", () => {
  it("returns green for OK", () => {
    expect(slaStatusColor("OK")).toContain("green");
  });

  it("returns yellow for AT_RISK", () => {
    expect(slaStatusColor("AT_RISK")).toContain("yellow");
  });

  it("returns red for BREACHED", () => {
    expect(slaStatusColor("BREACHED")).toContain("red");
  });

  it("returns gray fallback for unknown status", () => {
    expect(slaStatusColor("UNKNOWN")).toBe("text-gray-400");
  });

  it("returns gray fallback for empty string", () => {
    expect(slaStatusColor("")).toBe("text-gray-400");
  });
});
