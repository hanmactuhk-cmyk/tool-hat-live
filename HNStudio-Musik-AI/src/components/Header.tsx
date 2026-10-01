import React, { useState, useEffect } from 'react';
import {
  Mic,
  Sliders,
  Music,
  FolderOpen,
  Save,
  HelpCircle,
  Download,
  Github,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  Headphones,
  Cpu,
} from 'lucide-react';
import { generateAndDownloadProjectZip } from '../utils/projectZipBuilder';
import { audioEngineInstance } from '../services/webAudioEngine';

interface HeaderProps {
  isLive: boolean;
  onToggleLive: () => void;
  onOpenPopup: (id: string) => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onOpenProject: () => void;
  onOpenCodeViewer: () => void;
  onOpenVstSettings: () => void;
  currentKey: string;
  isAntiFeedback: boolean;
  onToggleAntiFeedback: () => void;
  onTriggerAutoDsp: () => void;
  isAutoDspScanning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isLive,
  onToggleLive,
  onOpenPopup,
  onNewProject,
  onSaveProject,
  onOpenProject,
  onOpenCodeViewer,
  onOpenVstSettings,
  currentKey,
  isAntiFeedback,
  onToggleAntiFeedback,
  onTriggerAutoDsp,
  isAutoDspScanning,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [availableInputs, setAvailableInputs] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceName, setActiveDeviceName] = useState('Đang quét Soundcard...');

  // Auto-detect soundcards and USB interfaces
  const refreshDevices = async () => {
    const info = await audioEngineInstance.getAvailableDevices();
    setAvailableInputs(info.inputs);
    setActiveDeviceName(info.activeLabel);
  };

  useEffect(() => {
    refreshDevices();
    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
      return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
    }
  }, [isLive]);

  const handleDeviceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const devId = e.target.value;
    if (devId) {
      await audioEngineInstance.switchInputDevice(devId);
      refreshDevices();
    }
  };

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      await generateAndDownloadProjectZip();
    } catch {
      const a = document.createElement('a');
      a.href = '/HNStudio-Musik-AI.zip';
      a.download = 'HNStudio-Musik-AI.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <header className="bg-[#0e1422] border-b border-[#1e293b] px-3 py-1.5 shadow-md flex-shrink-0">
      <div className="w-full flex flex-wrap items-center justify-between gap-2">
        {/* Brand & Author */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#00f0ff] via-[#d946ef] to-[#10b981] p-[1.5px] shadow-[0_0_10px_rgba(0,240,255,0.3)]">
              <div className="w-full h-full bg-[#0a0d14] rounded-[6.5px] flex items-center justify-center">
                <Mic className="w-3.5 h-3.5 text-[#00f0ff]" />
              </div>
            </div>
            {isLive && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-[#00f0ff] via-[#a855f7] to-[#ff007f]">
                HNSTUDIO MUSIK AI
              </h1>
              <span className="text-[9px] uppercase font-bold tracking-widest px-1 py-0.2 rounded bg-[#1e293b] text-[#00f0ff] border border-[#00f0ff]/30">
                PRO v1.0
              </span>
            </div>
            <p className="text-[10px] text-[#64748b]">
              Hoài Nguyễn Studio • Zalo: <span className="text-[#00f0ff] font-mono">0965.043.000</span>
            </p>
          </div>
        </div>

        {/* Soundcard Auto-Detection Badge & Selector (TỰ ĐỘNG NHẬN SOUNDCARD & GIẢM ĐỘ TRỄ) */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-[#0a0d14] px-2.5 py-1 rounded-lg border border-[#00ff88]/40 shadow-[0_0_10px_rgba(0,255,136,0.15)]">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse"></span>
            <Headphones className="w-3.5 h-3.5 text-[#00ff88]" />
          </div>
          <span className="text-[10px] font-bold text-[#94a3b8]">SOUNDCARD:</span>
          {availableInputs.length > 0 ? (
            <select
              onChange={handleDeviceChange}
              className="bg-transparent text-[11px] font-bold text-[#00ff88] focus:outline-none cursor-pointer max-w-[160px] truncate"
              title="Soundcard được tự động phát hiện và kết nối trực tiếp với độ trễ cực thấp"
            >
              {availableInputs.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId} className="bg-[#101622] text-[#f8fafc]">
                  {d.label || `Audio Interface ${i + 1}`}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[11px] text-[#00ff88] font-bold truncate max-w-[160px]">
              {activeDeviceName}
            </span>
          )}
          <span className="text-[9px] px-1 py-0.2 rounded bg-[#00ff88]/20 text-[#00ff88] font-mono font-bold">
            ~2.1ms
          </span>
        </div>

        {/* TOP CENTER RUNNING MARQUEE (CHỮ CHẠY TỪ PHẢI SANG TRÁI - ĐỤC LỖ MÀU GRADIENT) */}
        <div className="flex-1 min-w-[240px] max-w-lg mx-1 bg-[#0a0d14]/80 px-2.5 py-0.5 rounded-full border border-[#d946ef]/35 overflow-hidden relative shadow-[0_0_12px_rgba(217,70,239,0.2)] flex items-center">
          <div className="animate-marquee whitespace-nowrap">
            <span className="text-xs font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#00f0ff] via-[#d946ef] to-[#ff007f] drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">
              ✨ HnStudio Musik Ai chuyên cung cấp giải pháp hát live chuyên nghiệp cho idol live, hát live nghiệp dư, giúp giọng ca của bạn hay hơn, chuyên nghiệp hơn. ✨
            </span>
          </div>
        </div>

        {/* Action Controls & Top Bar */}
        <div className="flex items-center flex-wrap gap-1.5">
          {/* LIVE TOGGLE */}
          <button
            onClick={onToggleLive}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs tracking-wider flex items-center space-x-1.5 transition-all duration-200 cursor-pointer ${
              isLive
                ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.4)]'
                : 'bg-[#161f30] text-[#64748b] border border-[#25334e] hover:border-[#94a3b8]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-[#00ff88] animate-ping' : 'bg-[#64748b]'}`} />
            <span>{isLive ? '● LIVE ON' : '○ LIVE OFF'}</span>
          </button>

          {/* ANTI-FEEDBACK TOGGLE (CHỐNG HÚ RÍT) */}
          <button
            onClick={onToggleAntiFeedback}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer ${
              isAntiFeedback
                ? 'bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/50 shadow-[0_0_10px_rgba(0,255,136,0.2)]'
                : 'bg-[#ff3366]/20 text-[#ff3366] border border-[#ff3366]/50'
            }`}
            title="Bộ triệt tiêu tần số cộng hưởng gây hú rít khi hát Live"
          >
            {isAntiFeedback ? <Shield className="w-3.5 h-3.5 text-[#00ff88]" /> : <ShieldAlert className="w-3.5 h-3.5 text-[#ff3366]" />}
            <span>{isAntiFeedback ? 'CHỐNG HÚ: BẬT' : 'CHỐNG HÚ: TẮT'}</span>
          </button>

          {/* AI SMART AUTO-CALIBRATE DSP */}
          <button
            onClick={onTriggerAutoDsp}
            disabled={isAutoDspScanning}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#d946ef]/20 to-[#00f0ff]/20 text-[#d946ef] border border-[#d946ef]/50 hover:bg-[#d946ef]/30 transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50 shadow-[0_0_10px_rgba(217,70,239,0.2)]"
            title="Tự động đo độ ồn phòng & chất giọng để cân chỉnh Noise Gate, Compressor, De-Esser, Reverb hoàn hảo!"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAutoDspScanning ? 'animate-spin text-[#00f0ff]' : 'text-[#d946ef]'}`} />
            <span>{isAutoDspScanning ? 'AI ĐANG CÂN CHỈNH...' : '🧠 AI AUTO DSP'}</span>
          </button>

          {/* AUDIO I/O */}
          <button
            onClick={() => onOpenPopup('audio_io')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#161f30] text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff]/10 transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Sliders className="w-3 h-3" />
            <span>I/O</span>
          </button>

          {/* AUTO KEY */}
          <button
            onClick={() => onOpenPopup('auto_key')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#161f30] text-[#d946ef] border border-[#d946ef]/30 hover:bg-[#d946ef]/10 transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Music className="w-3 h-3" />
            <span>KEY: {currentKey}</span>
          </button>

          {/* VST SETTINGS */}
          <button
            onClick={onOpenVstSettings}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#161f30] text-[#a855f7] border border-[#a855f7]/40 hover:bg-[#a855f7]/15 transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Settings className="w-3 h-3" />
            <span>VST</span>
          </button>

          {/* PROJECT ACTIONS */}
          <div className="flex items-center space-x-0.5 bg-[#121824] p-0.5 rounded-lg border border-[#25334e]">
            <button
              onClick={onNewProject}
              className="px-1.5 py-1 text-[11px] text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e2942] rounded transition-colors"
              title="Tạo Project Mới"
            >
              NEW
            </button>
            <button
              onClick={onOpenProject}
              className="px-1.5 py-1 text-[11px] text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e2942] rounded transition-colors"
              title="Mở Project"
            >
              OPEN
            </button>
            <button
              onClick={onSaveProject}
              className="px-1.5 py-1 text-[11px] text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e2942] rounded transition-colors"
              title="Lưu Project"
            >
              SAVE
            </button>
          </div>

          {/* GITHUB ACTIONS */}
          <button
            onClick={onOpenCodeViewer}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#161f30] text-[#38bdf8] border border-[#38bdf8]/40 hover:bg-[#38bdf8]/10 transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Github className="w-3 h-3 text-[#38bdf8]" />
            <span>BUILD EXE</span>
          </button>

          {/* GUIDE BUTTON */}
          <button
            onClick={() => onOpenPopup('guide')}
            className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-[#161f30] text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/10 transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <HelpCircle className="w-3 h-3" />
            <span className="hidden xl:inline">HƯỚNG DẪN</span>
          </button>

          {/* SAFE ZIP DOWNLOAD */}
          <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className="px-2.5 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-[#00f0ff] to-[#a855f7] text-[#0a0d14] hover:shadow-[0_0_15px_rgba(0,240,255,0.5)] transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50"
          >
            <Download className={`w-3 h-3 ${isDownloading ? 'animate-bounce' : ''}`} />
            <span>{isDownloading ? 'TẢI...' : 'ZIP'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
