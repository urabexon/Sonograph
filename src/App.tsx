import { useCallback } from "react";

import { ControlPanel } from "@/components/ControlPanel";
import { Header } from "@/components/Header";
import { PitchInfo } from "@/components/PitchInfo";
import { StartOverlay } from "@/components/StartOverlay";
import { ThemeProvider } from "@/components/theme-provider";
import { VolumeLevel } from "@/components/VolumeLevel";
import {
  useAudioControls,
  useIsActive,
  usePitchData,
  useVolumeLevelData,
} from "@/hooks/useAudioCapture";

function App() {
  const isActive = useIsActive();
  const { startAudio, stopAudio } = useAudioControls();
  const { currentPitch } = usePitchData();
  const volumeLevel = useVolumeLevelData();

  const handleStart = useCallback(() => {
    void startAudio();
  }, [startAudio]);

  const handleStop = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-svh flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 flex flex-col p-4 gap-4 max-w-4xl mx-auto w-full">
          {isActive && (
            <>
              <PitchInfo pitch={currentPitch} />
              <VolumeLevel volume={volumeLevel} />
            </>
          )}

          <div className="relative flex-1 min-h-32">
            {/* TunerDisplay placeholder */}
            <div className="absolute inset-0 rounded-md border flex items-center justify-center text-sm text-muted-foreground">
              TunerDisplay
            </div>
            {!isActive && <StartOverlay onStart={handleStart} />}
          </div>

          {isActive && <ControlPanel onStop={handleStop} />}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
