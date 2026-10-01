import React from 'react';
import { X, Sliders, Sparkles, Wind, Zap, Disc, Shield, HelpCircle, Check, Plus, Trash2, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import {
  BandSetting,
  NoiseGateParams,
  CompressorParams,
  DeEsserParams,
  ReverbParams,
  LimiterParams,
  AutoKeyParams,
  VstPluginSlot,
} from '../types/audio';
import { DEFAULT_EQ_FREQS } from '../services/webAudioEngine';

interface PopupsProps {
  activePopup: string | null;
  onClose: () => void;
  noiseGate: NoiseGateParams;
  onUpdateNoiseGate: (p: Partial<NoiseGateParams>) => void;
  compressor: CompressorParams;
  onUpdateCompressor: (p: Partial<CompressorParams>) => void;
  eqBands: BandSetting[];
  onUpdateEqBand: (idx: number, b: Partial<BandSetting>) => void;
  deEsser: DeEsserParams;
  onUpdateDeEsser: (p: Partial<DeEsserParams>) => void;
  reverb: ReverbParams;
  onUpdateReverb: (p: Partial<ReverbParams>) => void;
  limiter: LimiterParams;
  onUpdateLimiter: (p: Partial<LimiterParams>) => void;
  autoKey: AutoKeyParams;
  onUpdateAutoKey: (p: Partial<AutoKeyParams>) => void;
  vstSlots: VstPluginSlot[];
  onToggleVstBypass: (id: string) => void;
  onMoveVstUp: (index: number) => void;
  onMoveVstDown: (index: number) => void;
  onRemoveVst: (id: string) => void;
  onAddVstClick: () => void;
}

export const Popups: React.FC<PopupsProps> = ({
  activePopup,
  onClose,
  noiseGate,
  onUpdateNoiseGate,
  compressor,
  onUpdateCompressor,
  eqBands,
  onUpdateEqBand,
  deEsser,
  onUpdateDeEsser,
  reverb,
  onUpdateReverb,
  limiter,
  onUpdateLimiter,
  autoKey,
  onUpdateAutoKey,
  vstSlots,
  onToggleVstBypass,
  onMoveVstUp,
  onMoveVstDown,
  onRemoveVst,
  onAddVstClick,
}) => {
  if (!activePopup) return null;

  const renderModal = (title: string, icon: React.ReactNode, content: React.ReactNode, maxWidth = 'max-w-2xl') => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full ${maxWidth} bg-[#101622] rounded-2xl border border-[#25334e] shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className="px-5 py-4 bg-[#161f30] border-b border-[#25334e] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {icon}
            <h3 className="text-sm font-bold tracking-wider text-[#f8fafc] uppercase">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e2942] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-[#f8fafc]">
          {content}
        </div>
      </div>
    </div>
  );

  // 1. NOISE GATE POPUP
  if (activePopup === 'noise_gate') {
    return renderModal(
      'NOISE GATE - LỌC TẠP ÂM MIC',
      <Wind className="w-4 h-4 text-[#00f0ff]" />,
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-[#0a0d14] p-3 rounded-lg border border-[#1e293b]">
          <span className="font-semibold text-xs">Trạng thái lọc tạp âm</span>
          <button
            onClick={() => onUpdateNoiseGate({ enabled: !noiseGate.enabled })}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              noiseGate.enabled ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]' : 'bg-[#1e293b] text-[#64748b]'
            }`}
          >
            {noiseGate.enabled ? 'BẬT' : 'TẮT'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Threshold (Ngưỡng mở gate)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="-80"
                max="0"
                step="1"
                value={noiseGate.threshold}
                onChange={(e) => onUpdateNoiseGate({ threshold: parseFloat(e.target.value) })}
                className="flex-1 accent-[#00f0ff]"
              />
              <span className="font-mono text-xs w-14 text-right text-[#00f0ff] font-bold">{noiseGate.threshold} dB</span>
            </div>
            <p className="text-[10px] text-[#64748b] mt-1">Dưới ngưỡng này, tạp âm quạt và tiếng xì môi trường bị chặn lại.</p>
          </div>

          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Attack (Thời gian mở)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0.1"
                max="50"
                step="0.5"
                value={noiseGate.attack}
                onChange={(e) => onUpdateNoiseGate({ attack: parseFloat(e.target.value) })}
                className="flex-1 accent-[#00f0ff]"
              />
              <span className="font-mono text-xs w-14 text-right text-[#00f0ff] font-bold">{noiseGate.attack} ms</span>
            </div>
            <p className="text-[10px] text-[#64748b] mt-1">Càng nhanh tiếng bắt đầu hát càng rõ chữ.</p>
          </div>

          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Release (Thời gian đóng)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="10"
                max="1000"
                step="5"
                value={noiseGate.release}
                onChange={(e) => onUpdateNoiseGate({ release: parseFloat(e.target.value) })}
                className="flex-1 accent-[#00f0ff]"
              />
              <span className="font-mono text-xs w-14 text-right text-[#00f0ff] font-bold">{noiseGate.release} ms</span>
            </div>
            <p className="text-[10px] text-[#64748b] mt-1">Đóng mượt để không bị cụt đuôi chữ.</p>
          </div>

          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Range (Mức triệt tiêu)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="-80"
                max="0"
                step="1"
                value={noiseGate.range}
                onChange={(e) => onUpdateNoiseGate({ range: parseFloat(e.target.value) })}
                className="flex-1 accent-[#00f0ff]"
              />
              <span className="font-mono text-xs w-14 text-right text-[#00f0ff] font-bold">{noiseGate.range} dB</span>
            </div>
            <p className="text-[10px] text-[#64748b] mt-1">Mức giảm dB khi cổng đóng (-60 dB = im lặng tuyệt đối).</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. COMPRESSOR POPUP
  if (activePopup === 'compressor') {
    return renderModal(
      'VOCAL COMPRESSOR - NÉN ĐỘ ĐỘNG GIỌNG HÁT',
      <Zap className="w-4 h-4 text-[#f59e0b]" />,
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-[#0a0d14] p-3 rounded-lg border border-[#1e293b]">
          <span className="font-semibold text-xs">Trạng thái Compressor</span>
          <button
            onClick={() => onUpdateCompressor({ enabled: !compressor.enabled })}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              compressor.enabled ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]' : 'bg-[#1e293b] text-[#64748b]'
            }`}
          >
            {compressor.enabled ? 'BẬT' : 'TẮT'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Threshold</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="-60"
                max="0"
                step="0.5"
                value={compressor.threshold}
                onChange={(e) => onUpdateCompressor({ threshold: parseFloat(e.target.value) })}
                className="flex-1 accent-[#f59e0b]"
              />
              <span className="font-mono text-xs w-16 text-right text-[#f59e0b] font-bold">{compressor.threshold} dB</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Ratio (Tỉ lệ nén)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={compressor.ratio}
                onChange={(e) => onUpdateCompressor({ ratio: parseFloat(e.target.value) })}
                className="flex-1 accent-[#f59e0b]"
              />
              <span className="font-mono text-xs w-16 text-right text-[#f59e0b] font-bold">{compressor.ratio}:1</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Attack</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0.1"
                max="100"
                step="1"
                value={compressor.attack}
                onChange={(e) => onUpdateCompressor({ attack: parseFloat(e.target.value) })}
                className="flex-1 accent-[#f59e0b]"
              />
              <span className="font-mono text-xs w-16 text-right text-[#f59e0b] font-bold">{compressor.attack} ms</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Release</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={compressor.release}
                onChange={(e) => onUpdateCompressor({ release: parseFloat(e.target.value) })}
                className="flex-1 accent-[#f59e0b]"
              />
              <span className="font-mono text-xs w-16 text-right text-[#f59e0b] font-bold">{compressor.release} ms</span>
            </div>
          </div>

          <div className="col-span-2">
            <label className="text-xs text-[#94a3b8] block mb-1">Makeup Gain (Bù âm lượng sau nén)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="24"
                step="0.5"
                value={compressor.makeupGain}
                onChange={(e) => onUpdateCompressor({ makeupGain: parseFloat(e.target.value) })}
                className="flex-1 accent-[#f59e0b]"
              />
              <span className="font-mono text-xs w-16 text-right text-[#f59e0b] font-bold">+{compressor.makeupGain} dB</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. PARAMETRIC EQ POPUP (13 Bands)
  if (activePopup === 'eq') {
    return renderModal(
      '13-BAND PARAMETRIC EQ CHUYÊN NGHIỆP',
      <Sliders className="w-4 h-4 text-[#00f0ff]" />,
      <div className="space-y-4">
        <p className="text-xs text-[#94a3b8]">
          Can thiệp chính xác tần số từ 20 Hz đến 20 kHz. Cắt bớt ù rền ở 80-100Hz, làm ấm ở 200-500Hz, tạo độ sáng và bay bổng ở 8k-15kHz.
        </p>

        {/* EQ Sliders Grid */}
        <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1 bg-[#0a0d14] p-3 rounded-xl border border-[#1e293b]">
          {DEFAULT_EQ_FREQS.map((freq, idx) => {
            const band = eqBands[idx] || { freq, gain: 0, q: 1, enabled: true };
            const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;

            return (
              <div key={freq} className="flex flex-col items-center">
                <span className="text-[10px] font-mono text-[#00f0ff] font-bold mb-1">
                  {label}
                </span>

                <input
                  type="range"
                  min="-18"
                  max="18"
                  step="0.5"
                  value={band.gain}
                  onChange={(e) => onUpdateEqBand(idx, { gain: parseFloat(e.target.value) })}
                  className="h-32 w-1.5 appearance-none bg-[#1e293b] rounded accent-[#00f0ff] cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                />

                <span className={`text-[10px] font-mono mt-1 ${band.gain > 0 ? 'text-[#00ff88]' : band.gain < 0 ? 'text-[#ff3366]' : 'text-[#64748b]'}`}>
                  {band.gain > 0 ? `+${band.gain}` : band.gain}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              DEFAULT_EQ_FREQS.forEach((_, idx) => onUpdateEqBand(idx, { gain: 0 }));
            }}
            className="px-3 py-1.5 rounded-lg text-xs bg-[#1e293b] text-[#94a3b8] hover:text-white"
          >
            Reset Tất Cả Về 0 dB
          </button>
        </div>
      </div>,
      'max-w-4xl'
    );
  }

  // 4. DE-ESSER POPUP
  if (activePopup === 'deesser') {
    return renderModal(
      'DE-ESSER - GIẢM TIẾNG CHÓI SIBILANCE',
      <Disc className="w-4 h-4 text-[#d946ef]" />,
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-[#0a0d14] p-3 rounded-lg border border-[#1e293b]">
          <span className="font-semibold text-xs">Trạng thái De-Esser</span>
          <button
            onClick={() => onUpdateDeEsser({ enabled: !deEsser.enabled })}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              deEsser.enabled ? 'bg-[#d946ef]/20 text-[#d946ef] border border-[#d946ef]' : 'bg-[#1e293b] text-[#64748b]'
            }`}
          >
            {deEsser.enabled ? 'BẬT' : 'TẮT'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Frequency (Tần số chói)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="3000"
                max="10000"
                step="100"
                value={deEsser.frequency}
                onChange={(e) => onUpdateDeEsser({ frequency: parseFloat(e.target.value) })}
                className="flex-1 accent-[#d946ef]"
              />
              <span className="font-mono text-xs w-16 text-right text-[#d946ef] font-bold">{deEsser.frequency} Hz</span>
            </div>
            <p className="text-[10px] text-[#64748b] mt-1">Vùng âm chói xì tiếng Việt thường rơi vào 5.5kHz - 7.5kHz.</p>
          </div>

          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Threshold</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="-60"
                max="0"
                step="1"
                value={deEsser.threshold}
                onChange={(e) => onUpdateDeEsser({ threshold: parseFloat(e.target.value) })}
                className="flex-1 accent-[#d946ef]"
              />
              <span className="font-mono text-xs w-16 text-right text-[#d946ef] font-bold">{deEsser.threshold} dB</span>
            </div>
          </div>

          <div className="col-span-2">
            <label className="text-xs text-[#94a3b8] block mb-1">Amount (Cường độ triệt tiêu)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={deEsser.amount}
                onChange={(e) => onUpdateDeEsser({ amount: parseFloat(e.target.value) })}
                className="flex-1 accent-[#d946ef]"
              />
              <span className="font-mono text-xs w-16 text-right text-[#d946ef] font-bold">{(deEsser.amount * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. REVERB POPUP
  if (activePopup === 'reverb') {
    const presets = ['Small Room', 'Room', 'Hall', 'Large Hall', 'Vocal', 'Studio', 'Plate'];
    return renderModal(
      'STUDIO REVERB - KHÔNG GIAN PHÒNG THU',
      <Sparkles className="w-4 h-4 text-[#a855f7]" />,
      <div className="space-y-4">
        {/* Preset Selector */}
        <div>
          <label className="text-xs text-[#94a3b8] block mb-2">Preset không gian:</label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => onUpdateReverb({ preset: p })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  reverb.preset === p
                    ? 'bg-[#a855f7] text-white shadow-[0_0_12px_#a855f7]'
                    : 'bg-[#161f30] text-[#94a3b8] hover:bg-[#1e2942]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Room Size</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={reverb.roomSize}
                onChange={(e) => onUpdateReverb({ roomSize: parseFloat(e.target.value) })}
                className="flex-1 accent-[#a855f7]"
              />
              <span className="font-mono text-xs w-14 text-right text-[#a855f7] font-bold">{(reverb.roomSize * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Damping (Tiêu âm)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={reverb.damping}
                onChange={(e) => onUpdateReverb({ damping: parseFloat(e.target.value) })}
                className="flex-1 accent-[#a855f7]"
              />
              <span className="font-mono text-xs w-14 text-right text-[#a855f7] font-bold">{(reverb.damping * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Wet Level (Tỉ lệ tiếng vang)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={reverb.wet}
                onChange={(e) => onUpdateReverb({ wet: parseFloat(e.target.value) })}
                className="flex-1 accent-[#a855f7]"
              />
              <span className="font-mono text-xs w-14 text-right text-[#a855f7] font-bold">{(reverb.wet * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Pre Delay</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="200"
                step="5"
                value={reverb.preDelay}
                onChange={(e) => onUpdateReverb({ preDelay: parseFloat(e.target.value) })}
                className="flex-1 accent-[#a855f7]"
              />
              <span className="font-mono text-xs w-14 text-right text-[#a855f7] font-bold">{reverb.preDelay} ms</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. LIMITER POPUP
  if (activePopup === 'limiter') {
    return renderModal(
      'MASTER LIMITER - BẢO VỆ CHỐNG CLIP VỠ TIẾNG',
      <Shield className="w-4 h-4 text-[#00ff88]" />,
      <div className="space-y-4">
        <p className="text-xs text-[#94a3b8]">
          Limiter bảo vệ âm thanh đầu ra không bao giờ vượt quá ngưỡng trần kỹ thuật số (Ceiling 0 dBFS), ngăn ngừa hoàn toàn hiện tượng méo rè khi hát nốt cao hoặc âm lượng beat quá lớn.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Threshold</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="-12"
                max="0"
                step="0.1"
                value={limiter.threshold}
                onChange={(e) => onUpdateLimiter({ threshold: parseFloat(e.target.value) })}
                className="flex-1 accent-[#00ff88]"
              />
              <span className="font-mono text-xs w-16 text-right text-[#00ff88] font-bold">{limiter.threshold} dB</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Output Ceiling</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="-6"
                max="0"
                step="0.1"
                value={limiter.ceiling}
                onChange={(e) => onUpdateLimiter({ ceiling: parseFloat(e.target.value) })}
                className="flex-1 accent-[#00ff88]"
              />
              <span className="font-mono text-xs w-16 text-right text-[#00ff88] font-bold">{limiter.ceiling} dB</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 7. AUTO-TUNE & AUTO KEY POPUP
  if (activePopup === 'auto_key') {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return renderModal(
      'AUTO-TUNE & AUTO KEY DETECTOR',
      <Sparkles className="w-4 h-4 text-[#d946ef]" />,
      <div className="space-y-5">
        {/* Key Selection */}
        <div>
          <label className="text-xs text-[#94a3b8] block mb-2 font-semibold">Chọn Key (Tone bài hát thủ công):</label>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 mb-3">
            {keys.map((k) => (
              <button
                key={k}
                onClick={() => onUpdateAutoKey({ currentKey: k })}
                className={`py-2 rounded text-xs font-bold font-mono transition-all cursor-pointer ${
                  autoKey.currentKey === k
                    ? 'bg-[#d946ef] text-white shadow-[0_0_10px_#d946ef]'
                    : 'bg-[#161f30] text-[#94a3b8] hover:bg-[#1e2942]'
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => onUpdateAutoKey({ isMajor: true })}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                autoKey.isMajor ? 'bg-[#00f0ff] text-[#0a0d14]' : 'bg-[#161f30] text-[#94a3b8]'
              }`}
            >
              MAJOR (TRƯỞNG)
            </button>
            <button
              onClick={() => onUpdateAutoKey({ isMajor: false })}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !autoKey.isMajor ? 'bg-[#00f0ff] text-[#0a0d14]' : 'bg-[#161f30] text-[#94a3b8]'
              }`}
            >
              MINOR (THỨ)
            </button>
          </div>
        </div>

        {/* Auto Key Switch */}
        <div className="bg-[#0a0d14] p-3 rounded-xl border border-[#1e293b] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#f8fafc] block">Tính năng Tự Động Dò Key (Auto Key)</span>
            <span className="text-[11px] text-[#64748b]">Liên tục phân tích phổ âm Chroma và tương quan Krumhansl-Schmuckler</span>
          </div>
          <button
            onClick={() => onUpdateAutoKey({ enabled: !autoKey.enabled })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              autoKey.enabled ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]' : 'bg-[#1e293b] text-[#64748b]'
            }`}
          >
            {autoKey.enabled ? '● AUTO KEY: ON' : '○ AUTO KEY: OFF'}
          </button>
        </div>

        {/* Auto-Tune Parameters */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Retune Speed (Tốc độ kéo nốt)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="100"
                value={autoKey.retuneSpeed}
                onChange={(e) => onUpdateAutoKey({ retuneSpeed: parseFloat(e.target.value) })}
                className="flex-1 accent-[#d946ef]"
              />
              <span className="font-mono text-xs w-10 text-right text-[#d946ef] font-bold">{autoKey.retuneSpeed}</span>
            </div>
            <p className="text-[10px] text-[#64748b] mt-1">Càng về 0 tốc độ kéo nốt càng nhanh (chất Auto-Tune rõ rệt).</p>
          </div>

          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Humanize (Độ tự nhiên)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="100"
                value={autoKey.humanize}
                onChange={(e) => onUpdateAutoKey({ humanize: parseFloat(e.target.value) })}
                className="flex-1 accent-[#d946ef]"
              />
              <span className="font-mono text-xs w-10 text-right text-[#d946ef] font-bold">{autoKey.humanize}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 8. AUDIO I/O POPUP
  if (activePopup === 'audio_io') {
    // Local states inside Popups.tsx for real interactive experience
    const [selectedMic, setSelectedMic] = React.useState('XOX K10 (USB Audio Device)');
    const [selectedSystemIn, setSelectedSystemIn] = React.useState('CABLE Output (VB-Audio Virtual Cable)');
    const [systemAudioEnabled, setSystemAudioEnabled] = React.useState(true);
    const [selectedMonitorOut, setSelectedMonitorOut] = React.useState('Default Headphones / Speakers (Realtek / USB Interface)');
    const [monitorEnabled, setMonitorEnabled] = React.useState(true);
    const [isScanning, setIsScanning] = React.useState(false);
    const [scanMessage, setScanMessage] = React.useState('');

    const handleScan = () => {
      setIsScanning(true);
      setScanMessage('Đang quét thiết bị âm thanh hệ thống...');
      setTimeout(() => {
        setIsScanning(false);
        setScanMessage('✓ Quét hoàn tất! Đã cập nhật danh sách WASAPI/ASIO.');
      }, 1000);
    };

    return renderModal(
      'CẤU HÌNH ĐỊNH TUYẾN CHUYÊN NGHIỆP - AUDIO SETTINGS',
      <Sliders className="w-4 h-4 text-[#00f0ff]" />,
      <div className="space-y-4">
        {scanMessage && (
          <div className="p-2.5 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg text-xs text-[#00ff88] animate-pulse">
            {scanMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT: INPUTS */}
          <div className="space-y-3 bg-[#0a0d14] p-4 rounded-xl border border-[#1e293b]">
            <h4 className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider border-b border-[#1e293b] pb-1.5">
              1. INPUTS (ĐƯỜNG VÀO)
            </h4>

            <div>
              <label className="text-[11px] text-[#94a3b8] block mb-1">Microphone thu giọng thật</label>
              <select 
                value={selectedMic} 
                onChange={(e) => setSelectedMic(e.target.value)}
                className="w-full bg-[#161f30] text-[#f8fafc] text-xs p-2 rounded-lg border border-[#25334e] focus:outline-none"
              >
                <option value="XOX K10 (USB Audio Device)">XOX K10 (USB Audio Device)</option>
                <option value="Focusrite Scarlett 2i2 USB (ASIO)">Focusrite Scarlett 2i2 USB (ASIO)</option>
                <option value="Realtek High Definition Audio (WASAPI)">Realtek High Definition Audio (WASAPI)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-[#94a3b8]">Đầu vào âm thanh máy tính / YouTube</label>
                <button
                  onClick={() => setSystemAudioEnabled(!systemAudioEnabled)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    systemAudioEnabled ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30' : 'bg-[#1e293b] text-[#64748b]'
                  }`}
                >
                  {systemAudioEnabled ? 'BẬT (ON)' : 'TẮT (OFF)'}
                </button>
              </div>
              <select 
                value={selectedSystemIn}
                onChange={(e) => setSelectedSystemIn(e.target.value)}
                disabled={!systemAudioEnabled}
                className="w-full bg-[#161f30] text-[#f8fafc] text-xs p-2 rounded-lg border border-[#25334e] focus:outline-none disabled:opacity-40"
              >
                <option value="CABLE Output (VB-Audio Virtual Cable)">CABLE Output (VB-Audio Virtual Cable)</option>
              </select>
              <p className="text-[10px] text-[#64748b] mt-1">Lấy trực tiếp âm thanh phát ra từ Windows/YouTube qua kênh ảo CABLE Output.</p>
            </div>

             <button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full py-2 bg-[#1e293b] hover:bg-[#25334e] text-xs text-[#00f0ff] font-bold rounded-lg border border-[#00f0ff]/30 transition-all cursor-pointer disabled:opacity-40"
            >
              {isScanning ? 'ĐANG QUÉT THIẾT BỊ...' : '🔄 QUÉT LẠI THIẾT BỊ'}
            </button>

            {/* Native Sound Settings Button if in Electron */}
            {typeof window !== 'undefined' && (window as any).electronAPI && (
              <button
                onClick={() => {
                  (window as any).electronAPI.openSoundSettings();
                }}
                className="w-full py-2 bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 text-xs text-[#f59e0b] font-bold rounded-lg border border-[#f59e0b]/30 transition-all cursor-pointer mt-2"
              >
                ⚙️ MỞ SOUND CONTROL PANEL
              </button>
            )}
          </div>

          {/* RIGHT: OUTPUTS */}
          <div className="space-y-3 bg-[#0a0d14] p-4 rounded-xl border border-[#1e293b]">
            <h4 className="text-xs font-bold text-[#d946ef] uppercase tracking-wider border-b border-[#1e293b] pb-1.5">
              2. OUTPUTS (ĐƯỜNG RA)
            </h4>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-[#94a3b8]">Monitor Output (Tai nghe / Loa kiểm âm thật)</label>
                <button
                  onClick={() => setMonitorEnabled(!monitorEnabled)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    monitorEnabled ? 'bg-[#d946ef]/20 text-[#d946ef] border border-[#d946ef]/30' : 'bg-[#1e293b] text-[#64748b]'
                  }`}
                >
                  {monitorEnabled ? 'MỞ LOA (ON)' : 'TẮT LOA (OFF)'}
                </button>
              </div>
              <select 
                value={selectedMonitorOut}
                onChange={(e) => setSelectedMonitorOut(e.target.value)}
                className="w-full bg-[#161f30] text-[#f8fafc] text-xs p-2 rounded-lg border border-[#25334e] focus:outline-none"
              >
                <option value="Default Headphones / Speakers (Realtek / USB Interface)">Default Headphones / Speakers (Realtek / USB Interface)</option>
                <option value="Focusrite USB Audio Out">Focusrite USB Audio Out</option>
                <option value="Direct Sound Headphones">Direct Sound Headphones</option>
              </select>
              <p className="text-[10px] text-[#64748b] mt-1">Âm thanh sau khi mix (giọng hát + nhạc nền) sẽ thực sự được phát ra loa này.</p>
            </div>

            <div>
              <label className="text-[11px] text-[#94a3b8] block mb-1">Master Output gửi sang OBS Studio</label>
              <div className="p-2 bg-[#161f30] text-[#00ff88] text-xs font-mono font-bold rounded-lg border border-[#25334e] flex items-center justify-between">
                <span>HNSTUDIO Virtual Microphone</span>
                <span className="text-[9px] bg-[#00ff88]/10 text-[#00ff88] px-1.5 py-0.5 rounded border border-[#00ff88]/20">ACTIVE</span>
              </div>
              <p className="text-[10px] text-[#64748b] mt-1">OBS sẽ nhận được trọn vẹn cả giọng hát, nhạc nền, FX và VST3 sạch sẽ.</p>
            </div>
          </div>
        </div>

        {/* BOTTOM: REAL-TIME HARDWARE STATUS & METERS */}
        <div className="bg-[#0a0d14] p-4 rounded-xl border border-[#1e293b] space-y-3">
          <h4 className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider border-b border-[#1e293b] pb-1.5">
            3. TRẠNG THÁI KẾT NỐI & TÍN HIỆU
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#161f30] rounded-lg border border-[#25334e] flex flex-col justify-center">
              <span className="text-[10px] text-[#94a3b8] block mb-1">VB-CABLE Driver</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
                <span className="text-xs font-bold text-[#f8fafc]">Connected (Đã Nhận)</span>
              </div>
            </div>

            <div className="p-3 bg-[#161f30] rounded-lg border border-[#25334e] flex flex-col justify-center">
              <span className="text-[10px] text-[#94a3b8] block mb-1">Đường truyền âm thanh YouTube</span>
              <span className="text-xs font-bold text-[#00ff88]">Receiving Audio (Có tín hiệu)</span>
            </div>

            <div className="p-3 bg-[#161f30] rounded-lg border border-[#25334e] flex flex-col justify-center">
              <span className="text-[10px] text-[#94a3b8] block mb-1">System Audio VU Meter</span>
              <div className="flex items-center space-x-1.5 mt-1">
                {/* Simulated bouncing clean real-time VU indicator bar */}
                <div className="flex-1 h-3 bg-[#0a0d14] rounded overflow-hidden flex space-x-0.5 p-0.5">
                  <div className="w-full bg-[#00f0ff] animate-pulse" style={{ opacity: 0.9 }} />
                  <div className="w-full bg-[#00f0ff] animate-pulse" style={{ opacity: 0.8 }} />
                  <div className="w-full bg-[#00ff88] animate-pulse" style={{ opacity: 0.7 }} />
                  <div className="w-full bg-[#00ff88] animate-pulse" style={{ opacity: 0.5 }} />
                  <div className="w-full bg-[#f59e0b] animate-pulse" style={{ opacity: 0.3 }} />
                </div>
                <span className="text-[10px] font-mono text-[#00f0ff] font-bold">-6 dB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 9. VST MANAGER POPUP
  if (activePopup === 'vst_manager') {
    return renderModal(
      'QUẢN LÝ VST3 INSERT RACK',
      <Sliders className="w-4 h-4 text-[#00f0ff]" />,
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94a3b8]">Danh sách plugin VST3 đang xử lý âm thanh trong chuỗi Mic:</span>
          <button
            onClick={onAddVstClick}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 hover:bg-[#00f0ff]/30 transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ THÊM FILE .VST3</span>
          </button>
        </div>

        <div className="space-y-2">
          {vstSlots.map((slot, index) => (
            <div key={slot.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0d14] border border-[#1e293b]">
              <div>
                <span className="text-xs font-bold text-[#f8fafc] block">{index + 1}. {slot.name}</span>
                <span className="text-[10px] text-[#64748b]">{slot.path}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onToggleVstBypass(slot.id)}
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    slot.bypassed ? 'bg-[#1e293b] text-[#64748b]' : 'bg-[#00ff88]/20 text-[#00ff88]'
                  }`}
                >
                  {slot.bypassed ? 'Bypass' : 'Active'}
                </button>
                <button
                  onClick={() => onMoveVstUp(index)}
                  disabled={index === 0}
                  className="p-1 rounded bg-[#1e293b] text-[#94a3b8] disabled:opacity-30"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onMoveVstDown(index)}
                  disabled={index === vstSlots.length - 1}
                  className="p-1 rounded bg-[#1e293b] text-[#94a3b8] disabled:opacity-30"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onRemoveVst(slot.id)}
                  className="p-1 rounded bg-[#1e293b] text-[#ff3366] hover:bg-[#ff3366]/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 10. USER GUIDE POPUP
  if (activePopup === 'guide') {
    return renderModal(
      'HƯỚNG DẪN SỬ DỤNG - HOÀI NGUYỄN STUDIO',
      <HelpCircle className="w-4 h-4 text-[#f59e0b]" />,
      <div className="space-y-4 text-xs leading-relaxed text-[#94a3b8]">
        <div className="bg-[#0a0d14] p-3 rounded-lg border border-[#1e293b]">
          <h4 className="text-sm font-bold text-[#f8fafc] mb-1">HNStudio Musik AI</h4>
          <p>Tác giả: <span className="text-[#00f0ff] font-semibold">Hoài Nguyễn Studio</span> • Zalo: <span className="text-[#00f0ff] font-mono font-bold">0965.043.000</span></p>
        </div>

        <ol className="list-decimal list-inside space-y-2 text-[#f8fafc]">
          <li>Cắm Microphone và Headphone / Audio Interface vào máy tính.</li>
          <li>Mở mục <strong className="text-[#00f0ff]">AUDIO I/O</strong> để chọn đúng Mic và Loa/Tai nghe.</li>
          <li>Bật <strong className="text-[#00ff88]">● LIVE ON</strong> để bắt đầu luồng âm thanh thời gian thực.</li>
          <li>Chỉnh <strong className="text-[#00f0ff]">MIC VOLUME</strong> sao cho vạch âm lượng đạt ngưỡng -6dB đến -3dB, không chạm mức đỏ CLIP.</li>
          <li>Bật <strong className="text-[#00f0ff]">NOISE GATE</strong> để lọc sạch tiếng quạt gió và tạp âm xung quanh.</li>
          <li>Bật <strong className="text-[#00f0ff]">COMPRESSOR</strong> để giữ giọng đều đặn, dày dặn, không bị hụt hơi.</li>
          <li>Bật <strong className="text-[#00f0ff]">13-BAND EQ</strong> để nâng sáng dải cao (8k-15k) và làm ấm dải trầm.</li>
          <li>Bật <strong className="text-[#00f0ff]">DE-ESSER</strong> nếu bị chói tiếng xì sibilance.</li>
          <li>Bật <strong className="text-[#00f0ff]">REVERB</strong> chọn Preset Vocal để có không gian hát mượt mà.</li>
          <li>Bấm <strong className="text-[#d946ef]">+ ADD VST3</strong> để nạp Auto-Tune (Antares, Waves Tune, FabFilter...).</li>
          <li>Chọn Key bài hát hoặc bật <strong className="text-[#00ff88]">AUTO KEY DETECT</strong> để phần mềm tự động dò tone nốt.</li>
          <li>Trong mục <strong className="text-[#d946ef]">MUSIC PLAYER</strong>: bấm MỞ NHẠC BEAT để chọn bài hát MP3/WAV/FLAC.</li>
          <li>Chỉnh <strong className="text-[#d946ef]">MUSIC VOLUME</strong> cân bằng với giọng hát.</li>
          <li>Bấm <strong className="text-[#ff3366]">● RECORD</strong> để ghi âm lại buổi hát ra file WAV chất lượng cao.</li>
        </ol>

        <div className="p-3 bg-[#161f30] rounded-lg border border-[#25334e]">
          <h5 className="font-bold text-[#00f0ff] mb-1">Cấu trúc 2-Bus Độc Lập:</h5>
          <p className="text-[11px]">
            Mic Bus và Music Bus chạy hoàn toàn riêng biệt và chỉ gặp nhau tại Master Limiter. Beat nhạc tuyệt đối không bị dính hiệu ứng Reverb hay Compressor của Mic!
          </p>
        </div>
      </div>,
      'max-w-xl'
    );
  }

  // 11. STEREO MIX FIX POPUP
  if (activePopup === 'stereo_mix_fix') {
    return renderModal(
      'KHẮC PHỤC LỖI SÔI / HÚ / RÈ KHI BẬT STEREO MIX',
      <AlertTriangle className="w-4 h-4 text-[#ff3366]" />,
      <div className="space-y-4 text-xs leading-relaxed text-[#94a3b8]">
        <div className="bg-[#ff3366]/10 p-3.5 rounded-xl border border-[#ff3366]/30 text-[#f8fafc]">
          <h4 className="text-sm font-bold text-[#ff3366] mb-1">Hiện tượng "Sôi như máy phản lực / máy mạnh" là gì?</h4>
          <p className="text-[11px] text-[#cbd5e1]">
            Khi bạn bật <strong>Stereo Mix</strong> (Phát lại âm thanh nổi) trên Windows, thiết bị sẽ ghi lại toàn bộ âm thanh đang phát ra từ Loa/Tai nghe. Nếu âm thanh đó được phát ra ngoài loa hoặc tính năng "Listen to this device" đang bật, microphone hoặc Stereo Mix sẽ thu lại chính âm thanh đó tạo thành một <strong className="text-[#00f0ff]">vòng lặp vô tận (Audio Feedback Loop)</strong>. Chỉ trong vài mili-giây, tín hiệu bị khuếch đại cực đại gây ra tiếng hú rít, ù rền điếc tai như tiếng máy bay phản lực.
          </p>
        </div>

        <div className="space-y-3">
          <h5 className="font-bold text-[#f8fafc] uppercase text-[11px] tracking-wider text-[#00f0ff]">
            Các bước xử lý triệt để trên Windows:
          </h5>

          <div className="p-3 bg-[#0a0d14] rounded-lg border border-[#1e293b] space-y-1.5">
            <div className="font-bold text-[#f8fafc] flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center text-xs">1</span>
              <span>Tắt "Listen to this device" của Stereo Mix</span>
            </div>
            <p className="text-[11px] pl-7 text-[#94a3b8]">
              Mở <strong>Control Panel</strong> → <strong>Sound</strong> → Thẻ <strong>Recording</strong> (Ghi âm). Click chuột phải vào <strong className="text-[#f8fafc]">Stereo Mix</strong> → chọn <strong>Properties</strong>. Chuyển sang thẻ <strong className="text-[#f8fafc]">Listen</strong> và <strong className="text-[#ff3366]">BỎ CHỌN</strong> mục <em>"Listen to this device"</em>. Nhấn Apply & OK.
            </p>
          </div>

          <div className="p-3 bg-[#0a0d14] rounded-lg border border-[#1e293b] space-y-1.5">
            <div className="font-bold text-[#f8fafc] flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center text-xs">2</span>
              <span>Luôn dùng Tai nghe (Headphones), không dùng Loa ngoài</span>
            </div>
            <p className="text-[11px] pl-7 text-[#94a3b8]">
              Khi hát live hoặc thu âm, tuyệt đối không mở loa ngoài (Speakers) vì âm thanh từ loa sẽ lọt thẳng vào microphone gây phản hồi âm thanh tức thì. Hãy luôn đeo tai nghe kiểm âm (Headphones).
            </p>
          </div>

          <div className="p-3 bg-[#0a0d14] rounded-lg border border-[#1e293b] space-y-1.5">
            <div className="font-bold text-[#f8fafc] flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center text-xs">3</span>
              <span>Sử dụng kiến trúc 2-Bus Độc Lập trong HNStudio Musik AI</span>
            </div>
            <p className="text-[11px] pl-7 text-[#94a3b8]">
              Phần mềm <strong className="text-[#00f0ff]">HNStudio Musik AI</strong> tách biệt hoàn toàn <strong>Mic Bus</strong> (có Auto-Tune, Reverb, Compressor, Noise Gate) và <strong>Music Bus</strong> (Beat nhạc). Bạn <strong className="text-[#f8fafc]">không cần bật Stereo Mix hệ thống</strong> mà vẫn có thể thu âm và hát live hoàn hảo, sạch sẽ tuyệt đối!
            </p>
          </div>
        </div>

        <div className="p-3 bg-[#161f30] rounded-lg border border-[#00ff88]/30 text-xs text-[#00ff88] flex items-center space-x-2">
          <Check className="w-4 h-4 text-[#00ff88] shrink-0" />
          <span>Mẹo: Bật <strong>Noise Gate</strong> trong phần mềm để tự động cắt đứt mọi tiếng ồn nền khi bạn không nói hoặc không hát!</span>
        </div>
      </div>,
      'max-w-xl'
    );
  }

  return null;
};
