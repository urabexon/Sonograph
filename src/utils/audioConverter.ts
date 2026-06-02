import { AUDIO_FORMAT_EXTENSIONS, type AudioFormat } from "@/types";

const MP3_KBPS = 128;
const MP3_CHUNK_SIZE = 1152;

async function decodeBlob(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  try {
    return await audioContext.decodeAudioData(arrayBuffer);
  } finally {
    await audioContext.close();
  }
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const clamped = Math.max(-1, Math.min(1, input[i]));
    output[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return output;
}

async function audioBufferToMp3(buffer: AudioBuffer): Promise<Blob> {
  const { Mp3Encoder } = await import("@breezystack/lamejs");

  const channels = buffer.numberOfChannels;
  const encoder = new Mp3Encoder(channels, buffer.sampleRate, MP3_KBPS);
  const frames: ArrayBuffer[] = [];

  const left = floatTo16BitPCM(buffer.getChannelData(0));
  const right =
    channels > 1 ? floatTo16BitPCM(buffer.getChannelData(1)) : undefined;

  const pushFrame = (frame: Uint8Array) => {
    if (frame.length > 0) {
      // Copy into a standalone ArrayBuffer for Blob compatibility
      const copy = new ArrayBuffer(frame.length);
      new Uint8Array(copy).set(frame);
      frames.push(copy);
    }
  };

  for (let i = 0; i < left.length; i += MP3_CHUNK_SIZE) {
    const leftChunk = left.subarray(i, i + MP3_CHUNK_SIZE);
    const rightChunk = right?.subarray(i, i + MP3_CHUNK_SIZE);
    pushFrame(encoder.encodeBuffer(leftChunk, rightChunk));
  }
  pushFrame(encoder.flush());

  return new Blob(frames, { type: "audio/mp3" });
}

export async function convertAudioBlob(
  blob: Blob,
  format: AudioFormat,
): Promise<{ readonly blob: Blob; readonly extension: string }> {
  if (format === "wav") {
    // Stored recordings are already WAV
    return { blob, extension: AUDIO_FORMAT_EXTENSIONS.wav };
  }
  const audioBuffer = await decodeBlob(blob);
  return {
    blob: await audioBufferToMp3(audioBuffer),
    extension: AUDIO_FORMAT_EXTENSIONS.mp3,
  };
}

export function getSupportedFormats(): readonly AudioFormat[] {
  return ["wav", "mp3"];
}
