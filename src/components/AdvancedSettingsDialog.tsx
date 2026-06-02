import { memo, useCallback } from "react";

import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useSettings } from "@/hooks/useSettings";
import {
  DEFAULT_ADVANCED_SETTINGS,
  type Temperament,
  type Transposition,
} from "@/types";

type AdvancedSettingsDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
};

// Concert-pitch reference presets shown as quick-pick chips.
const FREQUENCY_PRESETS = [415, 440, 442, 443, 444] as const;

const TRANSPOSITIONS: readonly Transposition[] = [
  "C",
  "Bb",
  "Eb",
  "F",
  "G",
  "A",
];
const TEMPERAMENTS: readonly Temperament[] = ["equal", "just"];

const NOISE_GATE_SCALE = 1000;

export const AdvancedSettingsDialog = memo(function AdvancedSettingsDialog({
  open,
  onClose,
}: AdvancedSettingsDialogProps) {
  const { t } = useTranslation();
  const { state, update } = useSettings();
  const { advanced } = state;

  const handleReferenceFrequency = useCallback(
    (value: number) => {
      update((draft) => {
        draft.advanced.referenceFrequency = value;
      });
    },
    [update],
  );

  const handleTransposition = useCallback(
    (value: string) => {
      update((draft) => {
        draft.advanced.transposition = value as Transposition;
      });
    },
    [update],
  );

  const handleCentThreshold = useCallback(
    (value: number) => {
      update((draft) => {
        draft.advanced.centThreshold = value;
      });
    },
    [update],
  );

  const handleTemperament = useCallback(
    (value: string) => {
      update((draft) => {
        draft.advanced.temperament = value as Temperament;
      });
    },
    [update],
  );

  const handleNoiseGate = useCallback(
    (sliderValue: number) => {
      update((draft) => {
        draft.advanced.noiseGateThreshold = sliderValue / NOISE_GATE_SCALE;
      });
    },
    [update],
  );

  const resetField = useCallback(
    (field: keyof typeof DEFAULT_ADVANCED_SETTINGS) => {
      update((draft) => {
        switch (field) {
          case "referenceFrequency":
            draft.advanced.referenceFrequency =
              DEFAULT_ADVANCED_SETTINGS.referenceFrequency;
            break;
          case "centThreshold":
            draft.advanced.centThreshold =
              DEFAULT_ADVANCED_SETTINGS.centThreshold;
            break;
          case "noiseGateThreshold":
            draft.advanced.noiseGateThreshold =
              DEFAULT_ADVANCED_SETTINGS.noiseGateThreshold;
            break;
          case "transposition":
            draft.advanced.transposition =
              DEFAULT_ADVANCED_SETTINGS.transposition;
            break;
          case "temperament":
            draft.advanced.temperament = DEFAULT_ADVANCED_SETTINGS.temperament;
            break;
        }
      });
    },
    [update],
  );

  const noiseGateSliderValue = Math.round(
    advanced.noiseGateThreshold * NOISE_GATE_SCALE,
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("settings.advanced.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t("settings.advanced.referenceFrequency.label")}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetField("referenceFrequency")}
                className="h-6 px-2 text-xs"
                disabled={
                  advanced.referenceFrequency ===
                  DEFAULT_ADVANCED_SETTINGS.referenceFrequency
                }
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {t("settings.advanced.reset")}
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                value={[advanced.referenceFrequency]}
                onValueChange={(values) => {
                  if (values[0] !== undefined)
                    handleReferenceFrequency(values[0]);
                }}
                min={400}
                max={480}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-mono w-16 text-right">
                {advanced.referenceFrequency} Hz
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {FREQUENCY_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant={
                    advanced.referenceFrequency === preset
                      ? "secondary"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleReferenceFrequency(preset)}
                  className="text-xs h-7"
                >
                  {preset}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("settings.advanced.referenceFrequency.hint")}
            </p>
          </div>

          <div className="space-y-3">
            <Label>{t("settings.advanced.transposition.label")}</Label>
            <Select
              value={advanced.transposition}
              onValueChange={handleTransposition}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSPOSITIONS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`settings.advanced.transposition.options.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("settings.advanced.transposition.hint")}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t("settings.advanced.centThreshold.label")}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetField("centThreshold")}
                className="h-6 px-2 text-xs"
                disabled={
                  advanced.centThreshold ===
                  DEFAULT_ADVANCED_SETTINGS.centThreshold
                }
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {t("settings.advanced.reset")}
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                value={[advanced.centThreshold]}
                onValueChange={(values) => {
                  if (values[0] !== undefined) handleCentThreshold(values[0]);
                }}
                min={1}
                max={50}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-mono w-20 text-right">
                ±{advanced.centThreshold} cents
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("settings.advanced.centThreshold.hint")}
            </p>
          </div>

          <div className="space-y-3">
            <Label>{t("settings.advanced.temperament.label")}</Label>
            <RadioGroup
              value={advanced.temperament}
              onValueChange={handleTemperament}
              className="flex flex-col gap-2"
            >
              {TEMPERAMENTS.map((key) => (
                <div key={key} className="flex items-center space-x-2">
                  <RadioGroupItem value={key} id={`temperament-${key}`} />
                  <Label
                    htmlFor={`temperament-${key}`}
                    className="cursor-pointer"
                  >
                    {t(`settings.advanced.temperament.options.${key}`)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              {t("settings.advanced.temperament.hint")}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t("settings.advanced.noiseGate.label")}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetField("noiseGateThreshold")}
                className="h-6 px-2 text-xs"
                disabled={
                  advanced.noiseGateThreshold ===
                  DEFAULT_ADVANCED_SETTINGS.noiseGateThreshold
                }
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {t("settings.advanced.reset")}
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                value={[noiseGateSliderValue]}
                onValueChange={(values) => {
                  if (values[0] !== undefined) handleNoiseGate(values[0]);
                }}
                min={1}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-mono w-12 text-right">
                {noiseGateSliderValue}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("settings.advanced.noiseGate.hint")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
