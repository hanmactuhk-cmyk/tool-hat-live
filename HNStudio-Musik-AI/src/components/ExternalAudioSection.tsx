import React, { useState, useEffect } from 'react';
import {
  Music,
  Radio,
  Volume2,
  VolumeX,
  Sliders,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Speaker,
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
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [bassGain, setBassGain] = useState<number>(0);
  const [trebleGain, setTrebleGain] = useState<number>(0);

  const loadDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((d) => d.kind === 'audioinput');
      setAudioDevices(inputs);
      if (inputs.length > 0 && !selectedDeviceId) {
        // Try to find Stereo Mix or Virtual Cable or default
        const stereoMix = inputs.find((d) =>
          d.label.toLowerCase().includes('stereo mix') ||
          d.label.toLowerCase().includes('virtual') ||
          d.label.toLowerCase().includes('loopback') ||
          d.label.toLowerCase().includes('cable')
        );
        setSelectedDeviceId(stereoMix ? stereoMix.deviceId : inputs[0].deviceId);
      }
    } catch (e) {
      console.warn('Could not list audio devices:', e);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleToggleConnect = async () => {
    if (isConnected) {
      audioEngineInstance.stopSystemAudioCapture();
      setIsConnected(false);
    } else {
      if (!selectedDeviceId) {
        alert('Vui lòng chọn thiết bị thu âm thanh hệ thống (Stereo Mix hoặc Virtual Cable)');
        return;
      }
      const ok = await audioEngineInstance.startStereoMixInput(selectedDeviceId);
      setIsConnected(ok);
      if (!ok) {
        alert('Không thể kết nối thiết bị này. Vui lòng kiểm tra quyền Microphone hoặc chọn thiết bị khác.');
      }
    }
  };

  const handleBassChange = (val: number) => {
    setBassGain(val);
    audioEngineInstance.setMusicBass(val);
  };

  const handleTrebleChange = (val: number) => {
    setTrebleGain(val);
    audioEngineInstance.setMusicTreble(val);
  };

  const handleMuteToggle = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    onMusicVolumeChange(nextMute ? 0 : 0.85);
  };

  return (
    <div className="bg-[#101622] rounded-xl border border-[#25334e] p-3 shadow-xl flex flex-col justify-between h-full">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e293b] pb-2.5 mb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-[#ff007f] to-[#00f0ff] text-white">
            <Radio className="w-4 h-4 font-bold" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white tracking-wider flex items-center space-x-2">
              <span>ĐƯỜNG VÀO YOUTUBE / ÂM THANH MÁY TÍNH 🎵 (STEREO MIX / VIRTUAL CABLE)</span>
              {isConnected ? (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40 font-bold animate-pulse">
                  ● ĐANG KẾT NỐI (NHẬN NHẠC TỪ TRÌNH DUYỆT NGOÀI)
                </span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 font-bold">
                  CHƯA KẾT NỐI
                </span>
              )}
            </h3>
            <p className="text-[10px] text-[#94a3b8]">
              Mở YouTube ở trình duyệt ngoài ➔ Chọn thiết bị Loopback/Stereo Mix ➔ Beat Bus (Không qua Vocal FX) ➔ MASTER
            </p>
          </div>
        </div>

        {/* Refresh Devices */}
        <button
          onClick={loadDevices}
          className="p-1.5 rounded-lg bg-[#161f30] text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff]/20 transition-all cursor-pointer flex items-center space-x-1 text-[10px]"
          title="Làm mới danh sách thiết bị"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Quét thiết bị</span>
        </button>
      </div>

      {/* Device Selector & Connect Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-2.5 bg-[#141b2a] p-3 rounded-xl border border-[#1e293b]">
        <div>
          <label className="block text-[10px] font-bold text-[#94a3b8] mb-1">
            CHỌN THIẾT BỊ THU ÂM THANH MÁY TÍNH / STEREO MIX / VIRTUAL CABLE:
          </label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="w-full bg-[#0a0d14] border border-[#25334e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
          >
            {audioDevices.length === 0 ? (
              <option value="">Đang tìm thiết bị âm thanh...</option>
            ) : (
              audioDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Thiết bị đầu vào (${d.deviceId.slice(0, 6)}...)`}
                </option>
              ))
            )}
          </select>
          <p className="text-[9px] text-[#64748b] mt-1">
            💡 Mẹo: Chọn <b>Stereo Mix</b>, <b>VB-Audio Virtual Cable</b> hoặc <b>CABLE Output</b> để nhận toàn bộ âm thanh phát từ YouTube trên trình duyệt ngoài.
          </p>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={handleToggleConnect}
            className={`w-full md:w-auto px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              isConnected
                ? 'bg-[#ff3366] text-white shadow-[0_0_20px_rgba(255,51,102,0.5)] animate-pulse'
                : 'bg-gradient-to-r from-[#ff007f] to-[#00f0ff] text-white shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:opacity-90'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{isConnected ? 'NGẮT KẾT NỐI ÂM THANH MÁY TÍNH' : '⚡ KẾT NỐI ÂM THANH MÁY TÍNH / YOUTUBE'}</span>
          </button>
        </div>
      </div>

      {/* Beat Channel Strip (Beat Volume / EQ / Mute -> Master Mixer) */}
      <div className="bg-[#141b2a] p-3 rounded-xl border border-[#1e293b]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Status info */}
          <div className="flex items-center space-x-2.5">
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-[#00ff88] animate-pulse' : 'bg-[#64748b]'}`} />
            <div>
              <div className="text-[10px] text-[#94a3b8]">Trạng thái Beat Bus:</div>
              <div className="text-xs font-bold text-white">
                {isConnected ? '🟢 Đang nhận âm thanh trình duyệt ngoài' : '⚪ Đang chờ kết nối'}
              </div>
            </div>
          </div>

          {/* Beat EQ: Bass & Treble (Independent of Vocal FX) */}
          <div className="flex items-center space-x-3 border-x border-[#1e293b] px-3">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold text-[#94a3b8] mb-1">
                <span>BEAT BASS:</span>
                <span className="text-[#00f0ff] font-mono">{bassGain > 0 ? `+${bassGain}dB` : `${bassGain}dB`}</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={bassGain}
                onChange={(e) => handleBassChange(parseFloat(e.target.value))}
                className="w-full accent-[#00f0ff] cursor-pointer h-1.5 bg-[#0a0d14] rounded-lg"
              />
            </div>

            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold text-[#94a3b8] mb-1">
                <span>BEAT TREBLE:</span>
                <span className="text-[#a855f7] font-mono">{trebleGain > 0 ? `+${trebleGain}dB` : `${trebleGain}dB`}</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={trebleGain}
                onChange={(e) => handleTrebleChange(parseFloat(e.target.value))}
                className="w-full accent-[#a855f7] cursor-pointer h-1.5 bg-[#0a0d14] rounded-lg"
              />
            </div>
          </div>

          {/* Beat Volume / Mute -> Master Mixer */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleMuteToggle}
              className={`p-2 rounded-lg cursor-pointer transition-colors ${
                isMuted ? 'bg-[#ff3366]/20 text-[#ff3366] border border-[#ff3366]/40' : 'bg-[#161f30] text-[#00f0ff] hover:text-white'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold text-[#94a3b8] mb-1">
                <span>BEAT VOLUME ➔ MASTER:</span>
                <span className="text-[#ff007f] font-mono">{(musicVolume * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.01"
                value={isMuted ? 0 : musicVolume}
                onChange={(e) => {
                  onMusicVolumeChange(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="w-full accent-[#ff007f] cursor-pointer h-1.5 bg-[#0a0d14] rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
