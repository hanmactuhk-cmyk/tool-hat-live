import React from 'react';
import { Sparkles, Plus, ExternalLink, ArrowUp, ArrowDown, Trash2, Power } from 'lucide-react';
import { AutoKeyParams, VstPluginSlot } from '../types/audio';

interface VstPanelProps {
  autoKey: AutoKeyParams;
  vstSlots: VstPluginSlot[];
  onOpenPopup: (id: string) => void;
  onToggleVstBypass: (id: string) => void;
  onMoveVstUp: (index: number) => void;
  onMoveVstDown: (index: number) => void;
  onRemoveVst: (id: string) => void;
  onOpenVstEditor: (id: string) => void;
  onAddVstClick: () => void;
}

export const VstPanel: React.FC<VstPanelProps> = ({
  autoKey,
  vstSlots,
  onOpenPopup,
  onToggleVstBypass,
  onMoveVstUp,
  onMoveVstDown,
  onRemoveVst,
  onOpenVstEditor,
  onAddVstClick,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 1. AUTO-TUNE & AUTO KEY STATUS */}
      <div className="bg-[#101622] rounded-xl border border-[#25334e] p-3 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#d946ef] uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#d946ef]" />
              <span>AUTO-TUNE & AUTO KEY</span>
            </span>
            <button
              onClick={() => onOpenPopup('auto_key')}
              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#d946ef]/20 text-[#d946ef] border border-[#d946ef]/40 hover:bg-[#d946ef]/30 transition-colors"
            >
              Chỉnh Tune
            </button>
          </div>

          {/* Key Display Badge */}
          <div className="bg-[#0a0d14] rounded-lg p-3 border border-[#1e293b] mb-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider block">
                  ACTIVE SCALE
                </span>
                <span className="text-xl font-black text-[#f8fafc] font-mono">
                  {autoKey.currentKey} {autoKey.isMajor ? 'Major' : 'Minor'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider block">
                  DÒ TỰ ĐỘNG
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    autoKey.enabled
                      ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40'
                      : 'bg-[#1e293b] text-[#64748b]'
                  }`}
                >
                  {autoKey.enabled ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Realtime pitch detection readout */}
            <div className="mt-2 pt-2 border-t border-[#1e293b] flex items-center justify-between text-xs">
              <span className="text-[#94a3b8]">
                Ước lượng: <span className="text-[#00f0ff] font-bold">{autoKey.detectedKey}</span>
              </span>
              <span className="text-[#94a3b8]">
                Độ tin cậy: <span className="text-[#00ff88] font-mono font-bold">{autoKey.confidence}%</span>
              </span>
            </div>
            {/* Confidence Bar */}
            <div className="w-full bg-[#1e293b] h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#00f0ff] to-[#00ff88] h-full transition-all duration-300"
                style={{ width: `${autoKey.confidence}%` }}
              />
            </div>
          </div>
        </div>

        <div className="text-[11px] text-[#64748b] bg-[#161f30] p-2 rounded border border-[#1e293b]">
          💡 <span className="text-[#94a3b8]">Chuẩn VST3 Host:</span> Tự động đồng bộ Key/Scale vào parameter của plugin Auto-Tune Antares & Waves Tune khi nạp.
        </div>
      </div>

      {/* 2 & 3. VST3 INSERT RACK */}
      <div className="md:col-span-2 bg-[#101622] rounded-xl border border-[#25334e] p-3 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider">
                VST3 INSERT RACK (CHÈN PLUGIN THẬT)
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e293b] text-[#94a3b8]">
                {vstSlots.length} Plugin
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onAddVstClick}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 hover:bg-[#00f0ff]/30 transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ADD VST3</span>
              </button>

              <button
                onClick={() => onOpenPopup('vst_manager')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1e2942] text-[#94a3b8] hover:text-[#f8fafc] border border-[#25334e] transition-colors cursor-pointer"
              >
                Quản lý
              </button>
            </div>
          </div>

          {/* VST Slot List */}
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
            {vstSlots.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#25334e] rounded-lg bg-[#0a0d14]">
                <p className="text-xs text-[#94a3b8] mb-1">Chưa có plugin VST3 nào được nạp</p>
                <p className="text-[11px] text-[#64748b]">
                  Bấm nút <span className="text-[#00f0ff] font-semibold">+ ADD VST3</span> để nạp Auto-Tune, FabFilter, Waves, iZotope...
                </p>
              </div>
            ) : (
              vstSlots.map((slot, index) => (
                <div
                  key={slot.id}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                    slot.bypassed
                      ? 'bg-[#0d121c] border-[#1e293b] opacity-60'
                      : 'bg-[#161f30] border-[#00f0ff]/30 shadow-[0_0_8px_rgba(0,240,255,0.08)]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-mono text-[#64748b] w-4">{index + 1}.</span>
                    <div>
                      <span className="text-xs font-bold text-[#f8fafc] block leading-tight">
                        {slot.name}
                      </span>
                      <span className="text-[10px] text-[#94a3b8] truncate block max-w-[200px]">
                        {slot.path}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Bypass Toggle */}
                    <button
                      onClick={() => onToggleVstBypass(slot.id)}
                      className={`px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer ${
                        slot.bypassed
                          ? 'bg-[#1e293b] text-[#64748b]'
                          : 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40'
                      }`}
                      title={slot.bypassed ? 'Bypass đang BẬT' : 'Bypass đang TẮT'}
                    >
                      <Power className="w-2.5 h-2.5" />
                      <span>{slot.bypassed ? 'Bypassed' : 'Active'}</span>
                    </button>

                    {/* Open Editor Window */}
                    <button
                      onClick={() => onOpenVstEditor(slot.id)}
                      className="px-2 py-1 rounded text-[10px] font-medium bg-[#1e2942] text-[#00f0ff] hover:bg-[#00f0ff]/20 border border-[#00f0ff]/30 flex items-center space-x-1 cursor-pointer"
                      title="Mở giao diện plugin VST3"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span>Giao diện</span>
                    </button>

                    {/* Move Up/Down */}
                    <button
                      onClick={() => onMoveVstUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded bg-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc] disabled:opacity-30 cursor-pointer"
                      title="Chuyển lên"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onMoveVstDown(index)}
                      disabled={index === vstSlots.length - 1}
                      className="p-1 rounded bg-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc] disabled:opacity-30 cursor-pointer"
                      title="Chuyển xuống"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => onRemoveVst(slot.id)}
                      className="p-1 rounded bg-[#1e293b] text-[#ff3366] hover:bg-[#ff3366]/20 transition-colors cursor-pointer"
                      title="Xóa VST"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-2 border-t border-[#1e293b] mt-2">
          <span>Chuỗi xử lý âm thanh: Mic In → DSP Nội Bộ → VST 1 → VST 2 → Master</span>
          <span className="text-[#00ff88]">JUCE 7.0.12 VST3Host Ready</span>
        </div>
      </div>
    </div>
  );
};
