import { useCallback, useEffect, useRef } from "react";

import { get, set } from "idb-keyval";

import { encodeWav } from "@/lib/wavEncoder";
import {
  RECORDING_LIST_KEY,
  expiresAtFrom,
  recordingKey,
} from "@/lib/recordingUtils";
import type { Recording } from "@/types";

// Continuously captures mic PCM into a fixed-duration ring buffer so the user
// can save "the last N seconds" at any moment. Capture and persistence (the
// impure parts) live here;

const PROCESSOR_BUFFER_SIZE = 4096;

function generateId(): string {
  return `${Date.now().toString()}-${Math.random().toString(36).slice(2, 11)}`;
}

type RecordingBufferResult = {
  readonly saveRecording: () => Promise<string | null>;
};

export function useRecordingBuffer(
  stream: MediaStream | null,
  bufferDurationSeconds: number,
): RecordingBufferResult {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Ring buffer: a list of PCM chunks plus a running sample count so old chunks
  // can be dropped once the buffered duration exceeds the limit.
  const chunksRef = useRef<Float32Array[]>([]);
  const totalSamplesRef = useRef(0);
  const sampleRateRef = useRef(44100);
  const maxSamplesRef = useRef(0);

  useEffect(() => {
    if (!stream) {
      chunksRef.current = [];
      totalSamplesRef.current = 0;
      return;
    }

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    sampleRateRef.current = audioContext.sampleRate;
    maxSamplesRef.current = bufferDurationSeconds * audioContext.sampleRate;

    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;

    const processor = audioContext.createScriptProcessor(
      PROCESSOR_BUFFER_SIZE,
      1,
      1,
    );
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      // The browser reuses the input buffer next frame, so copy it.
      const copy = new Float32Array(input.length);
      copy.set(input);

      chunksRef.current.push(copy);
      totalSamplesRef.current += copy.length;

      // Drop oldest chunks until back under the duration limit.
      while (
        totalSamplesRef.current > maxSamplesRef.current &&
        chunksRef.current.length > 0
      ) {
        const removed = chunksRef.current.shift();
        if (removed) totalSamplesRef.current -= removed.length;
      }
    };

    source.connect(processor);
    // ScriptProcessorNode only runs while connected to the destination; route
    // it through a muted gain node so capture works without audible feedback.
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    processor.connect(silentGain);
    silentGain.connect(audioContext.destination);

    return () => {
      processor.disconnect();
      silentGain.disconnect();
      source.disconnect();
      void audioContext.close();
    };
  }, [stream, bufferDurationSeconds]);

  const saveRecording = useCallback(async (): Promise<string | null> => {
    const chunks = chunksRef.current;
    if (chunks.length === 0) return null;

    // Flatten the ring buffer into one contiguous PCM array.
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const sampleRate = sampleRateRef.current;
    const audioBlob = new Blob([encodeWav(combined, sampleRate)], {
      type: "audio/wav",
    });

    const now = Date.now();
    const id = generateId();
    const recording: Recording = {
      id,
      createdAt: now,
      expiresAt: expiresAtFrom(now),
      duration: totalLength / sampleRate,
      mimeType: "audio/wav",
      audioBlob,
      pitchData: [],
    };

    try {
      await set(recordingKey(id), recording);
      const list = (await get<string[]>(RECORDING_LIST_KEY)) ?? [];
      await set(RECORDING_LIST_KEY, [...list, id]);
      return id;
    } catch {
      // Storage may be unavailable (private mode / quota); fail soft.
      return null;
    }
  }, []);

  return { saveRecording };
}
