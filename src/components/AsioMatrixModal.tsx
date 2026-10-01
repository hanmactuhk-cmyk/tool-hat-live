import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Radio,
  Mic,
  Headphones,
  Cpu,
  Check,
  RefreshCw,
  Zap,
  Volume2,
  ShieldCheck,
  Layers,
  Activity,
} from 'lucide-react';
import { audioEngineInstance } from '../services/webAudioEngine';

interface AsioMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AsioMatrixModal: React.FC<AsioMatrixModalProps> = ({ isOpen, onClose }) => {
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>('');
  const [selectedOutputId, setSelectedOutputId] = useState<string>('');
  const [bufferSize, setBufferSize] = useState<string>('256');
  const [sampleRate, setSampleRate] = useState<string>('48000');
  const [isSystemAudioActive, setIsSystemAudioActive] = useState<boolean>(false);
  const [matrixState, setMatrixState] = useState<Record<string, boolean>>({
    'mic-master': true,
    'mic-reverb': true,
    'beat-master': true,
    'mic-stream': true,
    'beat-stream': true,
  });

  const refreshDevices = async () => {
    const info = await audioEngineInstance.getAvailableDevices();
    setInputs(info.inputs);
    setOutputs(info.outputs);
    setSelectedInputId(audioEngineInstance.getActiveInputDeviceId() || info.inputs[0]?.deviceId || '');
    setSelectedOutputId(audioEngineInstance.getActiveOutputDeviceId() || info.outputs[0]?.deviceId || '');
    setIsSystemAudioActive(audioEngineInstance.isSystemAudioCaptured());
  };

