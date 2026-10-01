import React, { useState } from 'react';
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
} from 'lucide-react';
import { generateAndDownloadProjectZip } from '../utils/projectZipBuilder';

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
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      await generateAndDownloadProjectZip();
    } catch {
      // Fallback to direct anchor if any issue
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
    <header className="bg-[#0e1422] border-b border-[#1e293b] px-4 py-3 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Author */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00f0ff] via-[#d946ef] to-[#10b981] p-[2px] shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
                <Mic className="w-5 h-5 text-[#00f0ff] animate-pulse" />
              </div>
            </div>
            {isLive && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00ff88]"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-[#00f0ff] via-[#a855f7] to-[#ff007f] drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
                HNSTUDIO MUSIK AI
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#1e293b] text-[#00f0ff] border border-[#00f0ff]/30">
                v1.0 x64
              </span>
            </div>
            <p className="text-xs text-[#94a3b8]">
              Tác giả: <span className="text-[#f8fafc] font-semibold">Hoài Nguyễn Studio</span> • Zalo: <span className="text-[#00f0ff] font-mono font-bold">0965.043.000</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Top Bar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* LIVE TOGGLE */}
          <button
            onClick={onToggleLive}
            className={`px-4 py-2 rounded-lg font-bold text-xs tracking-wider flex items-center space-x-2 transition-all duration-200 cursor-pointer ${
              isLive
                ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88] shadow-[0_0_16px_rgba(0,255,136,0.4)]'
                : 'bg-[#161f30] text-[#64748b] border border-[#25334e] hover:border-[#94a3b8]'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-[#00ff88] animate-ping' : 'bg-[#64748b]'}`} />
            <span>{isLive ? '● LIVE ON' : '○ LIVE OFF'}</span>
          </button>

          {/* AUDIO I/O */}
          <button
            onClick={() => onOpenPopup('audio_io')}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#161f30] text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff]/10 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>AUDIO I/O</span>
          </button>

          {/* AUTO KEY */}
          <button
            onClick={() => onOpenPopup('auto_key')}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#161f30] text-[#d946ef] border border-[#d946ef]/30 hover:bg-[#d946ef]/10 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Music className="w-3.5 h-3.5" />
            <span>KEY: {currentKey}</span>
          </button>

          {/* VST SETTINGS & SCAN BUTTON */}
          <button
            onClick={onOpenVstSettings}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#161f30] text-[#a855f7] border border-[#a855f7]/40 hover:bg-[#a855f7]/15 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>CÀI ĐẶT VST</span>
          </button>

          {/* PROJECT ACTIONS */}
          <div className="flex items-center space-x-1 bg-[#121824] p-1 rounded-lg border border-[#25334e]">
            <button
              onClick={onNewProject}
              className="px-2 py-1 text-xs text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e2942] rounded transition-colors"
              title="Tạo Project Mới"
            >
              NEW
            </button>
            <button
              onClick={onOpenProject}
              className="px-2 py-1 text-xs text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e2942] rounded transition-colors flex items-center space-x-1"
              title="Mở Project"
            >
              <FolderOpen className="w-3 h-3" />
              <span>OPEN</span>
            </button>
            <button
              onClick={onSaveProject}
              className="px-2 py-1 text-xs text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e2942] rounded transition-colors flex items-center space-x-1"
              title="Lưu Project"
            >
              <Save className="w-3 h-3" />
              <span>SAVE</span>
            </button>
          </div>

          {/* GITHUB ACTIONS */}
          <button
            onClick={onOpenCodeViewer}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#161f30] text-[#38bdf8] border border-[#38bdf8]/40 hover:bg-[#38bdf8]/10 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Github className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>GITHUB ACTIONS</span>
          </button>

          {/* GUIDE BUTTON */}
          <button
            onClick={() => onOpenPopup('guide')}
            className="px-2.5 py-2 rounded-lg text-xs font-semibold bg-[#161f30] text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/10 transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">HƯỚNG DẪN</span>
          </button>

          {/* SAFE ZIP DOWNLOAD BUTTON (IN-MEMORY JSZIP + VALID BLOB) */}
          <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className="px-3.5 py-2 rounded-lg text-xs font-black bg-gradient-to-r from-[#00f0ff] to-[#a855f7] text-[#0a0d14] hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
            <span>{isDownloading ? 'ĐANG TẠO ZIP...' : 'TẢI ZIP DỰ ÁN'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
