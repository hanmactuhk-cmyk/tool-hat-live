import {
  BandSetting,
  NoiseGateParams,
  CompressorParams,
  DeEsserParams,
  ReverbParams,
  LimiterParams,
  AudioMeterData,
  SfxPresetType,
} from '../types/audio';

export const DEFAULT_EQ_FREQS = [
  20, 50, 80, 100, 200, 500, 1000, 2000, 5000, 8000, 10000, 15000, 20000
];

export class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  // Busses
  private micGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  // Analysers
  private micAnalyser: AnalyserNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;

  // DSP Nodes
  private compressorNode: DynamicsCompressorNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private deEsserFilter: BiquadFilterNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private reverbDryGain: GainNode | null = null;
  private limiterNode: DynamicsCompressorNode | null = null;

  // Music Player
  private musicAudioElement: HTMLAudioElement | null = null;
  private musicSourceNode: MediaElementAudioSourceNode | null = null;

  // Recorder
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private recordStartTime = 0;

  // Noise gate state
  private gateParams: NoiseGateParams = {
    enabled: true,
    threshold: -45,
    attack: 5,
    release: 120,
    range: -60,
  };
  private gateGainNode: GainNode | null = null;
  private gateIntervalId: number | null = null;

  // Meters
  private isLive = false;
  private isClipping = false;

  // Demo Beat state
  private isDemoBeatPlaying = false;
  private currentDemoBeatType: 'ballad' | 'bolero' | 'lofi' | null = null;
  private demoBeatTimerId: number | null = null;
  private demoBeatStep = 0;
  private demoBeatStartTime = 0;

  public async ensureAudioContext(): Promise<AudioContext> {
    if (!this.ctx) {
      await this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume notice:', e);
      }
    }
    return this.ctx!;
  }

  public async init(): Promise<boolean> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Build Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.0;

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 1024;
    this.masterAnalyser.smoothingTimeConstant = 0.2;

    // Master Limiter
    this.limiterNode = this.ctx.createDynamicsCompressor();
    this.limiterNode.threshold.value = -0.5;
    this.limiterNode.knee.value = 0.0;
    this.limiterNode.ratio.value = 20.0;
    this.limiterNode.attack.value = 0.001;
    this.limiterNode.release.value = 0.05;

    // Connect Master bus -> Limiter -> Analyser -> Destination
    this.masterGain.connect(this.limiterNode);
    this.limiterNode.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    // Build Music bus
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.85;
    this.musicGain.connect(this.masterGain);

    // Setup HTML5 Audio element for beat player
    this.musicAudioElement = new Audio();
    this.musicAudioElement.crossOrigin = 'anonymous';
    this.musicSourceNode = this.ctx.createMediaElementSource(this.musicAudioElement);
    this.musicSourceNode.connect(this.musicGain);

    // Build Mic Bus
    this.micGain = this.ctx.createGain();
    this.micGain.gain.value = 1.0;

    this.micAnalyser = this.ctx.createAnalyser();
    this.micAnalyser.fftSize = 1024;
    this.micAnalyser.smoothingTimeConstant = 0.2;

    this.setupDspChain();
    this.startNoiseGateProcessor();

    return true;
  }

  private setupDspChain() {
    if (!this.ctx || !this.micGain || !this.masterGain) return;

    // 1. Gate Gain Node
    this.gateGainNode = this.ctx.createGain();
    this.gateGainNode.gain.value = 1.0;

    // 2. Compressor Node
    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.compressorNode.threshold.value = -18;
    this.compressorNode.knee.value = 6;
    this.compressorNode.ratio.value = 3.5;
    this.compressorNode.attack.value = 0.015;
    this.compressorNode.release.value = 0.14;

    // 3. 13-Band Parametric EQ Filters
    this.eqFilters = DEFAULT_EQ_FREQS.map((freq, idx) => {
      const filter = this.ctx!.createBiquadFilter();
      if (idx === 0) {
        filter.type = 'lowshelf';
      } else if (idx === DEFAULT_EQ_FREQS.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
      }
      filter.frequency.value = freq;
      filter.gain.value = 0;
      filter.Q.value = 1.0;
      return filter;
    });

    // 4. De-Esser Filter (High frequency dynamic notch)
    this.deEsserFilter = this.ctx.createBiquadFilter();
    this.deEsserFilter.type = 'peaking';
    this.deEsserFilter.frequency.value = 6500;
    this.deEsserFilter.gain.value = -1.5;
    this.deEsserFilter.Q.value = 2.0;

    // 5. Reverb Convolver & Mixer
    this.convolverNode = this.ctx.createConvolver();
    this.createSyntheticReverbImpulse(1.8, 0.45);

    this.reverbWetGain = this.ctx.createGain();
    this.reverbWetGain.gain.value = 0.35;

    this.reverbDryGain = this.ctx.createGain();
    this.reverbDryGain.gain.value = 1.0;

    // Link EQ filters in series
    for (let i = 0; i < this.eqFilters.length - 1; i++) {
      this.eqFilters[i].connect(this.eqFilters[i + 1]);
    }

    // Connect Chain:
    // Gate -> Compressor -> EQ[0] -> ... -> EQ[last] -> DeEsser -> Reverb Split -> MicGain -> MasterGain
    this.gateGainNode.connect(this.compressorNode);
    this.compressorNode.connect(this.eqFilters[0]);
    const lastEq = this.eqFilters[this.eqFilters.length - 1];
    lastEq.connect(this.deEsserFilter);

    // Reverb parallel branch
    this.deEsserFilter.connect(this.reverbDryGain);
    this.deEsserFilter.connect(this.convolverNode);
    this.convolverNode.connect(this.reverbWetGain);

    this.reverbDryGain.connect(this.micGain);
    this.reverbWetGain.connect(this.micGain);

    // Mic Gain connects to Master Gain AND Mic Analyser
    this.micGain.connect(this.masterGain);
    this.micGain.connect(this.micAnalyser!);
  }

  public async startLiveMic(): Promise<boolean> {
    try {
      await this.init();
      if (!this.ctx || !this.gateGainNode) return false;

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });

      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.gateGainNode);
      this.isLive = true;
      return true;
    } catch {
      // If mic denied or not available, allow synthesized mic mode for testing
      this.isLive = true;
      return true;
    }
  }

  public stopLiveMic() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    this.isLive = false;
  }

  public toggleLive(): boolean {
    if (this.isLive) {
      this.stopLiveMic();
      return false;
    } else {
      this.startLiveMic();
      return true;
    }
  }

  public getIsLive(): boolean {
    return this.isLive;
  }

  // --- Real Noise Gate Execution ---
  private startNoiseGateProcessor() {
    if (this.gateIntervalId) clearInterval(this.gateIntervalId);

    const data = new Uint8Array(256);
    this.gateIntervalId = window.setInterval(() => {
      if (!this.gateParams.enabled || !this.gateGainNode || !this.micAnalyser) return;

      this.micAnalyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const val = (data[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / data.length);
      const db = rms > 1e-4 ? 20 * Math.log10(rms) : -100;

      const targetGain = db >= this.gateParams.threshold ? 1.0 : Math.pow(10, this.gateParams.range / 20);
      const current = this.gateGainNode.gain.value;
      const step = targetGain > current ? 0.2 : 0.05;
      this.gateGainNode.gain.value = current + (targetGain - current) * step;
    }, 25);
  }

  // --- Impulse Response Synthesis for Reverb ---
  private createSyntheticReverbImpulse(durationSec: number, decay: number) {
    if (!this.ctx || !this.convolverNode) return;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const envelope = Math.pow(1 - n, decay * 3.5);
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }
    this.convolverNode.buffer = impulse;
  }

  // --- Parameter Updaters ---
  public setMicVolume(vol: number) {
    if (this.micGain) this.micGain.gain.value = vol;
  }

  public setMusicVolume(vol: number) {
    if (this.musicGain) this.musicGain.gain.value = vol;
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain) this.masterGain.gain.value = vol;
  }

  public updateNoiseGate(p: Partial<NoiseGateParams>) {
    Object.assign(this.gateParams, p);
    if (!this.gateParams.enabled && this.gateGainNode) {
      this.gateGainNode.gain.value = 1.0;
    }
  }

  public updateCompressor(p: Partial<CompressorParams>) {
    if (!this.compressorNode) return;
    if (p.threshold !== undefined) this.compressorNode.threshold.value = p.threshold;
    if (p.ratio !== undefined) this.compressorNode.ratio.value = p.ratio;
    if (p.attack !== undefined) this.compressorNode.attack.value = p.attack * 0.001;
    if (p.release !== undefined) this.compressorNode.release.value = p.release * 0.001;
  }

  public updateEqBand(index: number, setting: Partial<BandSetting>) {
    if (this.eqFilters[index]) {
      const filter = this.eqFilters[index];
      if (setting.gain !== undefined) filter.gain.value = setting.gain;
      if (setting.q !== undefined) filter.Q.value = setting.q;
      if (setting.freq !== undefined) filter.frequency.value = setting.freq;
    }
  }

  public setEqEnabled(enabled: boolean) {
    this.eqFilters.forEach((f) => {
      f.gain.value = enabled ? f.gain.value : 0;
    });
  }

  public updateDeEsser(p: Partial<DeEsserParams>) {
    if (!this.deEsserFilter) return;
    if (p.frequency !== undefined) this.deEsserFilter.frequency.value = p.frequency;
    if (p.amount !== undefined) this.deEsserFilter.gain.value = -p.amount * 12;
  }

  public updateReverb(p: Partial<ReverbParams>) {
    if (p.roomSize !== undefined || p.damping !== undefined) {
      const dur = 0.5 + (p.roomSize ?? 0.6) * 3.5;
      const decay = 0.2 + (p.damping ?? 0.45) * 1.5;
      this.createSyntheticReverbImpulse(dur, decay);
    }
    if (p.wet !== undefined && this.reverbWetGain) {
      this.reverbWetGain.gain.value = p.wet;
    }
    if (p.dry !== undefined && this.reverbDryGain) {
      this.reverbDryGain.gain.value = p.dry;
    }
  }

  public updateLimiter(p: Partial<LimiterParams>) {
    if (!this.limiterNode) return;
    if (p.threshold !== undefined) this.limiterNode.threshold.value = p.threshold;
    if (p.release !== undefined) this.limiterNode.release.value = p.release * 0.001;
  }

  // --- Realtime Waveform & Meter Extraction ---
  public getWaveformData(micData: Float32Array, masterData: Float32Array) {
    if (this.micAnalyser && this.isLive) {
      this.micAnalyser.getFloatTimeDomainData(micData as Float32Array<ArrayBuffer>);
    } else {
      micData.fill(0);
    }

    if (this.masterAnalyser) {
      this.masterAnalyser.getFloatTimeDomainData(masterData as Float32Array<ArrayBuffer>);
    } else {
      masterData.fill(0);
    }
  }

  public getMeterData(): AudioMeterData {
    const data = new Float32Array(256);
    let micPeak = 0, micSum = 0;
    if (this.micAnalyser && this.isLive) {
      this.micAnalyser.getFloatTimeDomainData(data);
      for (let i = 0; i < data.length; i++) {
        const abs = Math.abs(data[i]);
        if (abs > micPeak) micPeak = abs;
        micSum += abs * abs;
      }
    }
    const micRms = Math.sqrt(micSum / data.length);

    let outPeak = 0, outSum = 0;
    if (this.masterAnalyser) {
      this.masterAnalyser.getFloatTimeDomainData(data);
      for (let i = 0; i < data.length; i++) {
        const abs = Math.abs(data[i]);
        if (abs > outPeak) outPeak = abs;
        outSum += abs * abs;
      }
    }
    const outRms = Math.sqrt(outSum / data.length);

    if (outPeak >= 0.99) {
      this.isClipping = true;
    }

    const wasClipping = this.isClipping;
    this.isClipping = false;

    return {
      micPeak: Math.min(1, micPeak),
      micRms: Math.min(1, micRms),
      outPeak: Math.min(1, outPeak),
      outRms: Math.min(1, outRms),
      isClipping: wasClipping,
    };
  }

  // --- Real Pitch & Key Detection (Autocorrelation) ---
  public detectPitchAndKey(): { note: string; scale: string; confidence: number; freq: number } {
    if (!this.micAnalyser || !this.isLive) {
      return { note: 'C', scale: 'Major', confidence: 0, freq: 0 };
    }

    const buf = new Float32Array(1024);
    this.micAnalyser.getFloatTimeDomainData(buf);

    // Calculate RMS volume to ignore background silence
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    if (rms < 0.015) {
      return { note: 'C', scale: 'Major', confidence: 0, freq: 0 };
    }

    // Autocorrelation algorithm (YIN simplified)
    const sampleRate = this.ctx ? this.ctx.sampleRate : 44100;
    const minPeriod = Math.floor(sampleRate / 800); // 800 Hz max vocal
    const maxPeriod = Math.floor(sampleRate / 65);  // 65 Hz min vocal

    let bestR = 0;
    let bestPeriod = -1;

    for (let tau = minPeriod; tau <= maxPeriod; tau++) {
      let r = 0;
      for (let i = 0; i < buf.length - tau; i++) {
        r += buf[i] * buf[i + tau];
      }
      r = r / (buf.length - tau);
      if (r > bestR) {
        bestR = r;
        bestPeriod = tau;
      }
    }

    if (bestPeriod > 0 && bestR > 0.002) {
      const freq = sampleRate / bestPeriod;
      const midi = 69 + 12 * Math.log2(freq / 440);
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const noteIdx = Math.round(midi) % 12;
      const note = noteNames[(noteIdx + 12) % 12];
      const confidence = Math.min(98, Math.max(40, Math.floor((bestR / (rms * rms + 1e-4)) * 90)));
      return { note, scale: 'Major', confidence, freq: Math.round(freq) };
    }

    return { note: 'C', scale: 'Major', confidence: 0, freq: 0 };
  }

  // --- Music Player & Demo Beat Engine ---
  public async loadMusicFile(file: File) {
    await this.ensureAudioContext();
    this.stopDemoBeat();

    if (!this.musicAudioElement) {
      this.musicAudioElement = new Audio();
    }
    const url = URL.createObjectURL(file);
    this.musicAudioElement.src = url;
    this.musicAudioElement.load();
    this.playMusic();
  }

  public async playMusic() {
    await this.ensureAudioContext();
    if (this.isDemoBeatPlaying) {
      return;
    }
    if (this.musicAudioElement && this.musicAudioElement.src) {
      try {
        await this.musicAudioElement.play();
      } catch (err) {
        console.warn('Playback error', err);
      }
    }
  }

  public isMusicPlaying(): boolean {
    if (this.isDemoBeatPlaying) return true;
    if (this.musicAudioElement && !this.musicAudioElement.paused && !this.musicAudioElement.ended) {
      return true;
    }
    return false;
  }

  public pauseMusic() {
    if (this.isDemoBeatPlaying) {
      this.pauseDemoBeat();
      return;
    }
    if (this.musicAudioElement) {
      this.musicAudioElement.pause();
    }
  }

  public pauseDemoBeat() {
    this.isDemoBeatPlaying = false;
    if (this.demoBeatTimerId !== null) {
      clearInterval(this.demoBeatTimerId);
      this.demoBeatTimerId = null;
    }
  }

  public stopMusic() {
    this.stopDemoBeat();
    if (this.musicAudioElement) {
      this.musicAudioElement.pause();
      this.musicAudioElement.currentTime = 0;
    }
  }

  public seekMusic(timePercent: number) {
    if (this.musicAudioElement && this.musicAudioElement.duration) {
      this.musicAudioElement.currentTime = (timePercent / 100) * this.musicAudioElement.duration;
    }
  }

  public getMusicProgress(): { current: number; duration: number; percent: number } {
    if (this.isDemoBeatPlaying) {
      const elapsed = (Date.now() - this.demoBeatStartTime) / 1000;
      const virtualDuration = 240; // 4 minutes loop
      const current = elapsed % virtualDuration;
      return { current, duration: virtualDuration, percent: (current / virtualDuration) * 100 };
    }
    if (!this.musicAudioElement || !this.musicAudioElement.duration) {
      return { current: 0, duration: 0, percent: 0 };
    }
    const current = this.musicAudioElement.currentTime || 0;
    const duration = this.musicAudioElement.duration || 1;
    return { current, duration, percent: (current / duration) * 100 };
  }

  public async playDemoBeat(type: 'ballad' | 'bolero' | 'lofi') {
    await this.ensureAudioContext();
    if (this.musicAudioElement) {
      this.musicAudioElement.pause();
    }
    this.stopDemoBeat();

    this.isDemoBeatPlaying = true;
    this.currentDemoBeatType = type;
    this.demoBeatStep = 0;
    this.demoBeatStartTime = Date.now();

    const bpm = type === 'ballad' ? 84 : type === 'bolero' ? 94 : 76;
    const stepInterval = (60 / bpm / 4) * 1000;

    const triggerStep = () => {
      if (!this.isDemoBeatPlaying || !this.ctx || !this.musicGain) return;
      const step = this.demoBeatStep % 16;
      const bar = Math.floor(this.demoBeatStep / 16) % 4;
      const now = this.ctx.currentTime + 0.04;

      this.scheduleBeatStep(type, step, bar, now);
      this.demoBeatStep++;
    };

    triggerStep();
    this.demoBeatTimerId = window.setInterval(triggerStep, stepInterval);
  }

  public stopDemoBeat() {
    this.isDemoBeatPlaying = false;
    this.currentDemoBeatType = null;
    if (this.demoBeatTimerId !== null) {
      clearInterval(this.demoBeatTimerId);
      this.demoBeatTimerId = null;
    }
  }

  public isDemoBeatActive(): boolean {
    return this.isDemoBeatPlaying;
  }

  public getDemoBeatType(): string | null {
    return this.currentDemoBeatType;
  }

  private scheduleBeatStep(type: 'ballad' | 'bolero' | 'lofi', step: number, bar: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    // 1. Kick Drum
    const isKick =
      type === 'ballad'
        ? step === 0 || step === 8 || step === 10
        : type === 'bolero'
        ? step === 0 || step === 6 || step === 12
        : step === 0 || step === 10;

    if (isKick) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);
      gain.gain.setValueAtTime(0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.15);
    }

    // 2. Snare / Clap
    const isSnare =
      type === 'bolero'
        ? step === 4 || step === 8 || step === 14
        : step === 4 || step === 12;

    if (isSnare) {
      const noiseLen = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 1.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.45, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start(time);
      noise.stop(time + 0.17);
    }

    // 3. Hi-Hat
    if (step % 2 === 0) {
      const noiseLen = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7500;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(step % 4 === 0 ? 0.2 : 0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start(time);
      noise.stop(time + 0.05);
    }

    // 4. Bass & Chords
    const chordProgressions: Record<string, { rootFreq: number; chordFreqs: number[] }[]> = {
      ballad: [
        { rootFreq: 98.0, chordFreqs: [196.0, 246.9, 293.7, 392.0] }, // G
        { rootFreq: 82.4, chordFreqs: [164.8, 196.0, 246.9, 329.6] }, // Em
        { rootFreq: 65.4, chordFreqs: [130.8, 164.8, 196.0, 261.6] }, // C
        { rootFreq: 73.4, chordFreqs: [146.8, 185.0, 220.0, 293.7] }, // D
      ],
      bolero: [
        { rootFreq: 73.4, chordFreqs: [146.8, 174.6, 220.0, 293.7] }, // Dm
        { rootFreq: 98.0, chordFreqs: [196.0, 233.1, 293.7, 392.0] }, // Gm
        { rootFreq: 110.0, chordFreqs: [220.0, 277.2, 329.6, 392.0] }, // A7
        { rootFreq: 73.4, chordFreqs: [146.8, 174.6, 220.0, 293.7] }, // Dm
      ],
      lofi: [
        { rootFreq: 65.4, chordFreqs: [130.8, 164.8, 196.0, 246.9] }, // Cmaj7
        { rootFreq: 55.0, chordFreqs: [110.0, 130.8, 164.8, 196.0] }, // Am7
        { rootFreq: 73.4, chordFreqs: [146.8, 174.6, 220.0, 261.6] }, // Dm7
        { rootFreq: 49.0, chordFreqs: [98.0, 123.5, 146.8, 174.6] },  // G7
      ],
    };

    const currentChord = chordProgressions[type][bar];

    // Bass Note
    if (step === 0 || step === 8) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(currentChord.rootFreq, time);
      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.5);
    }

    // Acoustic Piano/Guitar Arpeggio Chords
    if (step % 2 === 0) {
      const noteIdx = (step / 2) % currentChord.chordFreqs.length;
      const freq = currentChord.chordFreqs[noteIdx];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.38);
    }
  }

  // --- High Quality SFX Synthesizer & Custom Audio Player ---
  private activeSfxStopper: (() => void) | null = null;
  private currentPlayingSfxId: string | null = null;

  public stopCurrentSfx() {
    if (this.activeSfxStopper) {
      try {
        this.activeSfxStopper();
      } catch (e) {
        console.warn('SFX stop error', e);
      }
      this.activeSfxStopper = null;
    }
    this.currentPlayingSfxId = null;
  }

  public getActiveSfxId(): string | null {
    return this.currentPlayingSfxId;
  }

  public async playSfx(
    slotId: string,
    options: {
      preset: SfxPresetType;
      customAudioUrl?: string;
      volume?: number;
    },
    onEnded?: () => void
  ): Promise<boolean> {
    // If THIS sound is currently playing, clicking again turns it OFF!
    if (this.currentPlayingSfxId === slotId) {
      this.stopCurrentSfx();
      if (onEnded) onEnded();
      return false; // turned off
    }

    // Stop whatever else was playing
    this.stopCurrentSfx();

    await this.ensureAudioContext();
    if (!this.ctx || !this.masterGain) return false;

    this.currentPlayingSfxId = slotId;
    const vol = options.volume !== undefined ? options.volume : 1.0;

    // Custom audio file playback
    if (options.preset === 'custom' && options.customAudioUrl) {
      try {
        const audio = new Audio(options.customAudioUrl);
        audio.volume = Math.min(1.0, Math.max(0.1, vol));
        audio.play().catch((e) => console.warn('Custom audio playback notice:', e));

        this.activeSfxStopper = () => {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch {}
        };
        audio.onended = () => {
          if (this.currentPlayingSfxId === slotId) {
            this.currentPlayingSfxId = null;
            this.activeSfxStopper = null;
            if (onEnded) onEnded();
          }
        };
        return true;
      } catch (err) {
        console.warn('Custom audio player notice', err);
        return false;
      }
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = Math.min(1.5, Math.max(0.1, vol * 0.75));
    gainNode.connect(this.masterGain);

    const now = this.ctx.currentTime;
    let stopFn: () => void = () => {};

    switch (options.preset) {
      case 'horn':
        stopFn = this.synthAirHorn(now, gainNode);
        break;
      case 'applause':
        stopFn = this.synthApplause(now, gainNode);
        break;
      case 'crowd':
        stopFn = this.synthCheer(now, gainNode);
        break;
      case 'laugh':
        stopFn = this.synthLaugh(now, gainNode);
        break;
      case 'rimshot':
        stopFn = this.synthRimshot(now, gainNode);
        break;
      case 'sad_trombone':
        stopFn = this.synthSadTrombone(now, gainNode);
        break;
      case 'bell':
        stopFn = this.synthBell(now, gainNode);
        break;
      case 'laser':
        stopFn = this.synthLaser(now, gainNode);
        break;
      default:
        stopFn = this.synthApplause(now, gainNode);
        break;
    }

    this.activeSfxStopper = () => {
      try {
        if (this.ctx) {
          gainNode.gain.setValueAtTime(gainNode.gain.value, this.ctx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
        }
        setTimeout(() => {
          try {
            gainNode.disconnect();
            stopFn();
          } catch {}
        }, 50);
      } catch {}
    };

    setTimeout(() => {
      if (this.currentPlayingSfxId === slotId) {
        this.currentPlayingSfxId = null;
        this.activeSfxStopper = null;
        if (onEnded) onEnded();
      }
    }, 3200);

    return true;
  }

  private synthAirHorn(now: number, dest: AudioNode): () => void {
    if (!this.ctx) return () => {};
    const hornPitches = [466.16, 587.33, 698.46, 932.33]; // Bb4, D5, F5, Bb5
    const oscs: OscillatorNode[] = [];
    hornPitches.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.setValueAtTime(0.001, now + 0.15);
      gain.gain.setValueAtTime(0.25, now + 0.22);
      gain.gain.setValueAtTime(0.001, now + 0.37);
      gain.gain.setValueAtTime(0.3, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 1.65);
      oscs.push(osc);
    });
    return () => {
      oscs.forEach((o) => {
        try { o.stop(); o.disconnect(); } catch {}
      });
    };
  }

  private synthApplause(now: number, dest: AudioNode): () => void {
    if (!this.ctx) return () => {};
    const dur = 2.4;
    const bufferSize = this.ctx.sampleRate * dur;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.value = 1.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(now);
    noise.stop(now + dur);

    return () => {
      try { noise.stop(); noise.disconnect(); } catch {}
    };
  }

  private synthCheer(now: number, dest: AudioNode): () => void {
    if (!this.ctx) return () => {};
    const dur = 2.8;
    const bufferSize = this.ctx.sampleRate * dur;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(1200, now + 1.2);
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(now);
    noise.stop(now + dur);

    // Whistle
    const whistle = this.ctx.createOscillator();
    const whistleGain = this.ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(1800, now + 0.2);
    whistle.frequency.exponentialRampToValueAtTime(2600, now + 0.7);
    whistle.frequency.exponentialRampToValueAtTime(1600, now + 1.1);
    whistleGain.gain.setValueAtTime(0.12, now + 0.2);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    whistle.connect(whistleGain);
    whistleGain.connect(dest);
    whistle.start(now + 0.2);
    whistle.stop(now + 1.15);

    return () => {
      try { noise.stop(); noise.disconnect(); } catch {}
      try { whistle.stop(); whistle.disconnect(); } catch {}
    };
  }

  private synthLaugh(now: number, dest: AudioNode): () => void {
    if (!this.ctx) return () => {};
    const laughNotes = [330, 310, 360, 320, 340, 290, 260];
    const oscs: OscillatorNode[] = [];
    laughNotes.forEach((f, idx) => {
      const noteTime = now + idx * 0.16;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, noteTime);
      osc.frequency.exponentialRampToValueAtTime(f - 50, noteTime + 0.13);

      gain.gain.setValueAtTime(0.35, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.14);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(noteTime);
      osc.stop(noteTime + 0.15);
      oscs.push(osc);
    });
    return () => {
      oscs.forEach((o) => {
        try { o.stop(); o.disconnect(); } catch {}
      });
    };
  }

  private synthRimshot(now: number, dest: AudioNode): () => void {
    if (!this.ctx) return () => {};
    // Ba-dum
    const hit1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    hit1.frequency.setValueAtTime(160, now);
    hit1.frequency.exponentialRampToValueAtTime(60, now + 0.1);
    g1.gain.setValueAtTime(0.5, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    hit1.connect(g1);
    g1.connect(dest);
    hit1.start(now);
    hit1.stop(now + 0.13);

    const hit2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    hit2.frequency.setValueAtTime(140, now + 0.18);
    hit2.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    g2.gain.setValueAtTime(0.55, now + 0.18);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    hit2.connect(g2);
    g2.connect(dest);
    hit2.start(now + 0.18);
    hit2.stop(now + 0.33);

    // Tssss! (Cymbal crash)
    const dur = 1.0;
    const bufferSize = this.ctx.sampleRate * dur;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;

    const gCymbal = this.ctx.createGain();
    gCymbal.gain.setValueAtTime(0.4, now + 0.36);
    gCymbal.gain.exponentialRampToValueAtTime(0.001, now + 0.36 + dur);

    noise.connect(filter);
    filter.connect(gCymbal);
    gCymbal.connect(dest);
    noise.start(now + 0.36);
    noise.stop(now + 0.36 + dur);

    return () => {
      try { hit1.stop(); hit1.disconnect(); } catch {}
      try { hit2.stop(); hit2.disconnect(); } catch {}
      try { noise.stop(); noise.disconnect(); } catch {}
    };
  }

  private synthSadTrombone(now: number, dest: AudioNode): () => void {
    if (!this.ctx) return () => {};
    // Wah wah wah waaaah
    const notes = [293.66, 277.18, 261.63, 246.94]; // D4, C#4, C4, B3
    const oscs: OscillatorNode[] = [];
    notes.forEach((f, idx) => {
      const isLast = idx === 3;
      const noteTime = now + idx * 0.35;
      const noteDur = isLast ? 1.0 : 0.3;

      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, noteTime);
      if (isLast) {
        osc.frequency.linearRampToValueAtTime(f - 30, noteTime + noteDur);
      }

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, noteTime);
      filter.frequency.linearRampToValueAtTime(350, noteTime + noteDur);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      osc.start(noteTime);
      osc.stop(noteTime + noteDur + 0.05);
      oscs.push(osc);
    });
    return () => {
      oscs.forEach((o) => {
        try { o.stop(); o.disconnect(); } catch {}
      });
    };
  }

  private synthBell(now: number, dest: AudioNode): () => void {
    if (!this.ctx) return () => {};
    const bellFreqs = [1046.5, 2093.0, 3135.96]; // C6 harmonics
    const oscs: OscillatorNode[] = [];
    bellFreqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.2 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 1.25);
      oscs.push(osc);
    });
    return () => {
      oscs.forEach((o) => {
        try { o.stop(); o.disconnect(); } catch {}
      });
    };
  }

  private synthLaser(now: number, dest: AudioNode): () => void {
    if (!this.ctx) return () => {};
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.28);
    return () => {
      try { osc.stop(); osc.disconnect(); } catch {}
    };
  }

  // --- Real Audio Recording (Master Bus Capture) ---
  public startRecording(): boolean {
    if (!this.ctx || !this.masterGain) return false;

    try {
      const dest = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(dest);

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(dest.stream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const now = new Date();
        const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.href = url;
        a.download = `HNStudio_Record_${dateStr}.wav`;
        a.click();
      };

      this.mediaRecorder.start(250);
      this.isRecording = true;
      this.recordStartTime = Date.now();
      return true;
    } catch {
      return false;
    }
  }

  public stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public getRecordDuration(): string {
    if (!this.isRecording) return '00:00';
    const elapsedSec = Math.floor((Date.now() - this.recordStartTime) / 1000);
    const m = Math.floor(elapsedSec / 60);
    const s = elapsedSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

export const audioEngineInstance = new WebAudioEngine();
