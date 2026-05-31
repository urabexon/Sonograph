import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "@/types";

import { sanitizeSettings } from "./settingsUtils";

describe("sanitizeSettings", () => {
  it("returns default settings for null or undefined", () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it("returns default settings for non-objects", () => {
    expect(sanitizeSettings("string")).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(123)).toEqual(DEFAULT_SETTINGS);
  });

  it("returns default settings for an empty object", () => {
    expect(sanitizeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it("preserves a fully valid settings object", () => {
    const input = {
      notation: "solfege",
      accidental: "flat",
      advanced: {
        referenceFrequency: 442,
        transposition: "Bb",
        centThreshold: 10,
        temperament: "just",
        noiseGateThreshold: 0.02,
      },
    };
    expect(sanitizeSettings(input)).toEqual(input);
  });

  it("falls back to default for an unknown notation", () => {
    expect(sanitizeSettings({ notation: "garbage" }).notation).toBe(
      DEFAULT_SETTINGS.notation,
    );
  });

  it("falls back to default for out-of-range referenceFrequency", () => {
    expect(
      sanitizeSettings({ advanced: { referenceFrequency: 100 } }).advanced
        .referenceFrequency,
    ).toBe(440);
    expect(
      sanitizeSettings({ advanced: { referenceFrequency: 1000 } }).advanced
        .referenceFrequency,
    ).toBe(440);
  });

  it("falls back to default for invalid transposition", () => {
    expect(
      sanitizeSettings({ advanced: { transposition: "Z" } }).advanced
        .transposition,
    ).toBe("C");
  });

  it("isolates corruption to one field (others stay valid)", () => {
    const result = sanitizeSettings({
      notation: "solfege",
      accidental: "garbage",
      advanced: {
        referenceFrequency: 442,
        transposition: "junk",
        centThreshold: 7,
        temperament: "just",
        noiseGateThreshold: 0.05,
      },
    });
    expect(result.notation).toBe("solfege");
    expect(result.accidental).toBe("sharp"); // defaulted
    expect(result.advanced.referenceFrequency).toBe(442);
    expect(result.advanced.transposition).toBe("C"); // defaulted
    expect(result.advanced.centThreshold).toBe(7);
  });
});
