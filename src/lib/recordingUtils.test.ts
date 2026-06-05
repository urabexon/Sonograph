import { describe, expect, it } from "vitest";
import type { Recording, RecordingMeta } from "@/types";

import {
  RECORDING_LIST_KEY,
  RECORDING_TTL_MS,
  downloadFileName,
  expiresAtFrom,
  formatDuration,
  isExpired,
  isValidDuration,
  partitionByExpiry,
  recordingKey,
  sortByNewest,
  timeRemaining,
  toRecordingMeta,
} from "./recordingUtils";

describe("storage keys", () => {
  it("builds a per-recording key and exposes the list key", () => {
    expect(recordingKey("abc")).toBe("recording-abc");
    expect(RECORDING_LIST_KEY).toBe("recording-list");
  });
});

describe("expiresAtFrom", () => {
  it("adds the 7-day TTL to the creation time", () => {
    expect(expiresAtFrom(1000)).toBe(1000 + RECORDING_TTL_MS);
    expect(RECORDING_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("isExpired", () => {
  it("treats expiresAt at or before now as expired", () => {
    expect(isExpired(100, 100)).toBe(true);
    expect(isExpired(100, 101)).toBe(true);
  });

  it("treats a future expiresAt as valid", () => {
    expect(isExpired(100, 99)).toBe(false);
  });
});

describe("partitionByExpiry", () => {
  it("splits entries into valid and expired, preserving order", () => {
    const entries = [
      { id: "a", expiresAt: 50 },
      { id: "b", expiresAt: 150 },
      { id: "c", expiresAt: 200 },
      { id: "d", expiresAt: 100 },
    ];
    const { valid, expired } = partitionByExpiry(entries, 100);

    expect(valid.map((e) => e.id)).toEqual(["b", "c"]);
    expect(expired.map((e) => e.id)).toEqual(["a", "d"]);
  });

  it("returns empty groups for empty input", () => {
    expect(partitionByExpiry([], 0)).toEqual({ valid: [], expired: [] });
  });
});

describe("toRecordingMeta", () => {
  it("keeps metadata and drops the audio blob and pitch data", () => {
    const recording: Recording = {
      id: "x",
      createdAt: 1,
      expiresAt: 2,
      duration: 3,
      mimeType: "audio/wav",
      audioBlob: new Blob(),
      pitchData: [{ frequency: 440, timestamp: 1 }],
    };
    expect(toRecordingMeta(recording)).toEqual({
      id: "x",
      createdAt: 1,
      expiresAt: 2,
      duration: 3,
    });
  });
});

describe("sortByNewest", () => {
  it("orders by createdAt descending without mutating input", () => {
    const metas: RecordingMeta[] = [
      { id: "a", createdAt: 10, expiresAt: 0, duration: 0 },
      { id: "b", createdAt: 30, expiresAt: 0, duration: 0 },
      { id: "c", createdAt: 20, expiresAt: 0, duration: 0 },
    ];
    expect(sortByNewest(metas).map((m) => m.id)).toEqual(["b", "c", "a"]);
    expect(metas.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });
});

describe("isValidDuration", () => {
  it("accepts whole seconds within bounds", () => {
    expect(isValidDuration(1)).toBe(true);
    expect(isValidDuration(30)).toBe(true);
    expect(isValidDuration(600)).toBe(true);
  });

  it("rejects out-of-range, fractional and non-finite values", () => {
    expect(isValidDuration(0)).toBe(false);
    expect(isValidDuration(601)).toBe(false);
    expect(isValidDuration(30.5)).toBe(false);
    expect(isValidDuration(Infinity)).toBe(false);
    expect(isValidDuration(NaN)).toBe(false);
  });
});

describe("formatDuration", () => {
  it("formats seconds as m:ss with zero-padding", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(600)).toBe("10:00");
  });

  it("falls back to 0:00 for non-finite or negative input", () => {
    expect(formatDuration(Infinity)).toBe("0:00");
    expect(formatDuration(NaN)).toBe("0:00");
    expect(formatDuration(-3)).toBe("0:00");
  });
});

describe("timeRemaining", () => {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  it("classifies by largest unit remaining", () => {
    expect(timeRemaining(100, 200)).toEqual({ kind: "expired" });
    expect(timeRemaining(3 * DAY, 0)).toEqual({ kind: "days", value: 3 });
    expect(timeRemaining(5 * HOUR, 0)).toEqual({ kind: "hours", value: 5 });
    expect(timeRemaining(30 * 60 * 1000, 0)).toEqual({ kind: "soon" });
  });

  it("treats exactly-now and sub-hour as soon (not expired)", () => {
    expect(timeRemaining(0, 0)).toEqual({ kind: "soon" });
  });
});

describe("downloadFileName", () => {
  it("formats a UTC timestamp into a safe file name", () => {
    const createdAt = Date.UTC(2026, 5, 2, 8, 30, 15);
    expect(downloadFileName(createdAt, "wav")).toBe(
      "recording-2026-06-02T08-30-15.wav",
    );
    expect(downloadFileName(createdAt, "mp3")).toBe(
      "recording-2026-06-02T08-30-15.mp3",
    );
  });
});
