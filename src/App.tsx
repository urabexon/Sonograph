import { memo, useCallback, useState } from "react";

import { ControlPanel } from "@/components/ControlPanel";
import { Header } from "@/components/Header";
import { PitchInfo } from "@/components/PitchInfo";
import { SettingsDialog } from "@/components/SettingsDialog";
import { StartOverlay } from "@/components/StartOverlay";
import { ThemeProvider } from "@/components/theme-provider";
import { TunerDisplay } from "@/components/TunerDisplay";
import { VolumeLevel } from "@/components/VolumeLevel";
import {
  useAudioControls,
  useIsActive,
  useNoiseGateEffect,
  usePitchData,
  useVolumeLevelData,
} from "@/hooks/useAudioCapture";
import { useMicrophoneDevices } from "@/hooks/useMicrophoneDevices";
import { SettingsProvider, useSettings } from "@/hooks/useSettings";

function SettingsAudioBridge() {
  const { state } = useSettings();
  useNoiseGateEffect(state.advanced.noiseGateThreshold);
  return null;
}

const PitchInfoContainer = memo(function PitchInfoContainer() {
  const { currentPitch } = usePitchData();
  const { state } = useSettings();
  return (
    <PitchInfo
      pitch={currentPitch}
      notation={state.notation}
      accidental={state.accidental}
      tuningOptions={state.advanced}
      centThreshold={state.advanced.centThreshold}
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
  return (
    <TunerDisplay
      pitchHistory={pitchHistory}
      now={timestamp}
      notation={state.notation}
      accidental={state.accidental}
    />
  );
});

function App() {
  const isActive = useIsActive();
  const { startAudio, stopAudio } = useAudioControls();

  const { devices, isLoading, error, refreshDevices } = useMicrophoneDevices();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userPickedDeviceId, setUserPickedDeviceId] = useState("");
  // Auto-pick the first available device until the user explicitly chooses one.
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

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SettingsProvider>
        <SettingsAudioBridge />
        <div className="min-h-svh flex flex-col bg-background text-foreground">
          <Header onOpenSettings={() => setSettingsOpen(true)} />
          <SettingsDialog
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
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

            {isActive && <ControlPanel onStop={handleStop} />}
          </main>
        </div>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
