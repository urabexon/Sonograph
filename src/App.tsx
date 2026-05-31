import { useCallback } from "react";

import { Header } from "@/components/Header";
import { PitchInfo } from "@/components/PitchInfo";
import { StartOverlay } from "@/components/StartOverlay";
import { ThemeProvider } from "@/components/theme-provider";
import {
  useAudioControls,
  useIsActive,
  usePitchData,
} from "@/hooks/useAudioCapture";

function App() {
  const isActive = useIsActive();
  const { startAudio } = useAudioControls();
  const { currentPitch } = usePitchData();

  const handleStart = useCallback(() => {
    void startAudio();
  }, [startAudio]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-svh flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 flex flex-col p-4 gap-4 max-w-4xl mx-auto w-full">
          {isActive && (
            <>
              <PitchInfo pitch={currentPitch} />
              {/* VolumeLevel placeholder */}
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                VolumeLevel
              </div>
            </>
          )}

          <div className="relative flex-1 min-h-32">
            {/* TunerDisplay placeholder */}
            <div className="absolute inset-0 rounded-md border flex items-center justify-center text-sm text-muted-foreground">
              TunerDisplay
            </div>
            {!isActive && <StartOverlay onStart={handleStart} />}
          </div>

          {isActive && (
            /* ControlPanel placeholder */
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              ControlPanel
            </div>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
