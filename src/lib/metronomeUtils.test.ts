import { describe, expect, it } from "vitest";

import { BPM_MAX, BPM_MIN } from "@/constants/audio";

import {
  clampBpm,
  collectDueBeats,
  isDownbeat,
  nextBeat,
  secondsPerBeat,
} from "./metronomeUtils";

describe("clampBpm", () => {
  it("clamps to the allowed range", () => {
    expect(clampBpm(120)).toBe(120);
    expect(clampBpm(0)).toBe(BPM_MIN);
    expect(clampBpm(10000)).toBe(BPM_MAX);
  });
});

describe("secondsPerBeat", () => {
  it("converts bpm to seconds", () => {
    expect(secondsPerBeat(60)).toBe(1);
    expect(secondsPerBeat(120)).toBe(0.5);
  });
});

describe("isDownbeat / nextBeat", () => {
  it("accents the first beat of each 4-beat measure", () => {
    expect(isDownbeat(0)).toBe(true);
    expect(isDownbeat(1)).toBe(false);
    expect(isDownbeat(4)).toBe(true);
  });

  it("wraps the beat index at the measure boundary", () => {
    expect(nextBeat(0)).toBe(1);
    expect(nextBeat(3)).toBe(0);
  });
});

describe("collectDueBeats", () => {
  it("collects every beat within the look-ahead window", () => {
    const { times, nextNoteTime } = collectDueBeats({
      nextNoteTime: 0,
      currentTime: 0,
      scheduleAheadTime: 1, // window [0, 1)
      bpm: 120, // 0.5s per beat -> beats at 0, 0.5
    });
    expect(times).toEqual([0, 0.5]);
    expect(nextNoteTime).toBe(1);
  });

  it("returns no beats when the next beat is beyond the horizon", () => {
    const { times, nextNoteTime } = collectDueBeats({
      nextNoteTime: 5,
      currentTime: 0,
      scheduleAheadTime: 0.1,
      bpm: 120,
    });
    expect(times).toEqual([]);
    expect(nextNoteTime).toBe(5);
  });

  it("carries nextNoteTime forward across ticks without drift", () => {
    const first = collectDueBeats({
      nextNoteTime: 0,
      currentTime: 0,
      scheduleAheadTime: 0.1,
      bpm: 60,
    });
    expect(first.times).toEqual([0]);
    expect(first.nextNoteTime).toBe(1);

    const second = collectDueBeats({
      nextNoteTime: first.nextNoteTime,
      currentTime: 1,
      scheduleAheadTime: 0.1,
      bpm: 60,
    });
    expect(second.times).toEqual([1]);
    expect(second.nextNoteTime).toBe(2);
  });
});
