import type { ChannelVolume, VolumeLevelData } from "@/types";

const MIN_DB = -60;
const MAX_DB = 0;

function normalizeDb(db: number): number {
  const clamped = Math.max(MIN_DB, Math.min(MAX_DB, db));
  return (clamped - MIN_DB) / (MAX_DB - MIN_DB);
}

const GAUGE_GRADIENT =
  "linear-gradient(to right, #22c55e 0%, #22c55e 60%, #eab308 75%, #ef4444 90%, #ef4444 100%)";

function formatDb(db: number): string {
  const clamped = Math.max(MIN_DB, db);
  return clamped.toFixed(1).padStart(5, " ");
}

type ChannelGaugeProps = {
  readonly label: string;
  readonly channel: ChannelVolume;
  readonly thick?: boolean;
};

function ChannelGauge({ label, channel, thick = false }: ChannelGaugeProps) {
  const level = normalizeDb(channel.dB);
  const peakLevel = normalizeDb(channel.peakDb);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-4 shrink-0">
        {label}
      </span>
      <div
        className={`relative flex-1 ${thick ? "h-5" : "h-4"} bg-muted rounded overflow-hidden`}
      >
        {/* Faded gradient background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: GAUGE_GRADIENT }}
        />
        {/* Live level bar */}
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-75"
          style={{ width: `${level * 100}%`, background: GAUGE_GRADIENT }}
        />
        {/* Peak indicator */}
        <div
          className="absolute inset-y-0 w-0.5 bg-white/80 transition-[left] duration-75"
          style={{ left: `${peakLevel * 100}%` }}
        />
        {/* dB scale markings */}
        <div className="absolute inset-0 flex items-center justify-between px-1">
          {[-60, -40, -20, 0].map((db) => (
            <span
              key={db}
              className="text-[8px] text-white/50 mix-blend-difference"
            >
              {db}
            </span>
          ))}
        </div>
      </div>
      <span className="text-xs font-mono tabular-nums w-20 text-right shrink-0 whitespace-pre">
        {formatDb(channel.dB)} dBFS
      </span>
    </div>
  );
}

type VolumeLevelProps = {
  readonly volume: VolumeLevelData | null;
};

const EMPTY_CHANNEL: ChannelVolume = {
  rms: 0,
  dB: MIN_DB,
  peak: 0,
  peakDb: MIN_DB,
};

export function VolumeLevel({ volume }: VolumeLevelProps) {
  if (!volume) {
    return (
      <div className="space-y-1 opacity-50">
        <ChannelGauge label="L" channel={EMPTY_CHANNEL} />
        <ChannelGauge label="R" channel={EMPTY_CHANNEL} />
      </div>
    );
  }

  if (volume.isStereo) {
    return (
      <div className="space-y-1">
        <ChannelGauge label="L" channel={volume.left} />
        <ChannelGauge label="R" channel={volume.right} />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <ChannelGauge label="M" channel={volume.mono} thick />
    </div>
  );
}
