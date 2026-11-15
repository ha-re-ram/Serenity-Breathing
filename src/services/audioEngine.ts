/**
 * Professional Web Audio API & Speech Synthesis Engine for Serenity Breathing.
 * Provides:
 * 1. Procedural ambient soundscapes (Zen Singing Bowl Drone 432Hz, Ocean Waves, Gentle Rain).
 * 2. Tibetan singing bowl harmonic chime for phase transitions.
 * 3. Soothing spoken voice guidance ("Breathe in", "Hold", "Breathe out", "Hold").
 * 4. Master volume and mute control with offline compatibility and zero external asset dependencies.
 */

export type AmbientSoundType = 'none' | 'bowl' | 'ocean' | 'rain';

export interface AudioSettings {
  isMuted: boolean;
  voiceEnabled: boolean;
  bellEnabled: boolean;
  ambientSound: AmbientSoundType;
  ambientVolume: number; // 0.0 to 1.0
  masterVolume: number;  // 0.0 to 1.0
}

const STORAGE_KEY = 'serenity_audio_settings';

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  isMuted: false,
  voiceEnabled: true,
  bellEnabled: true,
  ambientSound: 'bowl',
  ambientVolume: 0.35,
  masterVolume: 0.8,
};

export function loadAudioSettings(): AudioSettings {
  if (typeof window === 'undefined') return DEFAULT_AUDIO_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AUDIO_SETTINGS;
    return { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function saveAudioSettings(settings: AudioSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private currentAmbientNodes: { stop: () => void } | null = null;
  private settings: AudioSettings = DEFAULT_AUDIO_SETTINGS;

  constructor() {
    this.settings = loadAudioSettings();
  }

  private initContext() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.settings.isMuted ? 0 : this.settings.masterVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Ambient Sub-Gain
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(this.settings.ambientVolume, this.ctx.currentTime);
    this.ambientGain.connect(this.masterGain);

    // SFX Sub-Gain
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);
  }

  public async resume(): Promise<void> {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // Autoplay policy fallback
      }
    }
  }

  /**
   * Synchronously unlocks Web Audio context on iOS Safari & mobile browsers
   * during a direct user click/touch gesture.
   */
  public unlock() {
    this.initContext();
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      try {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
      } catch {
        // Safe fallback
      }
    }
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...partial };
    saveAudioSettings(this.settings);

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(
        this.settings.isMuted ? 0 : this.settings.masterVolume,
        now,
        0.05
      );
    }

    if (this.ctx && this.ambientGain) {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.setTargetAtTime(this.settings.ambientVolume, now, 0.05);
    }

    if (partial.ambientSound !== undefined) {
      if (this.currentAmbientNodes) {
        this.startAmbient(this.settings.ambientSound);
      }
    }
  }

  public toggleMute(): boolean {
    const nextMuted = !this.settings.isMuted;
    this.updateSettings({ isMuted: nextMuted });
    return nextMuted;
  }

  /**
   * Plays a Tibetan singing bowl chime with Solfeggio harmonics (432Hz fundamental).
   */
  public playSingingBowl(freq = 432) {
    if (this.settings.isMuted || !this.settings.bellEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const harmonics = [
      { f: freq, gain: 0.6, decay: 3.5 },
      { f: freq * 2, gain: 0.25, decay: 2.5 },
      { f: freq * 3, gain: 0.12, decay: 1.8 },
      { f: freq * 4.1, gain: 0.05, decay: 1.2 },
    ];

    harmonics.forEach(({ f, gain, decay }) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      // Organic gentle vibrato
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(3.5, now);
      lfoGain.gain.setValueAtTime(1.2, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + decay);

      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(gain, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(g);
      g.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + decay);
    });
  }

  /**
   * Speaks the breathwork phase cue ("Breathe in", "Hold", "Breathe out", "Hold").
   */
  public speakPhaseCue(phase: 'inhale' | 'hold' | 'exhale' | 'holdPost') {
    if (this.settings.isMuted || !this.settings.voiceEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Cancel any overlapping utterance

      let phrase = 'Breathe in';
      if (phase === 'hold' || phase === 'holdPost') phrase = 'Hold';
      if (phase === 'exhale') phrase = 'Breathe out';

      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 0.85; // Relaxed, meditative pace
      utterance.pitch = 0.95;
      utterance.volume = this.settings.isMuted ? 0 : 0.9;

      // Select warm English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Karen') || v.lang.startsWith('en')) &&
          !v.name.includes('Zira')
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors
    }
  }

  /**
   * Starts ambient background soundscape.
   */
  public startAmbient(type: AmbientSoundType = this.settings.ambientSound) {
    this.stopAmbient();
    if (this.settings.isMuted || type === 'none') return;
    this.initContext();
    if (!this.ctx || !this.ambientGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (type === 'bowl') {
      this.currentAmbientNodes = this.createSingingBowlDrone();
    } else if (type === 'ocean') {
      this.currentAmbientNodes = this.createOceanWaves();
    } else if (type === 'rain') {
      this.currentAmbientNodes = this.createGentleRain();
    }
  }

  public stopAmbient() {
    if (this.currentAmbientNodes) {
      try {
        this.currentAmbientNodes.stop();
      } catch {
        // Safe cleanup
      }
      this.currentAmbientNodes = null;
    }
  }

  /**
   * Procedural Tibetan Singing Bowl Drone (432Hz harmonic meditation drone).
   */
  private createSingingBowlDrone(): { stop: () => void } {
    if (!this.ctx || !this.ambientGain) return { stop: () => {} };
    const now = this.ctx.currentTime;

    const freqs = [108, 216, 432, 436]; // Root, octave, 432Hz Solfeggio, subtle binaural beat
    const oscs: OscillatorNode[] = [];
    const droneGain = this.ctx.createGain();

    droneGain.gain.setValueAtTime(0.001, now);
    droneGain.gain.exponentialRampToValueAtTime(0.2, now + 1.5);
    droneGain.connect(this.ambientGain);

    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, now);

      // Subtle breath modulation
      const lfo = this.ctx.createOscillator();
      const lfoG = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.07 + idx * 0.02, now);
      lfoG.gain.setValueAtTime(2.0, now);
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);
      lfo.start(now);

      osc.connect(droneGain);
      osc.start(now);
      oscs.push(osc, lfo);
    });

    return {
      stop: () => {
        if (!this.ctx) return;
        droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4);
        setTimeout(() => {
          oscs.forEach((o) => {
            try {
              o.stop();
              o.disconnect();
            } catch {}
          });
        }, 1200);
      },
    };
  }

  /**
   * Procedural Ocean Waves (filtered pink noise modulated by rhythmic tides).
   */
  private createOceanWaves(): { stop: () => void } {
    if (!this.ctx || !this.ambientGain) return { stop: () => {} };
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pink noise generation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    // Modulation of wave rhythm (8s wave cycle matching deep breathing)
    const waveLfo = this.ctx.createOscillator();
    const waveDepth = this.ctx.createGain();
    waveLfo.frequency.setValueAtTime(0.125, this.ctx.currentTime); // ~8s cycle
    waveDepth.gain.setValueAtTime(280, this.ctx.currentTime);
    waveLfo.connect(waveDepth);
    waveDepth.connect(filter.frequency);

    const oceanGain = this.ctx.createGain();
    oceanGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    oceanGain.gain.exponentialRampToValueAtTime(0.35, this.ctx.currentTime + 1.5);

    whiteNoise.connect(filter);
    filter.connect(oceanGain);
    oceanGain.connect(this.ambientGain);

    whiteNoise.start();
    waveLfo.start();

    return {
      stop: () => {
        if (!this.ctx) return;
        oceanGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4);
        setTimeout(() => {
          try {
            whiteNoise.stop();
            waveLfo.stop();
            whiteNoise.disconnect();
          } catch {}
        }, 1200);
      },
    };
  }

  /**
   * Procedural Gentle Rain (filtered high-frequency pink noise).
   */
  private createGentleRain(): { stop: () => void } {
    if (!this.ctx || !this.ambientGain) return { stop: () => {} };
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1400, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(0.8, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    rainGain.gain.exponentialRampToValueAtTime(0.2, this.ctx.currentTime + 1.5);

    noise.connect(bandpass);
    bandpass.connect(rainGain);
    rainGain.connect(this.ambientGain);

    noise.start();

    return {
      stop: () => {
        if (!this.ctx) return;
        rainGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4);
        setTimeout(() => {
          try {
            noise.stop();
            noise.disconnect();
          } catch {}
        }, 1200);
      },
    };
  }
}

export const audioEngine = new AudioEngine();