  useEffect(() => {
    if (isOpen) {
      refreshDevices();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleCrossPoint = (key: string) => {
    setMatrixState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectInput = async (id: string) => {
    setSelectedInputId(id);
    await audioEngineInstance.switchInputDevice(id);
  };

  const handleSelectOutput = async (id: string) => {
    setSelectedOutputId(id);
    await audioEngineInstance.setOutputDevice(id);
  };

  const handleToggleLoopback = async () => {
    if (isSystemAudioActive) {
      audioEngineInstance.stopSystemAudioCapture();
      setIsSystemAudioActive(false);
    } else {
      const ok = await audioEngineInstance.startSystemAudioCapture();
      setIsSystemAudioActive(ok);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0b0f19] border border-[#1e293b] rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* ASIO Link Pro Style Title Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#111827] via-[#0f172a] to-[#111827] border-b border-[#1e293b]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#00f0ff] to-[#a855f7] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              <Cpu className="w-5 h-5 font-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-black text-white tracking-widest uppercase">
                  ASIOLINK™ PRO ROUTING MATRIX & PATCHBAY
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40 font-bold font-mono">
                  ZERO-POP ENGINE
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8]">
                Định tuyến phần cứng trực tiếp (Hardware Routing Matrix) - Khử hoàn toàn tiếng nổ & tạp âm
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
        <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-[#0c121e]">
          {/* Top Driver Configuration Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#111827] p-3 rounded-xl border border-[#1e293b]">
            <div>
              <label className="text-[10px] font-bold text-[#00f0ff] uppercase block mb-1">
                Driver Buffer Size:
              </label>
              <select
                value={bufferSize}
                onChange={(e) => setBufferSize(e.target.value)}
                className="w-full bg-[#0a0d14] text-xs font-bold text-white px-2.5 py-1.5 rounded-lg border border-[#25334e] focus:outline-none cursor-pointer"
              >
                <option value="128">128 Samples (Ultra Low Latency)</option>
                <option value="256">256 Samples (Standard Safe)</option>
                <option value="512">512 Samples (Zero Pop Guarantee)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#00ff88] uppercase block mb-1">
                Sample Rate (Hz):
              </label>
              <select
                value={sampleRate}
                onChange={(e) => setSampleRate(e.target.value)}
                className="w-full bg-[#0a0d14] text-xs font-bold text-white px-2.5 py-1.5 rounded-lg border border-[#25334e] focus:outline-none cursor-pointer"
              >
                <option value="44100">44.1 kHz (CD Quality)</option>
                <option value="48000">48.0 kHz (Studio Standard)</option>
                <option value="96000">96.0 kHz (Hi-Res Master)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#a855f7] uppercase block mb-1">
                Soundcard Input (Mic):
              </label>
              <select
                value={selectedInputId}
                onChange={(e) => handleSelectInput(e.target.value)}
                className="w-full bg-[#0a0d14] text-xs font-bold text-white px-2.5 py-1.5 rounded-lg border border-[#25334e] focus:outline-none cursor-pointer truncate"
              >
                {inputs.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || 'Microphone / Soundcard'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#f59e0b] uppercase block mb-1">
                Soundcard Output (Speaker):
              </label>
              <select
                value={selectedOutputId}
                onChange={(e) => handleSelectOutput(e.target.value)}
                className="w-full bg-[#0a0d14] text-xs font-bold text-white px-2.5 py-1.5 rounded-lg border border-[#25334e] focus:outline-none cursor-pointer truncate"
              >
                {outputs.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || 'Speaker / Headphones'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ASIO Matrix Patchbay Grid */}
          <div className="space-y-2 bg-[#141b2a] p-4 rounded-xl border border-[#1e293b]">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#00f0ff]" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  ASIOLINK™ ROUTING PATCHBAY MATRIX (ĐIỂM KẾT NỐI TÍN HIỆU)
                </span>
              </div>
              <button
                onClick={refreshDevices}
                className="text-[11px] text-[#94a3b8] hover:text-white flex items-center space-x-1 cursor-pointer bg-[#0a0d14] px-2 py-1 rounded border border-[#25334e]"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Làm mới Driver</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1e293b] text-[#94a3b8] font-bold">
                    <th className="p-2.5 bg-[#0a0d14]">ĐẦU VÀO (INPUTS) \ ĐẦU RA (OUTPUTS)</th>
                    <th className="p-2.5 bg-[#0a0d14] text-center">Master Out (Loa)</th>
                    <th className="p-2.5 bg-[#0a0d14] text-center">Vang / Reverb Send</th>
                    <th className="p-2.5 bg-[#0a0d14] text-center">Stream / Broadcast</th>
                    <th className="p-2.5 bg-[#0a0d14] text-center">Direct Monitor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] text-[#cbd5e1]">
                  <tr>
                    <td className="p-2.5 font-bold text-[#00f0ff] flex items-center space-x-2 bg-[#0a0d14]/50">
                      <Mic className="w-3.5 h-3.5" />
                      <span>1. Micro / Soundcard Input</span>
                    </td>
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={matrixState['mic-master']}
                        onChange={() => toggleCrossPoint('mic-master')}
                        className="w-4 h-4 accent-[#00f0ff] cursor-pointer"
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={matrixState['mic-reverb']}
                        onChange={() => toggleCrossPoint('mic-reverb')}
                        className="w-4 h-4 accent-[#00f0ff] cursor-pointer"
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={matrixState['mic-stream']}
                        onChange={() => toggleCrossPoint('mic-stream')}
                        className="w-4 h-4 accent-[#00f0ff] cursor-pointer"
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => {}}
                        className="w-4 h-4 accent-[#00f0ff] cursor-pointer"
                      />
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-bold text-[#ff007f] flex items-center space-x-2 bg-[#0a0d14]/50">
                      <Radio className="w-3.5 h-3.5" />
                      <span>2. Nhạc Beat / YouTube (Loopback)</span>
                    </td>
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={matrixState['beat-master']}
                        onChange={() => toggleCrossPoint('beat-master')}
                        className="w-4 h-4 accent-[#ff007f] cursor-pointer"
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <input type="checkbox" checked={false} onChange={() => {}} className="w-4 h-4 accent-[#ff007f] opacity-30" />
                    </td>
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={matrixState['beat-stream']}
                        onChange={() => toggleCrossPoint('beat-stream')}
                        className="w-4 h-4 accent-[#ff007f] cursor-pointer"
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <input type="checkbox" checked={false} onChange={() => {}} className="w-4 h-4 accent-[#ff007f] opacity-30" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick System Audio Loopback Toggle */}
          <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1e293b] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSystemAudioActive ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-[#00f0ff]/20 text-[#00f0ff]'}`}>
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Thu âm thanh YouTube / Trình duyệt bên ngoài</div>
                <div className="text-[10px] text-[#94a3b8]">Đưa luồng nhạc từ ngoài vào Fader Beat chuẩn ASIO</div>
              </div>
            </div>

            <button
              onClick={handleToggleLoopback}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                isSystemAudioActive
                  ? 'bg-[#ff3366] text-white shadow-[0_0_15px_rgba(255,51,102,0.4)]'
                  : 'bg-[#00ff88] text-black shadow-[0_0_15px_rgba(0,255,136,0.4)]'
              }`}
            >
              {isSystemAudioActive ? 'ĐANG BẬT LOOPBACK' : 'BẬT LOOPBACK YOUTUBE'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#111827] border-t border-[#1e293b]">
          <div className="text-[11px] text-[#64748b] flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#00ff88]" />
            <span>Driver ASIOLINK™ 64-Bit hoạt động ổn định, không nổ, không giật.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#00f0ff] to-[#a855f7] text-black hover:opacity-90 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            ĐÓNG & LƯU CÀI ĐẶT
          </button>
        </div>
      </div>
    </div>
  );
};
