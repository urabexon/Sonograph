import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { produce, type WritableDraft } from "immer";

import { sanitizeSettings } from "@/lib/settingsUtils";
import { DEFAULT_SETTINGS, type Settings } from "@/types";

const STORAGE_KEY = "sonograph-settings";

// --- Impure localStorage boundary -------------------------------------------
// I/O lives here in the hook (excluded from coverage). Validation is delegated
// to the pure `sanitizeSettings` in src/lib so it can be unit tested.

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return DEFAULT_SETTINGS;
    return sanitizeSettings(JSON.parse(stored) as unknown);
  } catch {
    // Corrupt JSON or unavailable storage: fall back to defaults.
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage may be full or disabled (private mode): ignore.
  }
}

type SettingsContextValue = {
  readonly state: Settings;
  // Immer-based update: mutate the draft, persistence happens automatically.
  readonly update: (updater: (draft: WritableDraft<Settings>) => void) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

type SettingsProviderProps = {
  readonly children: ReactNode;
};

export function SettingsProvider({ children }: SettingsProviderProps) {
  // Load lazily on first render so localStorage is read only once.
  const [state, setState] = useState<Settings>(loadSettings);

  const update = useCallback(
    (updater: (draft: WritableDraft<Settings>) => void) => {
      setState((current) => {
        const next = produce(current, updater);
        // Persist synchronously with the state change (no useEffect needed).
        saveSettings(next);
        return next;
      });
    },
    [],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({ state, update }),
    [state, update],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (context === null) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
