import React, { useState, useEffect } from 'react';
import {
  X,
  Mic,
  Headphones,
  Music,
  Radio,
  Zap,
  Check,
  Save,
  Volume2,
  Sliders,
  Sparkles,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { audioEngineInstance } from '../services/webAudioEngine';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDevicesUpdated?: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
  onDevicesUpdated,
}) => {
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>('');
  const [selectedOutputId, setSelectedOutputId] = useState<string>('');
  const [latencyMs, setLatencyMs] = useState<number>(2.1);
  const [isSystemAudioActive, setIsSystemAudioActive] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const refreshDeviceList = async () => {
    setIsScanning(true);
    try {
      const devInfo = await audioEngineInstance.getAvailableDevices();
      setInputs(devInfo.inputs);
      setOutputs(devInfo.outputs);
      setSelectedInputId(audioEngineInstance.getActiveInputDeviceId() || (devInfo.inputs[0]?.deviceId ?? ''));
      setSelectedOutputId(audioEngineInstance.getActiveOutputDeviceId() || (devInfo.outputs[0]?.deviceId ?? ''));
      setLatencyMs(audioEngineInstance.getLatencyMs());
      setIsSystemAudioActive(audioEngineInstance.isSystemAudioCaptured());
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshDeviceList();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectInput = async (deviceId: string) => {
    setSelectedInputId(deviceId);
    await audioEngineInstance.switchInputDevice(deviceId);
    audioEngineInstance.saveAudioConfig();
    onDevicesUpdated?.();
  };

  const handleSelectOutput = async (deviceId: string) => {
    setSelectedOutputId(deviceId);
    await audioEngineInstance.setOutputDevice(deviceId);
    audioEngineInstance.saveAudioConfig();
    onDevicesUpdated?.();
  };

  const handleToggleSystemLoopback = async () => {
    if (isSystemAudioActive) {
      audioEngineInstance.stopSystemAudioCapture();
      setIsSystemAudioActive(false);
    } else {
      const ok = await audioEngineInstance.startSystemAudioCapture();
      setIsSystemAudioActive(ok);
    }
  };

  const handleSaveAndClose = () => {
    audioEngineInstance.saveAudioConfig();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0c121e] border border-[#25334e] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b] bg-[#111928]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#00f0ff] to-[#a855f7] text-black">
              <Sliders className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide flex items-center space-x-2">
                <span>CÀI ĐẶT SOUNDCARD & ĐỊNH TUYẾN ÂM THANH</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40 font-bold">
                  AUTO-DETECT
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8]">
                Quản lý thiết bị Micro, Soundcard USB, Loa/Tai nghe & Độ trễ thời gian thực
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e293b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Section 1: Microphone Input (Đầu vào Micro) */}
          <div className="space-y-2 bg-[#141b2a] p-3.5 rounded-xl border border-[#1e293b]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider flex items-center space-x-1.5">
                <Mic className="w-4 h-4 text-[#00f0ff]" />
                <span>1. ĐẦU VÀO MICRO / SOUNDCARD (MIC INPUT)</span>
              </label>
              <button
                onClick={refreshDeviceList}
                disabled={isScanning}
                className="text-[11px] text-[#94a3b8] hover:text-white flex items-center space-x-1 cursor-pointer bg-[#0a0d14] px-2 py-1 rounded border border-[#25334e]"
              >
                <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                <span>Quét lại Soundcard</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {inputs.length === 0 ? (
                <div className="text-xs text-[#64748b] italic py-2">
                  Đang dùng thiết bị mặc định của hệ thống...
                </div>
              ) : (
                inputs.map((d) => {
                  const isSelected = selectedInputId === d.deviceId || (!selectedInputId && d.deviceId === 'default');
                  return (
                    <button
                      key={d.deviceId}
                      onClick={() => handleSelectInput(d.deviceId)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/50 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          : 'bg-[#0a0d14] text-[#cbd5e1] hover:bg-[#1e293b] border border-[#1e293b]'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#00f0ff] animate-pulse' : 'bg-[#475569]'}`} />
                        <span className="truncate">{d.label || `Microphone (${d.deviceId.slice(0, 8)}...)`}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#00f0ff] flex-shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>
            <p className="text-[11px] text-[#64748b]">
              💡 Chọn đúng Soundcard (Focusrite, Behringer, Yamaha, K10, Icon Upod...) hoặc Micro USB bạn đang cắm.
            </p>
          </div>

          {/* Section 2: Music / Beat Input Routing (Đầu vào Nhạc) */}
          <div className="space-y-2 bg-[#141b2a] p-3.5 rounded-xl border border-[#1e293b]">
            <label className="text-xs font-bold text-[#ff007f] uppercase tracking-wider flex items-center space-x-1.5">
              <Music className="w-4 h-4 text-[#ff007f]" />
              <span>2. ĐẦU VÀO NHẠC BEAT (MUSIC ROUTING)</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-[#0a0d14] border border-[#1e293b] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Trình phát trong Tool (YouTube / MP3)</div>
                  <div className="text-[10px] text-[#94a3b8]">Tự động chạy qua Fader Beat & EQ</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#00ff88]/20 text-[#00ff88] font-bold">
                  LUÔN SẴN SÀNG
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0a0d14] border border-[#1e293b] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Thu âm thanh máy tính (Loopback)</div>
                  <div className="text-[10px] text-[#94a3b8]">Bắt toàn bộ tiếng nhạc từ Tab YouTube / Desktop</div>
                </div>
                <button
                  onClick={handleToggleSystemLoopback}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    isSystemAudioActive
                      ? 'bg-[#ff3366] text-white shadow-[0_0_10px_rgba(255,51,102,0.3)]'
                      : 'bg-[#00ff88] text-black shadow-[0_0_10px_rgba(0,255,136,0.3)]'
                  }`}
                >
                  <Radio className="w-3 h-3" />
                  <span>{isSystemAudioActive ? 'ĐANG BẬT' : 'BẬT THU'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Audio Output (Đầu ra Loa / Tai nghe) */}
          <div className="space-y-2 bg-[#141b2a] p-3.5 rounded-xl border border-[#1e293b]">
            <label className="text-xs font-bold text-[#00ff88] uppercase tracking-wider flex items-center space-x-1.5">
              <Headphones className="w-4 h-4 text-[#00ff88]" />
              <span>3. ĐẦU RA ÂM THANH (SPEAKER / HEADPHONES OUTPUT)</span>
            </label>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {outputs.length === 0 ? (
                <div className="text-xs text-[#64748b] italic py-2">
                  Đang dùng ngõ ra Loa / Tai nghe mặc định của Windows...
                </div>
              ) : (
                outputs.map((d) => {
                  const isSelected = selectedOutputId === d.deviceId || (!selectedOutputId && d.deviceId === 'default');
                  return (
                    <button
                      key={d.deviceId}
                      onClick={() => handleSelectOutput(d.deviceId)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/50 shadow-[0_0_10px_rgba(0,255,136,0.2)]'
                          : 'bg-[#0a0d14] text-[#cbd5e1] hover:bg-[#1e293b] border border-[#1e293b]'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#00ff88] animate-pulse' : 'bg-[#475569]'}`} />
                        <span className="truncate">{d.label || `Speaker / Headphones (${d.deviceId.slice(0, 8)}...)`}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#00ff88] flex-shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 4: Real-time Latency & Settings Persistence */}
          <div className="p-3 bg-[#0a0d14] rounded-xl border border-[#1e293b] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs">
              <Zap className="w-4 h-4 text-[#f59e0b]" />
              <div>
                <span className="font-bold text-white">ĐỘ TRỄ PHẦN CỨNG THỰC TẾ: </span>
                <span className="font-mono text-[#00ff88] font-black text-sm">{latencyMs.toFixed(1)} ms</span>
                <span className="text-[10px] text-[#94a3b8] ml-2">(Chuẩn 0-Lag hát trực tiếp không bị trễ)</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-[#00f0ff]">
              <ShieldCheck className="w-4 h-4" />
              <span>Tự động lưu vào bộ nhớ máy tính</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#1e293b] bg-[#111928]">
          <div className="text-xs text-[#64748b]">
            Tất cả thiết bị sẽ được tự động nhớ cho những lần mở sau.
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-[#94a3b8] hover:text-white hover:bg-[#1e293b] transition-colors cursor-pointer"
            >
              ĐÓNG
            </button>
            <button
              onClick={handleSaveAndClose}
              className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                saveSuccess
                  ? 'bg-[#00ff88] text-black shadow-[0_0_15px_rgba(0,255,136,0.4)]'
                  : 'bg-gradient-to-r from-[#00f0ff] to-[#a855f7] hover:opacity-90 text-black shadow-[0_0_15px_rgba(0,240,255,0.3)]'
              }`}
            >
              {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{saveSuccess ? 'ĐÃ LƯU THÀNH CÔNG!' : 'LƯU CÀI ĐẶT THIẾT BỊ'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
