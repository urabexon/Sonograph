import { Play, Square } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { VOLUME_MAX, VOLUME_MIN } from "@/constants/audio";
import {
  WAVEFORM_TYPES,
  useReferenceSound,
  type WaveformType,
} from "@/hooks/useReferenceSound";

type ReferenceToneControlsProps = {
  readonly initialFrequency: number;
};

export function ReferenceToneControls({
  initialFrequency,
}: ReferenceToneControlsProps) {
  const { t } = useTranslation();
  const {
    isPlaying,
    frequency,
    waveform,
    volume,
    setFrequency,
    setWaveform,
    setVolume,
    toggle,
  } = useReferenceSound(initialFrequency);

  const commitFrequency = (raw: string) => {
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed) && parsed > 0) setFrequency(parsed);
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <span className="text-sm font-medium">{t("reference.title")}</span>
        <div className="flex items-center gap-3">
          <Button
            variant={isPlaying ? "secondary" : "default"}
            onClick={toggle}
          >
            {isPlaying ? <Square /> : <Play />}
            {isPlaying ? t("reference.stop") : t("reference.start")}
          </Button>
          <div className="flex items-baseline gap-1">
            <Input
              key={frequency}
              type="number"
              defaultValue={frequency}
              min={1}
              step="any"
              onBlur={(e) => commitFrequency(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-24 font-mono"
              aria-label={t("reference.frequency")}
            />
            <span className="text-xs text-muted-foreground">Hz</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {t("reference.waveform.label")}
          </Label>
          <Select
            value={waveform}
            onValueChange={(value) => setWaveform(value as WaveformType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WAVEFORM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`reference.waveform.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {t("reference.volume")}
          </Label>
          <Slider
            value={[volume]}
            onValueChange={(values) => {
              if (values[0] !== undefined) setVolume(values[0]);
            }}
            min={VOLUME_MIN}
            max={VOLUME_MAX}
            step={0.01}
            aria-label={t("reference.volume")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
