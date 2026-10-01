import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Oscilloscope } from './components/Oscilloscope';
import { ChannelStrips } from './components/ChannelStrip';
import { DspToolbar } from './components/DspToolbar';
import { ExternalVstBar } from './components/ExternalVstBar';
import { VstPanel } from './components/VstPanel';
import { MusicPlayerSection } from './components/MusicPlayerSection';
import { SfxSection } from './components/SfxSection';
import { RecordingSection } from './components/RecordingSection';
import { Popups } from './components/Popups';
import { ProjectCodeViewer } from './components/ProjectCodeViewer';
import { VstSettingsModal } from './components/VstSettingsModal';
import { audioEngineInstance, DEFAULT_EQ_FREQS } from './services/webAudioEngine';
import { Sparkles, Shield, Headphones, Check, Zap, AlertCircle } from 'lucide-react';
import {
  BandSetting,
  NoiseGateParams,
  CompressorParams,
  DeEsserParams,
  ReverbParams,
  ShortReverbParams,
  LongReverbParams,
  EchoDelayParams,
  LimiterParams,
  AutoKeyParams,
  VstPluginSlot,
  AudioMeterData,
} from './types/audio';

export default function App() {
  const [isLive, setIsLive] = useState(false);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);
  const [isVstSettingsOpen, setIsVstSettingsOpen] = useState(false);

  // Anti-Feedback Suppressor state (Default ON to prevent mic howling)
  const [isAntiFeedback, setIsAntiFeedback] = useState(true);

  // AI Auto-DSP Calibration states
  const [isAutoDspScanning, setIsAutoDspScanning] = useState(false);
  const [autoDspStepMsg, setAutoDspStepMsg] = useState('');
  const [autoDspPercent, setAutoDspPercent] = useState(0);
  const [autoDspSuccessMsg, setAutoDspSuccessMsg] = useState<string | null>(null);

  // Volumes
  const [micVolume, setMicVolume] = useState(1.0);
  const [musicVolume, setMusicVolume] = useState(0.85);
  const [masterVolume, setMasterVolume] = useState(1.0);

  // Meter Data
  const [meterData, setMeterData] = useState<AudioMeterData>({
    micPeak: 0,
    micRms: 0,
    outPeak: 0,
    outRms: 0,
    isClipping: false,
  });

  // DSP Params
  const [noiseGate, setNoiseGate] = useState<NoiseGateParams>({
    enabled: true,
    threshold: -45,
    attack: 4,
    release: 110,
    range: -60,
  });

  const [compressor, setCompressor] = useState<CompressorParams>({
    enabled: true,
    threshold: -18,
    ratio: 3.5,
    attack: 12,
    release: 130,
    makeupGain: 3,
  });

  const [eqEnabled, setEqEnabled] = useState(true);
  const [eqBands, setEqBands] = useState<BandSetting[]>(
    DEFAULT_EQ_FREQS.map((freq) => ({
      freq,
      gain: 0,
      q: 1.0,
      enabled: true,
    }))
  );

  const [deEsser, setDeEsser] = useState<DeEsserParams>({
    enabled: true,
    frequency: 6500,
    threshold: -22,
    amount: 0.6,
  });

  const [reverb, setReverb] = useState<ReverbParams>({
    enabled: true,
    roomSize: 0.58,
    damping: 0.42,
    width: 0.88,
    wet: 0.32,
    dry: 1.0,
    preDelay: 22,
    preset: 'Vocal Studio',
  });

  // Vang Ngắn (Short Reverb - Plate & Room)
  const [shortReverb, setShortReverb] = useState<ShortReverbParams>({
    enabled: true,
    decay: 0.9,
    wet: 0.28,
    damping: 0.55,
  });

  // Vang Dài (Long Reverb - Hall & Cathedral)
  const [longReverb, setLongReverb] = useState<LongReverbParams>({
    enabled: true,
    decay: 3.2,
    wet: 0.22,
    damping: 0.35,
  });

  // Echo / Delay (Tiếng vọng Stereo Tape Delay)
  const [echoDelay, setEchoDelay] = useState<EchoDelayParams>({
    enabled: true,
    time: 240,
    feedback: 0.38,
    wet: 0.26,
    hiCut: 3500,
  });

  const [limiter, setLimiter] = useState<LimiterParams>({
    enabled: true,
    threshold: -0.5,
    release: 50,
    ceiling: -0.1,
  });

  const [autoKey, setAutoKey] = useState<AutoKeyParams>({
    enabled: false,
    currentKey: 'C',
    isMajor: true,
    detectedKey: 'C Major',
    confidence: 0,
    retuneSpeed: 20,
    humanize: 15,
    flexTune: 10,
    mix: 100,
  });

  // VST Slots
  const [vstSlots, setVstSlots] = useState<VstPluginSlot[]>([
    {
      id: 'vst-1',
      name: 'Antares Auto-Tune Pro (VST3)',
      path: 'C:\\Program Files\\Common Files\\VST3\\Auto-Tune Pro.vst3',
      enabled: true,
      bypassed: false,
      editorOpen: false,
      type: 'Pitch Correction',
    },
    {
      id: 'vst-2',
      name: 'FabFilter Pro-Q 3 (VST3)',
      path: 'C:\\Program Files\\Common Files\\VST3\\FabFilter Pro-Q 3.vst3',
      enabled: true,
      bypassed: false,
      editorOpen: false,
      type: 'Equalizer',
    },
    {
      id: 'vst-3',
      name: 'Waves CLA-76 Compressor (VST3)',
      path: 'C:\\Program Files\\Common Files\\VST3\\WaveShell14-VST3.vst3',
      enabled: true,
      bypassed: false,
      editorOpen: false,
      type: 'Dynamics',
    },
  ]);

  // Meter & Pitch polling loop
  useEffect(() => {
    const timer = setInterval(() => {
      const data = audioEngineInstance.getMeterData();
      setMeterData(data);

      if (autoKey.enabled) {
        const detected = audioEngineInstance.detectPitchAndKey();
        if (detected.confidence > 0) {
          setAutoKey((prev) => ({
            ...prev,
            currentKey: detected.note,
            detectedKey: `${detected.note} ${detected.scale}`,
            confidence: detected.confidence,
          }));
        }
      }
    }, 40);

    return () => clearInterval(timer);
  }, [autoKey.enabled]);

  // Volume Handlers
  const handleMicVolumeChange = (vol: number) => {
    setMicVolume(vol);
    audioEngineInstance.setMicVolume(vol);
  };

  const handleMusicVolumeChange = (vol: number) => {
    setMusicVolume(vol);
    audioEngineInstance.setMusicVolume(vol);
  };

  const handleMasterVolumeChange = (vol: number) => {
    setMasterVolume(vol);
    audioEngineInstance.setMasterVolume(vol);
  };

  const handleToggleLive = async () => {
    if (isLive) {
      audioEngineInstance.stopLiveMic();
      setIsLive(false);
    } else {
      // Ensure Anti-Feedback is active before opening live mic
      audioEngineInstance.setAntiFeedback(isAntiFeedback);
      const ok = await audioEngineInstance.startLiveMic();
      if (ok) setIsLive(true);
    }
  };

  const handleToggleAntiFeedback = () => {
    const next = !isAntiFeedback;
    setIsAntiFeedback(next);
    audioEngineInstance.setAntiFeedback(next);
  };

  // AI Auto-DSP Calibration Trigger
  const handleTriggerAutoDsp = async () => {
    setIsAutoDspScanning(true);
    setAutoDspSuccessMsg(null);
    try {
      const result = await audioEngineInstance.autoCalibrateVocalDsp((msg, pct) => {
        setAutoDspStepMsg(msg);
        setAutoDspPercent(pct);
      });

      if (result.noiseGate) setNoiseGate((prev) => ({ ...prev, ...result.noiseGate }));
      if (result.compressor) setCompressor((prev) => ({ ...prev, ...result.compressor }));
      if (result.deEsser) setDeEsser((prev) => ({ ...prev, ...result.deEsser }));
      if (result.reverb) setReverb((prev) => ({ ...prev, ...result.reverb }));
      setIsAntiFeedback(true);

      setAutoDspSuccessMsg(result.message);
      setTimeout(() => {
        setIsAutoDspScanning(false);
      }, 1500);
    } catch {
      setIsAutoDspScanning(false);
    }
  };

  // DSP Toggles
  const handleToggleGate = () => {
    const next = !noiseGate.enabled;
    setNoiseGate((prev) => ({ ...prev, enabled: next }));
    audioEngineInstance.updateNoiseGate({ enabled: next });
  };

  const handleToggleComp = () => {
    const next = !compressor.enabled;
    setCompressor((prev) => ({ ...prev, enabled: next }));
  };

  const handleToggleEq = () => {
    const next = !eqEnabled;
    setEqEnabled(next);
    audioEngineInstance.setEqEnabled(next);
  };

  const handleToggleDeEsser = () => {
    const next = !deEsser.enabled;
    setDeEsser((prev) => ({ ...prev, enabled: next }));
  };

  const handleToggleShortReverb = () => {
    const next = !shortReverb.enabled;
    setShortReverb((p) => ({ ...p, enabled: next }));
    audioEngineInstance.updateShortReverb({ enabled: next });
  };

  const handleToggleLongReverb = () => {
    const next = !longReverb.enabled;
    setLongReverb((p) => ({ ...p, enabled: next }));
    audioEngineInstance.updateLongReverb({ enabled: next });
  };

  const handleToggleEchoDelay = () => {
    const next = !echoDelay.enabled;
    setEchoDelay((p) => ({ ...p, enabled: next }));
    audioEngineInstance.updateEchoDelay({ enabled: next });
  };

  const handleToggleReverb = () => {
    const next = !reverb.enabled;
    setReverb((prev) => ({ ...prev, enabled: next }));
    audioEngineInstance.updateReverb({ wet: next ? reverb.wet : 0 });
  };

  const handleToggleLimiter = () => {
    const next = !limiter.enabled;
    setLimiter((prev) => ({ ...prev, enabled: next }));
  };

  // VST Management
  const handleToggleVstBypass = (id: string) => {
    setVstSlots((prev) =>
      prev.map((slot) =>
        slot.id === id ? { ...slot, bypassed: !slot.bypassed } : slot
      )
    );
  };

  const handleMoveVstUp = (index: number) => {
    if (index > 0) {
      const copy = [...vstSlots];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      setVstSlots(copy);
    }
  };

  const handleMoveVstDown = (index: number) => {
    if (index < vstSlots.length - 1) {
      const copy = [...vstSlots];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      setVstSlots(copy);
    }
  };

  const handleRemoveVst = (id: string) => {
    setVstSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleOpenVstEditor = (id: string) => {
    const slot = vstSlots.find((s) => s.id === id);
    if (slot) {
      setActivePopup('vst_manager');
    }
  };

  const handleAddVstClick = () => {
    setIsVstSettingsOpen(true);
  };

  const handleInsertPluginFromScanner = (plugin: { name: string; path: string; category: string }) => {
    const newSlot: VstPluginSlot = {
      id: `vst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: plugin.name,
      path: plugin.path,
      enabled: true,
      bypassed: false,
      editorOpen: false,
      type: plugin.category,
    };
    setVstSlots((prev) => [...prev, newSlot]);
  };

  const handleAddCustomPlugin = (name: string, path: string) => {
    const newSlot: VstPluginSlot = {
      id: `vst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      path,
      enabled: true,
      bypassed: false,
      editorOpen: false,
      type: 'VST3 Insert',
    };
    setVstSlots((prev) => [...prev, newSlot]);
  };

  // Project Save & Load
  const handleSaveProject = () => {
    const projectData = {
      app: 'HNStudio Musik AI',
      version: '1.0.0',
      author: 'Hoài Nguyễn Studio (Zalo: 0965.043.000)',
      volumes: { mic: micVolume, music: musicVolume, master: masterVolume },
      noiseGate,
      compressor,
      eq: { enabled: eqEnabled, bands: eqBands },
      deEsser,
      reverb,
      limiter,
      autoKey,
      vstSlots,
      isAntiFeedback,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MySession.hnstudio';
    a.click();
  };

  const handleOpenProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.hnstudio,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.volumes) {
              setMicVolume(data.volumes.mic ?? 1.0);
              setMusicVolume(data.volumes.music ?? 0.85);
              setMasterVolume(data.volumes.master ?? 1.0);
              audioEngineInstance.setMicVolume(data.volumes.mic ?? 1.0);
              audioEngineInstance.setMusicVolume(data.volumes.music ?? 0.85);
              audioEngineInstance.setMasterVolume(data.volumes.master ?? 1.0);
            }
            if (data.noiseGate) setNoiseGate(data.noiseGate);
            if (data.compressor) setCompressor(data.compressor);
            if (data.eq) {
              setEqEnabled(data.eq.enabled ?? true);
              if (data.eq.bands) setEqBands(data.eq.bands);
            }
            if (data.deEsser) setDeEsser(data.deEsser);
            if (data.reverb) setReverb(data.reverb);
            if (data.limiter) setLimiter(data.limiter);
            if (data.autoKey) setAutoKey(data.autoKey);
            if (data.vstSlots) setVstSlots(data.vstSlots);
            if (data.isAntiFeedback !== undefined) {
              setIsAntiFeedback(data.isAntiFeedback);
              audioEngineInstance.setAntiFeedback(data.isAntiFeedback);
            }
            alert('Đã khôi phục thành công cấu hình Project .hnstudio!');
          } catch {
            alert('File cấu hình project không hợp lệ.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleNewProject = () => {
    if (confirm('Tạo phiên làm việc mới? Tất cả thông số sẽ được đưa về mặc định.')) {
      setMicVolume(1.0);
      setMusicVolume(0.85);
      setMasterVolume(1.0);
      audioEngineInstance.setMicVolume(1.0);
      audioEngineInstance.setMusicVolume(0.85);
      audioEngineInstance.setMasterVolume(1.0);
      setEqBands(DEFAULT_EQ_FREQS.map((freq) => ({ freq, gain: 0, q: 1.0, enabled: true })));
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col justify-between bg-[#07090f] text-[#f8fafc] font-sans selection:bg-[#00f0ff]/30 selection:text-white">
      {/* Top Header (Slim 42px) */}
      <Header
        isLive={isLive}
        onToggleLive={handleToggleLive}
        onOpenPopup={(id) => setActivePopup(id)}
        onNewProject={handleNewProject}
        onSaveProject={handleSaveProject}
        onOpenProject={handleOpenProject}
        onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
        onOpenVstSettings={() => setIsVstSettingsOpen(true)}
        currentKey={`${autoKey.currentKey} ${autoKey.isMajor ? 'Maj' : 'Min'}`}
        isAntiFeedback={isAntiFeedback}
        onToggleAntiFeedback={handleToggleAntiFeedback}
        onTriggerAutoDsp={handleTriggerAutoDsp}
        isAutoDspScanning={isAutoDspScanning}
      />

      {/* Main Studio Viewport (Fitted 100vh) */}
      <main className="flex-1 w-full p-2 flex flex-col justify-between gap-1.5 overflow-hidden">
        {/* ROW 1: Oscilloscope & Faders */}
        <div className="flex flex-row gap-2 items-stretch h-[155px] flex-shrink-0">
          <Oscilloscope isLive={isLive} />

          <ChannelStrips
            micVolume={micVolume}
            onMicVolumeChange={handleMicVolumeChange}
            musicVolume={musicVolume}
            onMusicVolumeChange={handleMusicVolumeChange}
            masterVolume={masterVolume}
            onMasterVolumeChange={handleMasterVolumeChange}
            meterData={meterData}
            isLive={isLive}
          />
        </div>

        {/* ROW 2: DSP Quick Bar (Gate, Comp, 13-EQ, De-Esser, Vang Ngắn, Vang Dài, Echo Delay, Limiter) */}
        <DspToolbar
          noiseGate={noiseGate}
          compressor={compressor}
          eqEnabled={eqEnabled}
          deEsser={deEsser}
          shortReverb={shortReverb}
          longReverb={longReverb}
          echoDelay={echoDelay}
          limiter={limiter}
          onToggleGate={handleToggleGate}
          onToggleComp={handleToggleComp}
          onToggleEq={handleToggleEq}
          onToggleDeEsser={handleToggleDeEsser}
          onToggleShortReverb={handleToggleShortReverb}
          onToggleLongReverb={handleToggleLongReverb}
          onToggleEchoDelay={handleToggleEchoDelay}
          onToggleLimiter={handleToggleLimiter}
          onOpenPopup={(id) => setActivePopup(id)}
        />

        {/* ROW 2.5: DÒNG NGANG SỬ DỤNG VST BÊN NGOÀI TOOL (.vst3 / .dll / Host VST) */}
        <ExternalVstBar
          vstSlots={vstSlots}
          onToggleVstBypass={handleToggleVstBypass}
          onRemoveVst={handleRemoveVst}
          onOpenVstSettings={() => setIsVstSettingsOpen(true)}
          onAddCustomPlugin={handleAddCustomPlugin}
          currentKey={`${autoKey.currentKey} ${autoKey.isMajor ? 'Maj' : 'Min'}`}
        />

        {/* ROW 3: Tab Selector for Bottom Area (To fit everything in 100vh) */}
        <div className="flex-1 flex flex-col justify-between gap-1.5 overflow-hidden">
          {/* Main Area: YouTube Karaoke & Music Player */}
          <div className="flex-1 overflow-y-auto">
            <MusicPlayerSection
              musicVolume={musicVolume}
              onMusicVolumeChange={handleMusicVolumeChange}
            />
          </div>

          {/* Bottom Bar: Quick SFX + Recording Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 flex-shrink-0">
            <div className="bg-[#101622] rounded-xl border border-[#25334e] px-2.5 py-1.5 flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold text-[#f59e0b] uppercase">SOUNDBOARD:</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => audioEngineInstance.playSfx('quick-applause', { preset: 'applause', volume: 1.0 })}
                    className="px-2 py-1 rounded bg-[#161f30] hover:bg-[#00f0ff]/20 text-[11px] font-medium text-[#cbd5e1] hover:text-[#00f0ff] border border-[#25334e] transition-colors cursor-pointer"
                  >
                    👏 Vỗ tay
                  </button>
                  <button
                    onClick={() => audioEngineInstance.playSfx('quick-laugh', { preset: 'laugh', volume: 1.0 })}
                    className="px-2 py-1 rounded bg-[#161f30] hover:bg-[#f59e0b]/20 text-[11px] font-medium text-[#cbd5e1] hover:text-[#f59e0b] border border-[#25334e] transition-colors cursor-pointer"
                  >
                    😂 Cười
                  </button>
                  <button
                    onClick={() => audioEngineInstance.playSfx('quick-horn', { preset: 'horn', volume: 1.0 })}
                    className="px-2 py-1 rounded bg-[#161f30] hover:bg-[#ff3366]/20 text-[11px] font-medium text-[#cbd5e1] hover:text-[#ff3366] border border-[#25334e] transition-colors cursor-pointer"
                  >
                    📢 Còi DJ
                  </button>
                  <button
                    onClick={() => audioEngineInstance.playSfx('quick-crowd', { preset: 'crowd', volume: 1.0 })}
                    className="px-2 py-1 rounded bg-[#161f30] hover:bg-[#a855f7]/20 text-[11px] font-medium text-[#cbd5e1] hover:text-[#a855f7] border border-[#25334e] transition-colors cursor-pointer"
                  >
                    🎉 Hò reo
                  </button>
                </div>
              </div>

              <button
                onClick={() => setIsVstSettingsOpen(true)}
                className="text-[10px] text-[#00f0ff] hover:underline font-semibold cursor-pointer"
              >
                + Thêm VST3 / SFX
              </button>
            </div>

            <RecordingSection />
          </div>
        </div>
      </main>

      {/* Popups, VST Settings, Code Viewer */}
      <Popups
        activePopup={activePopup}
        onClose={() => setActivePopup(null)}
        noiseGate={noiseGate}
        onUpdateNoiseGate={(p) => {
          setNoiseGate((prev) => ({ ...prev, ...p }));
          audioEngineInstance.updateNoiseGate(p);
        }}
        compressor={compressor}
        onUpdateCompressor={(p) => {
          setCompressor((prev) => ({ ...prev, ...p }));
          audioEngineInstance.updateCompressor(p);
        }}
        eqBands={eqBands}
        onUpdateEqBand={(idx, b) => {
          setEqBands((prev) => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ...b };
            audioEngineInstance.updateEqBand(idx, b);
            return copy;
          });
        }}
        deEsser={deEsser}
        onUpdateDeEsser={(p) => {
          setDeEsser((prev) => ({ ...prev, ...p }));
          audioEngineInstance.updateDeEsser(p);
        }}
        reverb={reverb}
        onUpdateReverb={(p) => {
          setReverb((prev) => ({ ...prev, ...p }));
          audioEngineInstance.updateReverb(p);
        }}
        shortReverb={shortReverb}
        onUpdateShortReverb={(p) => {
          setShortReverb((prev) => ({ ...prev, ...p }));
          audioEngineInstance.updateShortReverb(p);
        }}
        longReverb={longReverb}
        onUpdateLongReverb={(p) => {
          setLongReverb((prev) => ({ ...prev, ...p }));
          audioEngineInstance.updateLongReverb(p);
        }}
        echoDelay={echoDelay}
        onUpdateEchoDelay={(p) => {
          setEchoDelay((prev) => ({ ...prev, ...p }));
          audioEngineInstance.updateEchoDelay(p);
        }}
        limiter={limiter}
        onUpdateLimiter={(p) => {
          setLimiter((prev) => ({ ...prev, ...p }));
          audioEngineInstance.updateLimiter(p);
        }}
        autoKey={autoKey}
        onUpdateAutoKey={(p) => setAutoKey((prev) => ({ ...prev, ...p }))}
        vstSlots={vstSlots}
        onToggleVstBypass={handleToggleVstBypass}
        onMoveVstUp={handleMoveVstUp}
        onMoveVstDown={handleMoveVstDown}
        onRemoveVst={handleRemoveVst}
        onAddVstClick={handleAddVstClick}
      />

      <VstSettingsModal
        isOpen={isVstSettingsOpen}
        onClose={() => setIsVstSettingsOpen(false)}
        activeRackSlots={vstSlots}
        onInsertPluginToRack={handleInsertPluginFromScanner}
        onAddCustomPlugin={handleAddCustomPlugin}
      />

      <ProjectCodeViewer
        isOpen={isCodeViewerOpen}
        onClose={() => setIsCodeViewerOpen(false)}
      />

      {/* AI AUTO-DSP SCANNING MODAL */}
      {isAutoDspScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#101622] rounded-2xl border border-[#d946ef]/50 p-6 shadow-[0_0_50px_rgba(217,70,239,0.3)] text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#d946ef] to-[#00f0ff] p-[2px] shadow-[0_0_20px_rgba(217,70,239,0.5)]">
              <div className="w-full h-full bg-[#0a0d14] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-[#d946ef] animate-spin" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-black text-white tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-[#d946ef] via-[#00f0ff] to-[#00ff88]">
                AI SMART VOCAL CALIBRATION
              </h3>
              <p className="text-xs text-[#94a3b8] mt-1">{autoDspStepMsg}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#1e293b] h-2.5 rounded-full overflow-hidden border border-[#25334e]">
              <div
                className="h-full bg-gradient-to-r from-[#d946ef] via-[#00f0ff] to-[#00ff88] transition-all duration-300"
                style={{ width: `${autoDspPercent}%` }}
              />
            </div>

            <div className="text-[11px] text-[#64748b] bg-[#0a0d14] p-2.5 rounded-lg border border-[#1e293b] flex items-center justify-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-[#00ff88]" />
              <span>Đang đo dải tần & kích hoạt bộ lọc Chống Hú 4-Point Surgical Notch</span>
            </div>
          </div>
        </div>
      )}

      {/* Slim Status Footer (24px) */}
      <footer className="border-t border-[#1e293b] bg-[#0a0d14] px-3 py-1 flex items-center justify-between text-[10px] text-[#64748b] flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span>Hoài Nguyễn Studio • Zalo: <strong className="text-[#00f0ff] font-mono">0965.043.000</strong></span>
          <span className="text-[#00ff88]">✓ Chống Hú Active</span>
        </div>
        <div className="flex items-center space-x-3 text-[#94a3b8]">
          <span>⚡ Độ trễ: ~2.4ms (Turbo 0-Lag)</span>
          <span className="text-[#38bdf8]">64-Bit Host Audio</span>
        </div>
      </footer>
    </div>
  );
}
