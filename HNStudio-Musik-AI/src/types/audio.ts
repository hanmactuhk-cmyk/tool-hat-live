export interface BandSetting {
  freq: number;
  gain: number;
  q: number;
  enabled: boolean;
}

export interface NoiseGateParams {
  enabled: boolean;
  threshold: number; // dB
  attack: number;    // ms
  release: number;   // ms
  range: number;     // dB
}

export interface CompressorParams {
  enabled: boolean;
  threshold: number; // dB
  ratio: number;
  attack: number;    // ms
  release: number;   // ms
  makeupGain: number;// dB
}

export interface DeEsserParams {
  enabled: boolean;
  frequency: number; // Hz
  threshold: number; // dB
  amount: number;    // 0..1
}

export interface ReverbParams {
  enabled: boolean;
  roomSize: number; // 0..1
  damping: number;  // 0..1
  width: number;    // 0..1
  wet: number;      // 0..1
  dry: number;      // 0..1
  preDelay: number; // ms
  preset: string;
}

export interface ShortReverbParams {
  enabled: boolean;
  decay: number; // 0.4s - 1.5s (Vang ngắn ấm áp, bắt mic)
  wet: number;   // 0..1
  damping: number;
}

export interface LongReverbParams {
  enabled: boolean;
  decay: number; // 2.0s - 6.0s (Vang dài ngân nga bay bổng)
  wet: number;   // 0..1
  damping: number;
}

export interface EchoDelayParams {
  enabled: boolean;
  time: number;     // ms (80ms - 600ms)
  feedback: number; // 0..0.85 (Độ lặp)
  wet: number;      // 0..1 (Âm lượng tiếng vọng)
  hiCut: number;    // Hz (Bộ lọc ấm tiếng vọng analog)
}

export interface LimiterParams {
  enabled: boolean;
  threshold: number; // dB
  release: number;   // ms
  ceiling: number;   // dB
}

export interface AutoKeyParams {
  enabled: boolean;
  currentKey: string;
  isMajor: boolean;
  detectedKey: string;
  confidence: number;
  retuneSpeed: number;
  humanize: number;
  flexTune: number;
  mix: number;
}

export interface VstPluginSlot {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
  bypassed: boolean;
  editorOpen: boolean;
  type: string;
}

export interface AudioMeterData {
  micPeak: number;
  micRms: number;
  outPeak: number;
  outRms: number;
  isClipping: boolean;
}

export type SfxPresetType =
  | 'applause'
  | 'laugh'
  | 'horn'
  | 'crowd'
  | 'rimshot'
  | 'sad_trombone'
  | 'bell'
  | 'laser'
  | 'custom';

export interface SfxSlot {
  id: string;
  name: string;
  preset: SfxPresetType;
  customAudioUrl?: string;
  customFileName?: string;
  volume: number;
  color: string;
}
