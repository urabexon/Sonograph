import { memo } from "react";

import { Play, Square } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  BPM_MAX,
  BPM_MIN,
  METRONOME_BEATS_PER_MEASURE,
  VOLUME_MAX,
  VOLUME_MIN,
} from "@/constants/audio";
import { useMetronomeBeat, useMetronomeControl } from "@/hooks/useMetronome";

const BeatIndicator = memo(function BeatIndicator() {
  const beat = useMetronomeBeat();
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: METRONOME_BEATS_PER_MEASURE }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full transition-colors ${
            beat === i ? "bg-green-500" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
});

export function MetronomeControls() {
  const { t } = useTranslation();
  const { isPlaying, bpm, volume, setBpm, setVolume, toggle } =
    useMetronomeControl();

  const commitBpm = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) setBpm(parsed);
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("metronome.title")}</span>
          <BeatIndicator />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={isPlaying ? "secondary" : "default"}
            onClick={toggle}
          >
            {isPlaying ? <Square /> : <Play />}
            {isPlaying ? t("metronome.stop") : t("metronome.start")}
          </Button>
          <div className="flex items-baseline gap-1">
            <Input
              key={bpm}
              type="number"
              defaultValue={bpm}
              min={BPM_MIN}
              max={BPM_MAX}
              onBlur={(e) => commitBpm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-20 font-mono"
              aria-label={t("metronome.bpm")}
            />
            <span className="text-xs text-muted-foreground">
              {t("metronome.bpm")}
            </span>
          </div>
        </div>
        <Slider
          value={[bpm]}
          onValueChange={(values) => {
            if (values[0] !== undefined) setBpm(values[0]);
          }}
          min={BPM_MIN}
          max={BPM_MAX}
          step={1}
          aria-label={t("metronome.bpm")}
        />
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {t("metronome.volume")}
          </Label>
          <Slider
            value={[volume]}
            onValueChange={(values) => {
              if (values[0] !== undefined) setVolume(values[0]);
            }}
            min={VOLUME_MIN}
            max={VOLUME_MAX}
            step={0.01}
            aria-label={t("metronome.volume")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
