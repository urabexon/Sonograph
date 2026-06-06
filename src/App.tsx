import { memo, useCallback, useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AboutDialog } from "@/components/AboutDialog";
import { ControlPanel } from "@/components/ControlPanel";
import { Header } from "@/components/Header";
import { MetronomeControls } from "@/components/MetronomeControls";
import { PitchInfo } from "@/components/PitchInfo";
import { ReferenceToneControls } from "@/components/ReferenceToneControls";
import { RecordingList } from "@/components/RecordingList";
import { SettingsDialog } from "@/components/SettingsDialog";
import { StartOverlay } from "@/components/StartOverlay";
import { Toaster } from "@/components/ui/sonner";
import { TunerDisplay } from "@/components/TunerDisplay";
import { VolumeLevel } from "@/components/VolumeLevel";
import { RECORDING_DURATION_PRESETS } from "@/constants/audio";
import {
  useAudioControls,
  useAudioStream,
  useIsActive,
  useNoiseGateEffect,
  usePitchData,
  useVolumeLevelData,
} from "@/hooks/useAudioCapture";
import { useMicrophoneDevices } from "@/hooks/useMicrophoneDevices";
import { useRecordingBuffer } from "@/hooks/useRecordingBuffer";
import { useRecordingStorage } from "@/hooks/useRecordingStorage";
import { useSettings } from "@/hooks/useSettings";
import { solfegeVariantForLanguage } from "@/lib/noteUtils";

const PitchInfoContainer = memo(function PitchInfoContainer() {
  const { currentPitch } = usePitchData();
  const { state } = useSettings();
  const { i18n } = useTranslation();
  return (
    <PitchInfo
      pitch={currentPitch}
      notation={state.notation}
      accidental={state.accidental}
      tuningOptions={state.advanced}
      centThreshold={state.advanced.centThreshold}
      solfegeVariant={solfegeVariantForLanguage(i18n.language)}
    />
  );
});

const VolumeLevelContainer = memo(function VolumeLevelContainer() {
  const volumeLevel = useVolumeLevelData();
  return <VolumeLevel volume={volumeLevel} />;
});

const TunerDisplayContainer = memo(function TunerDisplayContainer() {
  const { pitchHistory, timestamp } = usePitchData();
  const { state } = useSettings();
  const { i18n } = useTranslation();
  return (
    <TunerDisplay
      pitchHistory={pitchHistory}
      now={timestamp}
      notation={state.notation}
      accidental={state.accidental}
      solfegeVariant={solfegeVariantForLanguage(i18n.language)}
    />
  );
});

function App() {
  const { t } = useTranslation();
  const { state, update } = useSettings();
  const isActive = useIsActive();
  const { startAudio, stopAudio } = useAudioControls();

  // Push the noise gate (lives outside React state) into the audio pipeline
  useNoiseGateEffect(state.advanced.noiseGateThreshold);

  const autoStartRef = useRef(state.autoStart);
  const didAutoStart = useRef(false);
  useEffect(() => {
    if (didAutoStart.current) return;
    didAutoStart.current = true;
    if (autoStartRef.current) void startAudio();
  }, [startAudio]);

  const { devices, isLoading, error, refreshDevices } = useMicrophoneDevices();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [recordingsOpen, setRecordingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userPickedDeviceId, setUserPickedDeviceId] = useState("");
  const stream = useAudioStream();
  const { saveRecording } = useRecordingBuffer(stream, state.recordingDuration);
  const {
    recordings,
    isConverting,
    refresh,
    deleteRecording,
    downloadRecording,
    playRecording,
    stopPlayback,
    seek,
    playingId,
    playbackTime,
    playbackDuration,
  } = useRecordingStorage();
  // Auto-pick the first available device until the user explicitly chooses one
  const selectedDeviceId = userPickedDeviceId || devices[0]?.deviceId || "";

  const handleStart = useCallback(() => {
    void startAudio(selectedDeviceId || undefined);
  }, [startAudio, selectedDeviceId]);

  const handleStop = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

  const handleDeviceChange = useCallback(
    (deviceId: string) => {
      setUserPickedDeviceId(deviceId);
      if (isActive) {
        void startAudio(deviceId);
      }
    },
    [isActive, startAudio],
  );

  const handleRefreshDevices = useCallback(() => {
    void refreshDevices();
  }, [refreshDevices]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const id = await saveRecording();
      if (id) {
        await refresh();
        toast.success(t("toast.saveSuccess"));
      } else {
        toast.error(t("toast.saveEmpty"));
      }
    } catch {
      toast.error(t("toast.saveError"));
    } finally {
      setIsSaving(false);
    }
  }, [saveRecording, refresh, t]);

  const handleDelete = useCallback(
    async (id: string) => {
      const ok = await deleteRecording(id);
      toast[ok ? "success" : "error"](
        t(ok ? "toast.deleteSuccess" : "toast.deleteError"),
      );
    },
    [deleteRecording, t],
  );

  const handleDownload = useCallback(
    async (id: string, format: Parameters<typeof downloadRecording>[1]) => {
      const ok = await downloadRecording(id, format);
      toast[ok ? "success" : "error"](
        t(ok ? "toast.downloadStarted" : "toast.downloadError"),
      );
    },
    [downloadRecording, t],
  );

  // Refresh the list right as the dialog opens
  const handleOpenRecordings = useCallback(() => {
    void refresh();
    setRecordingsOpen(true);
  }, [refresh]);

  const handleDurationChange = useCallback(
    (seconds: number) => {
      update((draft) => {
        draft.recordingDuration = seconds;
      });
    },
    [update],
  );

  return (
    <>
      <div className="min-h-svh flex flex-col bg-background text-foreground">
        <Header
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenRecordings={handleOpenRecordings}
          onOpenAbout={() => setAboutOpen(true)}
        />
        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
        <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
        <RecordingList
          open={recordingsOpen}
          onClose={() => setRecordingsOpen(false)}
          recordings={recordings}
          onDelete={(id) => void handleDelete(id)}
          onDownload={(id, format) => void handleDownload(id, format)}
          onPlay={(id) => void playRecording(id)}
          onStop={stopPlayback}
          onSeek={seek}
          playingId={playingId}
          playbackTime={playbackTime}
          playbackDuration={playbackDuration}
          isConverting={isConverting}
          defaultFormat={state.audioFormat}
        />
        <main className="flex-1 flex flex-col p-4 gap-4 max-w-4xl mx-auto w-full">
          {isActive && (
            <>
              <PitchInfoContainer />
              <VolumeLevelContainer />
            </>
          )}
          <div className="relative flex-1 min-h-32">
            <TunerDisplayContainer />
            {!isActive && (
              <StartOverlay
                onStart={handleStart}
                devices={devices}
                selectedDeviceId={selectedDeviceId}
                onDeviceChange={handleDeviceChange}
                onRefreshDevices={handleRefreshDevices}
                isLoading={isLoading}
                error={error}
              />
            )}
          </div>
          {isActive && (
            <ControlPanel
              onStop={handleStop}
              onSave={() => void handleSave()}
              isSaving={isSaving}
              recordingDuration={state.recordingDuration}
              durationPresets={RECORDING_DURATION_PRESETS}
              onDurationChange={handleDurationChange}
            />
          )}
          <MetronomeControls />
          <ReferenceToneControls
            initialFrequency={state.advanced.referenceFrequency}
          />
        </main>
      </div>
      <Toaster position="bottom-center" />
    </>
  );
}

export default App;
