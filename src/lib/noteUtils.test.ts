import { describe, it, expect } from "vitest";
import {
  frequencyToMidi,
  midiToFrequency,
  frequencyToNoteIndex,
  frequencyToCents,
  frequencyToOctave,
  getNoteNames,
  frequencyToNoteName,
  getNoteNameWithoutOctave,
  solfegeVariantForLanguage,
} from "./noteUtils";

describe("frequencyToMidi", () => {
  it("A4 (440Hz) → MIDI 69", () => {
    expect(frequencyToMidi(440)).toBeCloseTo(69);
  });

  it("A3 (220Hz) → MIDI 57", () => {
    expect(frequencyToMidi(220)).toBeCloseTo(57);
  });

  it("C4 (261.63Hz) → MIDI 60", () => {
    expect(frequencyToMidi(261.63)).toBeCloseTo(60, 0);
  });

  it("respects custom reference frequency (442Hz)", () => {
    const midi = frequencyToMidi(442, { referenceFrequency: 442 });
    expect(midi).toBeCloseTo(69);
  });
});

describe("midiToFrequency", () => {
  it("MIDI 69 → 440Hz", () => {
    expect(midiToFrequency(69)).toBeCloseTo(440);
  });

  it("MIDI 60 → C4 (≈261.63Hz)", () => {
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);
  });

  it("is inverse of frequencyToMidi", () => {
    const freq = 523.25;
    const midi = frequencyToMidi(freq);
    expect(midiToFrequency(midi)).toBeCloseTo(freq, 1);
  });
});

describe("frequencyToNoteIndex", () => {
  it("440Hz → A (index 9)", () => {
    expect(frequencyToNoteIndex(440)).toBe(9);
  });

  it("261.63Hz → C (index 0)", () => {
    expect(frequencyToNoteIndex(261.63)).toBe(0);
  });

  it("applies B♭ transposition: 440Hz → index 7", () => {
    expect(frequencyToNoteIndex(440, { transposition: "Bb" })).toBe(7);
  });
});

describe("frequencyToCents", () => {
  it("A4 (440Hz) → 0 cents", () => {
    expect(frequencyToCents(440)).toBe(0);
  });

  it("442Hz → positive cents (sharp)", () => {
    const cents = frequencyToCents(442);
    expect(cents).toBeGreaterThan(0);
    expect(cents).toBeLessThan(50);
  });

  it("438Hz → negative cents (flat)", () => {
    const cents = frequencyToCents(438);
    expect(cents).toBeLessThan(0);
    expect(cents).toBeGreaterThan(-50);
  });

  it("stays within ±50 cents range", () => {
    for (const freq of [440, 220, 330, 550, 660]) {
      const cents = frequencyToCents(freq);
      expect(cents).toBeGreaterThanOrEqual(-50);
      expect(cents).toBeLessThanOrEqual(50);
    }
  });

  it("applies just intonation adjustment when temperament is 'just'", () => {
    const e4Freq = 329.63;
    const equalCents = frequencyToCents(e4Freq, { temperament: "equal" });
    const justCents = frequencyToCents(e4Freq, { temperament: "just" });
    expect(justCents).not.toBe(equalCents);
    expect(justCents).toBeGreaterThan(equalCents);
  });
});

describe("frequencyToOctave", () => {
  it("440Hz → octave 4", () => {
    expect(frequencyToOctave(440)).toBe(4);
  });

  it("261.63Hz → octave 4 (C4)", () => {
    expect(frequencyToOctave(261.63)).toBe(4);
  });

  it("130.81Hz → octave 3 (C3)", () => {
    expect(frequencyToOctave(130.81)).toBe(3);
  });
});

describe("getNoteNames", () => {
  it("returns 12 notes for letter + sharp", () => {
    const names = getNoteNames("letter", "sharp");
    expect(names).toHaveLength(12);
    expect(names[0]).toBe("C");
    expect(names[9]).toBe("A");
  });

  it("returns flat names for letter + flat", () => {
    const names = getNoteNames("letter", "flat");
    expect(names[1]).toBe("D♭");
  });

  it("returns solfege names for solfege + sharp", () => {
    const names = getNoteNames("solfege", "sharp");
    expect(names[0]).toBe("ド");
    expect(names[9]).toBe("ラ");
  });

  it("returns flat solfege names for solfege + flat", () => {
    const names = getNoteNames("solfege", "flat");
    expect(names[1]).toBe("レ♭");
  });

  it("defaults solfege to katakana when no variant is given", () => {
    expect(getNoteNames("solfege", "sharp")[9]).toBe("ラ");
  });

  it("returns latin solfege names for the latin variant", () => {
    const sharp = getNoteNames("solfege", "sharp", "latin");
    expect(sharp[0]).toBe("Do");
    expect(sharp[9]).toBe("La");
    const flat = getNoteNames("solfege", "flat", "latin");
    expect(flat[1]).toBe("Re♭");
  });

  it("ignores the variant for letter notation", () => {
    expect(getNoteNames("letter", "sharp", "latin")[0]).toBe("C");
  });
});

describe("solfegeVariantForLanguage", () => {
  it("uses katakana for Japanese and latin otherwise", () => {
    expect(solfegeVariantForLanguage("ja")).toBe("katakana");
    expect(solfegeVariantForLanguage("ja-JP")).toBe("katakana");
    expect(solfegeVariantForLanguage("en")).toBe("latin");
    expect(solfegeVariantForLanguage("fr")).toBe("latin");
  });
});

describe("frequencyToNoteName (latin solfege)", () => {
  it("renders 440Hz as La4 in latin solfege", () => {
    expect(
      frequencyToNoteName(440, "solfege", "sharp", undefined, "latin"),
    ).toBe("La4");
  });
});

describe("frequencyToNoteName", () => {
  it("440Hz → A4", () => {
    expect(frequencyToNoteName(440, "letter", "sharp")).toBe("A4");
  });

  it("261.63Hz → C4", () => {
    expect(frequencyToNoteName(261.63, "letter", "sharp")).toBe("C4");
  });

  it("440Hz → ラ4 (solfege)", () => {
    expect(frequencyToNoteName(440, "solfege", "sharp")).toBe("ラ4");
  });
});

describe("getNoteNameWithoutOctave", () => {
  it("440Hz → A", () => {
    expect(getNoteNameWithoutOctave(440, "letter", "sharp")).toBe("A");
  });

  it("440Hz → ラ (solfege)", () => {
    expect(getNoteNameWithoutOctave(440, "solfege", "sharp")).toBe("ラ");
  });
});
