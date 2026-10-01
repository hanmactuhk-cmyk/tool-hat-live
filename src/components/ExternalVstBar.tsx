import React, { useRef } from 'react';
import {
  Sliders,
  Plus,
  Search,
  Settings,
  Sparkles,
  ExternalLink,
  Power,
  Trash2,
  FolderOpen,
  CheckCircle2,
} from 'lucide-react';
import { VstPluginSlot } from '../types/audio';

interface ExternalVstBarProps {
  vstSlots: VstPluginSlot[];
  onToggleVstBypass: (id: string) => void;
  onRemoveVst: (id: string) => void;
  onOpenVstSettings: () => void;
  onAddCustomPlugin: (name: string, path: string) => void;
  currentKey: string;
}

const POPULAR_EXTERNAL_VSTS = [
  { name: 'Auto-Tune Pro', path: 'C:\\Program Files\\Common Files\\VST3\\Auto-Tune Pro.vst3', tag: 'Pitch' },
  { name: 'FabFilter Pro-Q 3', path: 'C:\\Program Files\\Common Files\\VST3\\FabFilter Pro-Q 3.vst3', tag: 'EQ' },
  { name: 'Waves CLA-76', path: 'C:\\Program Files\\Common Files\\VST3\\WaveShell14-VST3.vst3', tag: 'Comp' },
  { name: 'Valhalla VintageVerb', path: 'C:\\Program Files\\Common Files\\VST3\\ValhallaVintageVerb.vst3', tag: 'Reverb' },
  { name: 'iZotope Nectar 4', path: 'C:\\Program Files\\Common Files\\VST3\\iZotope Nectar.vst3', tag: 'Vocal' },
  { name: 'Waves RVox', path: 'C:\\Program Files\\Common Files\\VST3\\Renaissance Vox.vst3', tag: 'Dynamics' },
];

export const ExternalVstBar: React.FC<ExternalVstBarProps> = ({
  vstSlots,
  onToggleVstBypass,
  onRemoveVst,
  onOpenVstSettings,
  onAddCustomPlugin,
  currentKey,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleBrowseVstFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const fullPath = (file as unknown as { path?: string }).path || `C:\\Program Files\\Common Files\\VST3\\${file.name}`;
      onAddCustomPlugin(cleanName, fullPath);
    }
  };

  return (
    <div className="bg-[#101622] rounded-xl border border-[#25334e] px-2.5 py-1.5 shadow-md flex-shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        {/* Left: Section Title & Fast Actions */}
        <div className="flex items-center space-x-1.5">
          <div className="flex items-center space-x-1 bg-[#a855f7]/20 text-[#a855f7] px-2 py-0.5 rounded border border-[#a855f7]/40 text-[11px] font-black uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-[#a855f7]" />
            <span>VST3 EXTERNAL RACK:</span>
          </div>

          {/* Hidden File Input for Custom .vst3 / .dll browsing */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".vst3,.dll"
            onChange={handleBrowseVstFile}
            className="hidden"
          />

          {/* Browse VST from Computer Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 rounded bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 hover:bg-[#00f0ff]/30 text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1 shadow-[0_0_8px_rgba(0,240,255,0.2)]"
            title="Chọn trực tiếp file plugin .vst3 hoặc .dll trên máy tính"
          >
            <FolderOpen className="w-3 h-3" />
            <span>+ CHÈN VST3 TỪ MÁY</span>
          </button>

          {/* Scan VST Settings */}
          <button
            onClick={onOpenVstSettings}
            className="px-2 py-1 rounded bg-[#161f30] text-[#94a3b8] hover:text-[#f8fafc] border border-[#25334e] text-[11px] font-medium transition-colors cursor-pointer flex items-center space-x-1"
            title="Quét tự động toàn bộ VST3 trong C:\Program Files\Common Files\VST3"
          >
            <Search className="w-3 h-3" />
            <span>QUÉT VST</span>
          </button>
        </div>

        {/* Middle: Active VST3 Slots Chips */}
        <div className="flex-1 flex items-center space-x-1 overflow-x-auto py-0.5 max-w-full">
          {vstSlots.map((slot, index) => (
            <div
              key={slot.id}
              className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-lg border text-[11px] transition-all flex-shrink-0 ${
                slot.bypassed
                  ? 'bg-[#0a0d14] border-[#1e293b] text-[#64748b]'
                  : 'bg-[#161f30] border-[#a855f7]/40 text-[#f8fafc] shadow-[0_0_8px_rgba(168,85,247,0.15)]'
              }`}
            >
              <button
                onClick={() => onToggleVstBypass(slot.id)}
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  slot.bypassed ? 'bg-[#1e293b] text-[#64748b]' : 'bg-[#00ff88] text-[#0a0d14]'
                }`}
                title={slot.bypassed ? 'Bấm để Bật Plugin' : 'Bấm để Tắt (Bypass)'}
              >
                <Power className="w-2.5 h-2.5 stroke-[3]" />
              </button>

              <span className="font-semibold truncate max-w-[120px]">{slot.name}</span>

              <button
                onClick={() => onRemoveVst(slot.id)}
                className="text-[#64748b] hover:text-[#ff3366] transition-colors cursor-pointer"
                title="Gỡ khỏi chuỗi Mic"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}

          {vstSlots.length === 0 && (
            <span className="text-[10px] text-[#64748b] italic">
              Chưa chèn VST bên ngoài. Bấm các nút bên phải để nạp nhanh Auto-Tune, FabFilter, Waves!
            </span>
          )}
        </div>

        {/* Right: Quick 1-Click Popular VST Insert Presets */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          <span className="text-[10px] text-[#d946ef] font-bold hidden xl:inline">NẠP NHANH:</span>
          {POPULAR_EXTERNAL_VSTS.slice(0, 4).map((vst, idx) => (
            <button
              key={idx}
              onClick={() => onAddCustomPlugin(vst.name, vst.path)}
              className="px-1.5 py-0.5 rounded bg-[#0a0d14] hover:bg-[#a855f7]/20 text-[#94a3b8] hover:text-[#a855f7] border border-[#1e293b] text-[10px] font-medium transition-all cursor-pointer"
              title={`Chèn nhanh ${vst.name} vào chuỗi Mic`}
            >
              +{vst.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
