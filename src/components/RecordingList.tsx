import { memo, useMemo } from "react";

import {
  ChevronDown,
  Download,
  Loader2,
  Play,
  Square,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { formatDuration, timeRemaining } from "@/lib/recordingUtils";
import type { AudioFormat, RecordingMeta } from "@/types";
import { getSupportedFormats } from "@/utils/audioConverter";

type RecordingListProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly recordings: readonly RecordingMeta[];
  readonly onDelete: (id: string) => void;
  readonly onDownload: (id: string, format: AudioFormat) => void;
  readonly onPlay: (id: string) => void;
  readonly onStop: () => void;
  readonly onSeek: (time: number) => void;
  readonly playingId: string | null;
  readonly playbackTime: number;
  readonly playbackDuration: number;
  readonly isConverting: boolean;
  readonly defaultFormat: AudioFormat;
};

export const RecordingList = memo(function RecordingList({
  open,
  onClose,
  recordings,
  onDelete,
  onDownload,
  onPlay,
  onStop,
  onSeek,
  playingId,
  playbackTime,
  playbackDuration,
  isConverting,
  defaultFormat,
}: RecordingListProps) {
  const { t, i18n } = useTranslation();
  const formats = useMemo(() => getSupportedFormats(), []);
  const now = Date.now();

  const formatDate = (timestamp: number): string =>
    new Date(timestamp).toLocaleString(i18n.language, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const remainingText = (expiresAt: number): string => {
    const remaining = timeRemaining(expiresAt, now);
    switch (remaining.kind) {
      case "expired":
        return t("recordings.remaining.expired");
      case "days":
        return t("recordings.remaining.days", { count: remaining.value });
      case "hours":
        return t("recordings.remaining.hours", { count: remaining.value });
      case "soon":
        return t("recordings.remaining.soon");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("recordings.title")}</DialogTitle>
          <DialogDescription>{t("recordings.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {recordings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("recordings.empty")}
            </div>
          ) : (
            <div className="space-y-2">
              {recordings.map((recording) => {
                const isPlaying = playingId === recording.id;
                const trackMax =
                  isPlaying && Number.isFinite(playbackDuration)
                    ? playbackDuration
                    : recording.duration;
                return (
                  <div
                    key={recording.id}
                    className="bg-muted rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {formatDate(recording.createdAt)}
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>{formatDuration(recording.duration)}</span>
                          <span className="text-yellow-500">
                            {remainingText(recording.expiresAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isPlaying ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={onStop}
                            aria-label={t("recordings.stop")}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onPlay(recording.id)}
                            aria-label={t("recordings.play")}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <div className="flex">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isConverting}
                            onClick={() =>
                              onDownload(recording.id, defaultFormat)
                            }
                            aria-label={t("recordings.download")}
                            className="rounded-r-none border-r border-border/50"
                          >
                            {isConverting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={isConverting}
                                className="rounded-l-none px-1.5"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {formats.map((format) => (
                                <DropdownMenuItem
                                  key={format}
                                  onClick={() =>
                                    onDownload(recording.id, format)
                                  }
                                >
                                  {t(`recordings.format.${format}`)}
                                  {format === defaultFormat && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      {t("recordings.defaultBadge")}
                                    </span>
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(recording.id)}
                          aria-label={t("recordings.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {formatDuration(isPlaying ? playbackTime : 0)}
                      </span>
                      <Slider
                        min={0}
                        max={trackMax}
                        step={0.1}
                        value={[isPlaying ? playbackTime : 0]}
                        onValueChange={(values) => {
                          if (values[0] !== undefined) onSeek(values[0]);
                        }}
                        disabled={!isPlaying}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-10">
                        {formatDuration(trackMax)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
