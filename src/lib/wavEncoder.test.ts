import { describe, expect, it } from "vitest";
import { encodeWav } from "./wavEncoder";

function readString(view: DataView, offset: number, length: number): string {
  let str = "";
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(view.getUint8(offset + i));
  }
  return str;
}

describe("encodeWav", () => {
  it("writes a valid 44-byte RIFF/WAVE header", () => {
    const view = new DataView(encodeWav(new Float32Array([0, 0]), 44100));

    expect(readString(view, 0, 4)).toBe("RIFF");
    expect(readString(view, 8, 4)).toBe("WAVE");
    expect(readString(view, 12, 4)).toBe("fmt ");
    expect(readString(view, 36, 4)).toBe("data");

    expect(view.getUint32(16, true)).toBe(16);
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint16(34, true)).toBe(16);
  });

  it("derives sample rate, byte rate and block align from the input", () => {
    const view = new DataView(encodeWav(new Float32Array([0]), 48000));

    expect(view.getUint32(24, true)).toBe(48000);
    expect(view.getUint16(32, true)).toBe(2);
    expect(view.getUint32(28, true)).toBe(48000 * 2);
  });

  it("sizes the buffer as header + 2 bytes per sample", () => {
    const buffer = encodeWav(new Float32Array([0, 0, 0]), 44100);
    const view = new DataView(buffer);

    expect(buffer.byteLength).toBe(44 + 3 * 2);
    expect(view.getUint32(40, true)).toBe(3 * 2);
    expect(view.getUint32(4, true)).toBe(buffer.byteLength - 8);
  });

  it("produces a header-only buffer for empty input", () => {
    const buffer = encodeWav(new Float32Array([]), 44100);

    expect(buffer.byteLength).toBe(44);
    expect(new DataView(buffer).getUint32(40, true)).toBe(0);
  });

  it("maps full-scale samples to signed 16-bit extremes", () => {
    const view = new DataView(encodeWav(new Float32Array([1, -1, 0]), 44100));

    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(-32768);
    expect(view.getInt16(48, true)).toBe(0);
  });

  it("clamps out-of-range samples before scaling", () => {
    const view = new DataView(encodeWav(new Float32Array([2, -2]), 44100));

    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(-32768);
  });

  it("truncates fractional samples toward zero", () => {
    const view = new DataView(encodeWav(new Float32Array([0.5]), 44100));

    expect(view.getInt16(44, true)).toBe(16383);
  });
});
