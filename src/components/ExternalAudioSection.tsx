import React, { useState, useEffect } from 'react';
import {
  Radio,
  Volume2,
  Zap,
  Headphones,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Music2,
  SlidersHorizontal,
} from 'lucide-react';
import { audioEngineInstance } from '../services/webAudioEngine';

interface ExternalAudioSectionProps {
  musicVolume: number;
  onMusicVolumeChange: (vol: number) => void;
}

export const ExternalAudioSection: React.FC<ExternalAudioSectionProps> = ({
  musicVolume,
  onMusicVolumeChange,
}) => {
  const [isSystemAudioActive, setIsSystemAudioActive] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(2.1);
  const [activeTab, setActiveTab] = useState<'loopback' | 'guide'>('loopback');

  useEffect(() => {
    const interval = setInterval(() => {
      setIsSystemAudioActive(audioEngineInstance.isSystemAudioCaptured());
      setLatencyMs(audioEngineInstance.getLatencyMs());
    }, 250);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSystemAudio = async () => {
    if (isSystemAudioActive) {
      audioEngineInstance.stopSystemAudioCapture();
      setIsSystemAudioActive(false);
    } else {
      const ok = await audioEngineInstance.startSystemAudioCapture();
      setIsSystemAudioActive(ok);
    }
  };

  return (
    <div className="bg-[#101622] rounded-xl border border-[#25334e] p-3 shadow-xl flex flex-col justify-between h-full">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e293b] pb-2.5 mb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-[#00f0ff] to-[#a855f7] text-black">
            <Radio className="w-4 h-4 font-bold" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white tracking-wider flex items-center space-x-2">
              <span>ĐƯỜNG VÀO ÂM THANH BÊN NGOÀI (BEAT & YOUTUBE)</span>
              {isSystemAudioActive ? (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40 font-bold flex items-center space-x-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
                  <span>● ĐÃ KẾT NỐI (BEAT ĐANG CHẠY VÀO MIXER)</span>
                </span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 font-bold">
                  CHƯA BẬT
                </span>
              )}
            </h3>
            <p className="text-[10px] text-[#94a3b8]">
              Nhận toàn bộ tiếng nhạc từ YouTube, trình duyệt hoặc phần mềm phát nhạc bên ngoài máy tính
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setActiveTab('loopback')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'loopback'
                ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white'
            }`}
          >
            ĐIỀU KHIỂN BEAT
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              activeTab === 'guide'
                ? 'bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/40'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>HƯỚNG DẪN 3 BƯỚC</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'loopback' ? (
        <div className="space-y-3">
          {/* Loopback 1-Click Banner */}
          <div
            className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-all ${
              isSystemAudioActive
                ? 'bg-[#00ff88]/10 border-[#00ff88]/50 shadow-[0_0_20px_rgba(0,255,136,0.2)]'
                : 'bg-[#141b2a] border-[#00f0ff]/30 shadow-[0_0_15px_rgba(0,240,255,0.08)]'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isSystemAudioActive
                    ? 'bg-[#00ff88]/20 text-[#00ff88] animate-pulse border border-[#00ff88]/40'
                    : 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40'
                }`}
              >
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-white flex items-center space-x-2">
                  <span>THU ÂM THANH MÁY TÍNH / YOUTUBE (LOOPBACK)</span>
                  <span className="text-[10px] text-[#00ff88] font-mono font-bold">
                    [Độ trễ: {latencyMs.toFixed(1)}ms]
                  </span>
                </div>
                <p className="text-[11px] text-[#cbd5e1] mt-0.5">
                  {isSystemAudioActive
                    ? '✓ Tiếng nhạc Beat từ YouTube / Máy tính đang truyền thẳng qua Fader BEAT & Bộ thu âm! Bạn có thể chỉnh âm lượng tùy ý.'
                    : '👉 Bấm nút bên phải, chọn "Tab YouTube" (hoặc Toàn bộ màn hình) & TÍCH CHỌN "Chia sẻ âm thanh" (Share audio) để bắt đầu hát!'}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleSystemAudio}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
                isSystemAudioActive
                  ? 'bg-[#ff3366] hover:bg-[#cc2952] text-white shadow-[0_0_15px_rgba(255,51,102,0.4)]'
                  : 'bg-gradient-to-r from-[#00f0ff] to-[#00ff88] hover:opacity-95 text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>{isSystemAudioActive ? 'TẮT BẮT ÂM THANH' : '⚡ BẬT BẮT ÂM THANH YOUTUBE'}</span>
            </button>
          </div>

          {/* Fader & Live Balance Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-[#0a0d14] p-2.5 rounded-xl border border-[#1e293b]">
            <div className="flex items-center space-x-3">
              <Volume2 className="w-4 h-4 text-[#00f0ff]" />
              <div className="flex-1">
                <div className="flex justify-between text-[11px] font-bold text-[#94a3b8] mb-1">
                  <span>ÂM LƯỢNG NHẠC BEAT (FADER BEAT):</span>
                  <span className="text-[#00f0ff] font-mono">{(musicVolume * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.01"
                  value={musicVolume}
                  onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-[#00f0ff] cursor-pointer h-1.5 bg-[#1e293b] rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 text-xs">
              <span className="text-[11px] text-[#94a3b8]">Trạng thái xử lý:</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30 font-bold">
                ✓ 64-Bit Studio Native DSP (0-Pop)
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* 3-Step Guide */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-1">
          <div className="bg-[#141b2a] p-3 rounded-xl border border-[#1e293b] space-y-1">
            <div className="text-xs font-black text-[#00f0ff] flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-[#00f0ff]/20 flex items-center justify-center text-[10px]">1</span>
              <span>MỞ NHẠC BÊN NGOÀI</span>
            </div>
            <p className="text-[11px] text-[#94a3b8]">
              Mở bài hát Karaoke trên YouTube, Zing MP3 hoặc Spotify trên màn hình máy tính của bạn.
            </p>
          </div>

          <div className="bg-[#141b2a] p-3 rounded-xl border border-[#1e293b] space-y-1">
            <div className="text-xs font-black text-[#a855f7] flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-[#a855f7]/20 flex items-center justify-center text-[10px]">2</span>
              <span>BẬT BẮT ÂM THANH</span>
            </div>
            <p className="text-[11px] text-[#94a3b8]">
              Bấm nút <strong>[⚡ BẬT BẮT ÂM THANH YOUTUBE]</strong>, chọn Tab phát nhạc và nhớ <strong>TÍCH CHỌN "Chia sẻ âm thanh"</strong>.
            </p>
          </div>

          <div className="bg-[#141b2a] p-3 rounded-xl border border-[#1e293b] space-y-1">
            <div className="text-xs font-black text-[#00ff88] flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-[#00ff88]/20 flex items-center justify-center text-[10px]">3</span>
              <span>BẬT LIVE & TỎA SÁNG</span>
            </div>
            <p className="text-[11px] text-[#94a3b8]">
              Bấm nút <strong>LIVE ON</strong> ở trên cùng. Giọng hát qua Vang/Echo sẽ hòa quyện êm ái cùng tiếng Beat không hề bị nổ!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
