import { useReducer, useEffect, useCallback } from 'react';
import {
  audioEngine,
  AudioSettings,
  AmbientSoundType,
  loadAudioSettings,
  DEFAULT_AUDIO_SETTINGS,
} from '../services/audioEngine';

export interface SoundMachineState extends AudioSettings {
  isPlayingAmbient: boolean;
}

export type SoundMachineEvent =
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_VOICE_ENABLED'; enabled: boolean }
  | { type: 'SET_BELL_ENABLED'; enabled: boolean }
  | { type: 'SET_AMBIENT_SOUND'; sound: AmbientSoundType }
  | { type: 'SET_AMBIENT_VOLUME'; volume: number }
  | { type: 'SET_MASTER_VOLUME'; volume: number }
  | { type: 'START_AMBIENT' }
  | { type: 'STOP_AMBIENT' };

export const initialSoundState: SoundMachineState = {
  ...DEFAULT_AUDIO_SETTINGS,
  isPlayingAmbient: false,
};

export function soundReducer(state: SoundMachineState, event: SoundMachineEvent): SoundMachineState {
  switch (event.type) {
    case 'TOGGLE_MUTE':
      return {
        ...state,
        isMuted: !state.isMuted,
      };

    case 'SET_VOICE_ENABLED':
      return {
        ...state,
        voiceEnabled: event.enabled,
      };

    case 'SET_BELL_ENABLED':
      return {
        ...state,
        bellEnabled: event.enabled,
      };

    case 'SET_AMBIENT_SOUND':
      return {
        ...state,
        ambientSound: event.sound,
      };

    case 'SET_AMBIENT_VOLUME':
      return {
        ...state,
        ambientVolume: Math.max(0, Math.min(1, event.volume)),
      };

    case 'SET_MASTER_VOLUME':
      return {
        ...state,
        masterVolume: Math.max(0, Math.min(1, event.volume)),
      };

    case 'START_AMBIENT':
      return {
        ...state,
        isPlayingAmbient: true,
      };

    case 'STOP_AMBIENT':
      return {
        ...state,
        isPlayingAmbient: false,
      };

    default:
      return state;
  }
}

export function useSoundMachine() {
  const [state, dispatch] = useReducer(soundReducer, {
    ...loadAudioSettings(),
    isPlayingAmbient: false,
  });

  // Sync state changes with audioEngine
  useEffect(() => {
    audioEngine.updateSettings({
      isMuted: state.isMuted,
      voiceEnabled: state.voiceEnabled,
      bellEnabled: state.bellEnabled,
      ambientSound: state.ambientSound,
      ambientVolume: state.ambientVolume,
      masterVolume: state.masterVolume,
    });
  }, [
    state.isMuted,
    state.voiceEnabled,
    state.bellEnabled,
    state.ambientSound,
    state.ambientVolume,
    state.masterVolume,
  ]);

  const toggleMute = useCallback(() => {
    dispatch({ type: 'TOGGLE_MUTE' });
  }, []);

  const setVoiceEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_VOICE_ENABLED', enabled });
  }, []);

  const setBellEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_BELL_ENABLED', enabled });
  }, []);

  const setAmbientSound = useCallback((sound: AmbientSoundType) => {
    dispatch({ type: 'SET_AMBIENT_SOUND', sound });
    if (state.isPlayingAmbient) {
      audioEngine.startAmbient(sound);
    }
  }, [state.isPlayingAmbient]);

  const setAmbientVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_AMBIENT_VOLUME', volume });
  }, []);

  const startAmbient = useCallback(async () => {
    await audioEngine.resume();
    audioEngine.startAmbient(state.ambientSound);
    dispatch({ type: 'START_AMBIENT' });
  }, [state.ambientSound]);

  const stopAmbient = useCallback(() => {
    audioEngine.stopAmbient();
    dispatch({ type: 'STOP_AMBIENT' });
  }, []);

  const triggerPhaseCue = useCallback((phase: 'inhale' | 'hold' | 'exhale' | 'holdPost') => {
    audioEngine.playSingingBowl(432);
    audioEngine.speakPhaseCue(phase);
  }, []);

  return {
    state,
    isMuted: state.isMuted,
    voiceEnabled: state.voiceEnabled,
    bellEnabled: state.bellEnabled,
    ambientSound: state.ambientSound,
    ambientVolume: state.ambientVolume,
    isPlayingAmbient: state.isPlayingAmbient,
    toggleMute,
    setVoiceEnabled,
    setBellEnabled,
    setAmbientSound,
    setAmbientVolume,
    startAmbient,
    stopAmbient,
    triggerPhaseCue,
  };
}
