import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@chipsociety_sound_settings';

interface SoundSettings {
  masterVolume:   number;
  effectsVolume:  number;
  isMuted:        boolean;
  isVibrationEnabled: boolean;
  musicVolume:    number;
  isMusicMuted:   boolean;
}

interface SoundContextValue extends SoundSettings {
  setMasterVolume:  (v: number) => void;
  setEffectsVolume: (v: number) => void;
  toggleMute:       () => void;
  toggleVibration:  () => void;
  setMusicVolume:   (v: number) => void;
  toggleMusicMute:  () => void;
  effectiveVolume:  number;
}

const DEFAULT: SoundSettings = {
  masterVolume:       0.80,
  effectsVolume:      0.90,
  isMuted:            false,
  isVibrationEnabled: true,
  musicVolume:        0.40,
  isMusicMuted:       false,
};

const SoundContext = createContext<SoundContextValue>({
  ...DEFAULT,
  setMasterVolume:  () => {},
  setEffectsVolume: () => {},
  toggleMute:       () => {},
  toggleVibration:  () => {},
  setMusicVolume:   () => {},
  toggleMusicMute:  () => {},
  effectiveVolume:  DEFAULT.masterVolume * DEFAULT.effectsVolume,
});

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<SoundSettings>;
          setSettings(s => ({ ...s, ...parsed }));
        } catch {}
      }
      loaded.current = true;
    });
  }, []);

  const save = useCallback((next: SoundSettings) => {
    if (loaded.current) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    }
  }, []);

  const setMasterVolume = useCallback((v: number) => {
    setSettings(s => { const n = { ...s, masterVolume:  Math.max(0, Math.min(1, v)) }; save(n); return n; });
  }, [save]);

  const setEffectsVolume = useCallback((v: number) => {
    setSettings(s => { const n = { ...s, effectsVolume: Math.max(0, Math.min(1, v)) }; save(n); return n; });
  }, [save]);

  const toggleMute = useCallback(() => {
    setSettings(s => { const n = { ...s, isMuted: !s.isMuted }; save(n); return n; });
  }, [save]);

  const toggleVibration = useCallback(() => {
    setSettings(s => { const n = { ...s, isVibrationEnabled: !s.isVibrationEnabled }; save(n); return n; });
  }, [save]);

  const setMusicVolume = useCallback((v: number) => {
    setSettings(s => { const n = { ...s, musicVolume: Math.max(0, Math.min(1, v)) }; save(n); return n; });
  }, [save]);

  const toggleMusicMute = useCallback(() => {
    setSettings(s => { const n = { ...s, isMusicMuted: !s.isMusicMuted }; save(n); return n; });
  }, [save]);

  const effectiveVolume = settings.isMuted
    ? 0
    : settings.masterVolume * settings.effectsVolume;

  return (
    <SoundContext.Provider value={{
      ...settings,
      setMasterVolume,
      setEffectsVolume,
      toggleMute,
      toggleVibration,
      setMusicVolume,
      toggleMusicMute,
      effectiveVolume,
    }}>
      {children}
    </SoundContext.Provider>
  );
}

export const useSoundSettings = () => useContext(SoundContext);
