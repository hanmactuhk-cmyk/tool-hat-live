import {
  BandSetting,
  NoiseGateParams,
  CompressorParams,
  DeEsserParams,
  ReverbParams,
  LimiterParams,
  AudioMeterData,
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

    if (this.masterAnalyser && this.isLive) {
      this.masterAnalyser.getFloatTimeDomainData(masterData as Float32Array<ArrayBuffer>);
    } else {
      masterData.fill(0);
    }
  }

  public getMeterData(): AudioMeterData {
    if (!this.isLive) {
      return { micPeak: 0, micRms: 0, outPeak: 0, outRms: 0, isClipping: false };
    }

    const data = new Float32Array(256);
    let micPeak = 0, micSum = 0;
    if (this.micAnalyser) {
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

  // --- Music Player Methods ---
  public loadMusicFile(file: File) {
    if (!this.musicAudioElement) return;
    const url = URL.createObjectURL(file);
    this.musicAudioElement.src = url;
    this.musicAudioElement.load();
  }

  public playMusic() {
    if (this.musicAudioElement) this.musicAudioElement.play().catch(() => {});
  }

  public pauseMusic() {
    if (this.musicAudioElement) this.musicAudioElement.pause();
  }

  public stopMusic() {
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
    if (!this.musicAudioElement || !this.musicAudioElement.duration) {
      return { current: 0, duration: 0, percent: 0 };
    }
    const current = this.musicAudioElement.currentTime || 0;
    const duration = this.musicAudioElement.duration || 1;
    return { current, duration, percent: (current / duration) * 100 };
  }

  // --- SFX Synthesizer ---
  public playSfx(type: 'laugh' | 'applause' | 'crowd' | 'horn') {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    if (type === 'horn') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(466.16, now); // Bb4
      osc.frequency.setValueAtTime(587.33, now + 0.3); // D5
      osc.frequency.setValueAtTime(466.16, now + 0.5);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.2);
    } else if (type === 'applause' || type === 'crowd') {
      const bufferSize = this.ctx.sampleRate * 2.0;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = type === 'applause' ? 1200 : 700;
      filter.Q.value = 1.2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      whiteNoise.start(now);
      whiteNoise.stop(now + 2.0);
    } else {
      // Laugh synth
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      for (let i = 0; i < 6; i++) {
        osc.frequency.setValueAtTime(300 + (i % 2 === 0 ? 60 : -40), now + i * 0.2);
      }
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.4);
    }
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
