import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Oscilloscope } from './components/Oscilloscope';
import { ChannelStrips } from './components/ChannelStrip';
import { DspToolbar } from './components/DspToolbar';
import { VstPanel } from './components/VstPanel';
import { MusicPlayerSection } from './components/MusicPlayerSection';
import { SfxSection } from './components/SfxSection';
import { RecordingSection } from './components/RecordingSection';
import { Popups } from './components/Popups';
import { ProjectCodeViewer } from './components/ProjectCodeViewer';
import { audioEngineInstance, DEFAULT_EQ_FREQS } from './services/webAudioEngine';
import {
  BandSetting,
  NoiseGateParams,
  CompressorParams,
  DeEsserParams,
  ReverbParams,
  LimiterParams,
  AutoKeyParams,
  VstPluginSlot,
  AudioMeterData,
} from './types/audio';

export default function App() {
  const [isLive, setIsLive] = useState(false);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);

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
    attack: 5,
    release: 120,
    range: -60,
  });

  const [compressor, setCompressor] = useState<CompressorParams>({
    enabled: true,
    threshold: -18,
    ratio: 3.5,
    attack: 15,
    release: 140,
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
    threshold: -24,
    amount: 0.5,
  });

  const [reverb, setReverb] = useState<ReverbParams>({
    enabled: true,
    roomSize: 0.6,
    damping: 0.45,
    width: 0.85,
    wet: 0.35,
    dry: 1.0,
    preDelay: 25,
    preset: 'Vocal',
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
      const ok = await audioEngineInstance.startLiveMic();
      if (ok) setIsLive(true);
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
    const name = prompt('Nhập tên Plugin VST3 muốn chèn (Ví dụ: iZotope Nectar, Valhalla Reverb, Melodyne):', 'Waves Tune Real-Time (VST3)');
    if (name) {
      const newSlot: VstPluginSlot = {
        id: `vst-${Date.now()}`,
        name: name,
        path: `C:\\Program Files\\Common Files\\VST3\\${name.replace(/[^a-zA-Z0-9]/g, '')}.vst3`,
        enabled: true,
        bypassed: false,
        editorOpen: false,
        type: 'Plugin Insert',
      };
      setVstSlots((prev) => [...prev, newSlot]);
    }
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
    <div className="min-h-screen bg-[#07090f] text-[#f8fafc] flex flex-col font-sans selection:bg-[#00f0ff]/30 selection:text-white">
      {/* Top Header */}
      <Header
        isLive={isLive}
        onToggleLive={handleToggleLive}
        onOpenPopup={(id) => setActivePopup(id)}
        onNewProject={handleNewProject}
        onSaveProject={handleSaveProject}
        onOpenProject={handleOpenProject}
        onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
        currentKey={`${autoKey.currentKey} ${autoKey.isMajor ? 'Maj' : 'Min'}`}
      />

      {/* Main Studio Console Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-3">
        {/* Top Section: Channels & Realtime Waveform */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Realtime Waveform Oscilloscope */}
          <Oscilloscope isLive={isLive} />

          {/* Faders & VU Meters */}
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

        {/* DSP Quick Toolbar */}
        <DspToolbar
          noiseGate={noiseGate}
          compressor={compressor}
          eqEnabled={eqEnabled}
          deEsser={deEsser}
          reverb={reverb}
          limiter={limiter}
          onToggleGate={handleToggleGate}
          onToggleComp={handleToggleComp}
          onToggleEq={handleToggleEq}
          onToggleDeEsser={handleToggleDeEsser}
          onToggleReverb={handleToggleReverb}
          onToggleLimiter={handleToggleLimiter}
          onOpenPopup={(id) => setActivePopup(id)}
        />

        {/* Auto-Tune & VST Insert Rack */}
        <VstPanel
          autoKey={autoKey}
          vstSlots={vstSlots}
          onOpenPopup={(id) => setActivePopup(id)}
          onToggleVstBypass={handleToggleVstBypass}
          onMoveVstUp={handleMoveVstUp}
          onMoveVstDown={handleMoveVstDown}
          onRemoveVst={handleRemoveVst}
          onOpenVstEditor={handleOpenVstEditor}
          onAddVstClick={handleAddVstClick}
        />

        {/* Music Player Beat Section */}
        <MusicPlayerSection
          musicVolume={musicVolume}
          onMusicVolumeChange={handleMusicVolumeChange}
        />

        {/* SFX & Recording */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SfxSection />
          <RecordingSection />
        </div>
      </main>

      {/* Popups and Code Viewer Modals */}
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

      <ProjectCodeViewer
        isOpen={isCodeViewerOpen}
        onClose={() => setIsCodeViewerOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[#1e293b] bg-[#0a0d14] px-4 py-3 text-center text-xs text-[#64748b]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Bản quyền © <strong className="text-[#f8fafc]">Hoài Nguyễn Studio</strong> • Zalo hỗ trợ: <strong className="text-[#00f0ff] font-mono">0965.043.000</strong>
          </span>
          <span className="text-[#94a3b8]">
            Động cơ C++ JUCE 7.0.12 • Native VST3 Host Windows x64 • Ultra Low Latency
          </span>
        </div>
      </footer>
    </div>
  );
}
