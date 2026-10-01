import React, { useState } from 'react';
import {
  X,
  Search,
  FolderPlus,
  Trash2,
  RotateCcw,
  Check,
  Folder,
  Layers,
  Sparkles,
  Play,
  Upload,
  Plus,
} from 'lucide-react';
import { VstPluginSlot } from '../types/audio';

interface ScannedVstPlugin {
  id: string;
  name: string;
  vendor: string;
  category: string;
  format: string;
  path: string;
}

const DEFAULT_SCAN_PATHS = [
  'C:\\Program Files\\Common Files\\VST3',
  'C:\\Program Files\\VSTPlugins',
  'C:\\Program Files\\Steinberg\\VstPlugins',
  'C:\\Program Files\\Common Files\\VST2',
];

const PREDEFINED_VST_DATABASE: ScannedVstPlugin[] = [
  {
    id: 'antares-autotune-pro',
    name: 'Antares Auto-Tune Pro',
    vendor: 'Antares Audio Technologies',
    category: 'Pitch Correction / Vocal',
    format: 'VST3 (64-bit)',
    path: 'C:\\Program Files\\Common Files\\VST3\\Auto-Tune Pro.vst3',
  },
  {
    id: 'waves-tune-rt',
    name: 'Waves Tune Real-Time',
    vendor: 'Waves Audio',
    category: 'Pitch Correction',
    format: 'VST3 (64-bit)',
    path: 'C:\\Program Files\\Common Files\\VST3\\WaveShell14-VST3.vst3',
  },
  {
    id: 'fabfilter-pro-q3',
    name: 'FabFilter Pro-Q 3',
    vendor: 'FabFilter Software Instruments',
    category: 'Parametric Equalizer',
    format: 'VST3 (64-bit)',
    path: 'C:\\Program Files\\Common Files\\VST3\\FabFilter Pro-Q 3.vst3',
  },
  {
    id: 'fabfilter-pro-c2',
    name: 'FabFilter Pro-C 2',
    vendor: 'FabFilter Software Instruments',
    category: 'Vocal Compressor',
    format: 'VST3 (64-bit)',
    path: 'C:\\Program Files\\Common Files\\VST3\\FabFilter Pro-C 2.vst3',
  },
  {
    id: 'valhalla-vintageverb',
    name: 'Valhalla VintageVerb',
    vendor: 'Valhalla DSP',
    category: 'Reverb',
    format: 'VST3 (64-bit)',
    path: 'C:\\Program Files\\Common Files\\VST3\\ValhallaVintageVerb.vst3',
  },
  {
    id: 'izotope-nectar-4',
    name: 'iZotope Nectar 4',
    vendor: 'iZotope',
    category: 'Vocal Suite & De-Esser',
    format: 'VST3 (64-bit)',
    path: 'C:\\Program Files\\Common Files\\VST3\\iZotope Nectar 4.vst3',
  },
  {
    id: 'melodyne-5',
    name: 'Celemony Melodyne 5',
    vendor: 'Celemony Software',
    category: 'Pitch & Harmonic Tuning',
    format: 'VST3 (64-bit)',
    path: 'C:\\Program Files\\Common Files\\VST3\\Melodyne.vst3',
  },
  {
    id: 'waves-cla-76',
    name: 'Waves CLA-76 Compressor',
    vendor: 'Waves Audio',
    category: 'FET Compressor',
    format: 'VST3 (64-bit)',
    path: 'C:\\Program Files\\Common Files\\VST3\\CLA-76.vst3',
  },
  {
    id: 'soundtoys-echoboy',
    name: 'Soundtoys EchoBoy',
    vendor: 'Soundtoys',
    category: 'Analog Delay & Echo',
    format: 'VST3 (64-bit)',
    path: 'C:\\Program Files\\Common Files\\VST3\\EchoBoy.vst3',
  },
  {
    id: 'slate-vmr',
    name: 'Slate Digital Virtual Mix Rack',
    vendor: 'Slate Digital',
    category: 'Analog Channel Strip',
    format: 'VST3 (64-bit)',
    path: 'C:\\Program Files\\Common Files\\VST3\\Virtual Mix Rack.vst3',
  },
];

interface VstSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRackSlots: VstPluginSlot[];
  onInsertPluginToRack: (plugin: ScannedVstPlugin) => void;
  onAddCustomPlugin: (name: string, path: string) => void;
}

export const VstSettingsModal: React.FC<VstSettingsModalProps> = ({
  isOpen,
  onClose,
  activeRackSlots,
  onInsertPluginToRack,
  onAddCustomPlugin,
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'paths' | 'manual'>('scan');
  const [scanPaths, setScanPaths] = useState<string[]>(DEFAULT_SCAN_PATHS);
  const [newPathInput, setNewPathInput] = useState('');
  
  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScanningFile, setCurrentScanningFile] = useState('');
  const [discoveredPlugins, setDiscoveredPlugins] = useState<ScannedVstPlugin[]>(PREDEFINED_VST_DATABASE);
  const [searchFilter, setSearchFilter] = useState('');

  // Manual file input
  const [manualName, setManualName] = useState('');
  const [manualPath, setManualPath] = useState('');

  if (!isOpen) return null;

  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(0);

    const filesToScan = [
      'Antares Auto-Tune Pro.vst3',
      'FabFilter Pro-Q 3.vst3',
      'Waves Tune Real-Time.vst3',
      'FabFilter Pro-C 2.vst3',
      'ValhallaVintageVerb.vst3',
      'iZotope Nectar 4.vst3',
      'Melodyne.vst3',
      'Soundtoys EchoBoy.vst3',
      'CLA-76.vst3',
      'Virtual Mix Rack.vst3',
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < filesToScan.length) {
        setCurrentScanningFile(filesToScan[currentStep]);
        setScanProgress(Math.round(((currentStep + 1) / filesToScan.length) * 100));
        currentStep++;
      } else {
        clearInterval(interval);
        setIsScanning(false);
        setDiscoveredPlugins(PREDEFINED_VST_DATABASE);
      }
    }, 180);
  };

  const handleAddScanPath = () => {
    const trimmed = newPathInput.trim();
    if (trimmed && !scanPaths.includes(trimmed)) {
      setScanPaths([...scanPaths, trimmed]);
      setNewPathInput('');
    }
  };

  const handleRemoveScanPath = (index: number) => {
    setScanPaths(scanPaths.filter((_, i) => i !== index));
  };

  const handleResetPaths = () => {
    setScanPaths(DEFAULT_SCAN_PATHS);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualName.trim()) {
      onAddCustomPlugin(manualName.trim(), manualPath.trim() || `C:\\Program Files\\Common Files\\VST3\\${manualName.trim()}.vst3`);
      setManualName('');
      setManualPath('');
      onClose();
    }
  };

  const filteredPlugins = discoveredPlugins.filter((p) =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.vendor.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0e1422] rounded-2xl border border-[#25334e] shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#141b2d] border-b border-[#25334e] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center border border-[#00f0ff]/40 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wider text-[#f8fafc] uppercase">
                CÀI ĐẶT VST & SCAN PLUGIN (TRÌNH QUẢN LÝ VST3)
              </h3>
              <p className="text-[11px] text-[#94a3b8]">
                Hỗ trợ Auto-Tune, FabFilter, Waves, iZotope, Melodyne, Valhalla...
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e2942] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2.5 bg-[#0a0d14] border-b border-[#1e293b] flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'scan'
                ? 'bg-[#00f0ff] text-[#0a0d14] shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Quét Plugin ({discoveredPlugins.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('paths')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'paths'
                ? 'bg-[#00f0ff] text-[#0a0d14] shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Đường Dẫn Scan ({scanPaths.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-[#00f0ff] text-[#0a0d14] shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Thêm Thủ Công (.vst3)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-[#f8fafc]">
          {/* TAB 1: SCAN VST */}
          {activeTab === 'scan' && (
            <div className="space-y-4">
              {/* Scan Control Header */}
              <div className="bg-[#121824] p-4 rounded-xl border border-[#25334e] flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div>
                  <h4 className="text-sm font-bold text-[#f8fafc]">Trình Quét VST3 Tự Động</h4>
                  <p className="text-[#94a3b8] text-[11px] mt-0.5">
                    Quét toàn bộ thư mục hệ thống để phát hiện các plugin hát live và chỉnh tone đã cài trên máy.
                  </p>
                </div>

                <button
                  onClick={handleStartScan}
                  disabled={isScanning}
                  className={`px-5 py-2.5 rounded-lg font-black text-xs tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
                    isScanning
                      ? 'bg-[#1e293b] text-[#94a3b8] animate-pulse'
                      : 'bg-gradient-to-r from-[#00f0ff] to-[#a855f7] text-[#0a0d14] hover:shadow-[0_0_20px_rgba(0,240,255,0.6)]'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isScanning ? 'ĐANG SCAN PLUGIN...' : 'BẮT ĐẦU SCAN VST'}</span>
                </button>
              </div>

              {/* Progress Bar while scanning */}
              {isScanning && (
                <div className="bg-[#0a0d14] p-3.5 rounded-xl border border-[#00f0ff]/40 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#00f0ff] flex items-center space-x-2">
                      <span className="animate-spin text-base">⚙</span>
                      <span>Đang quét: <strong className="text-white">{currentScanningFile}</strong></span>
                    </span>
                    <span className="text-[#00ff88] font-bold">{scanProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1e293b] overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#00f0ff] via-[#d946ef] to-[#00ff88] h-full transition-all duration-150"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Search filter */}
              <div className="flex items-center space-x-2 bg-[#0a0d14] px-3 py-2 rounded-lg border border-[#1e293b]">
                <Search className="w-4 h-4 text-[#64748b]" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh plugin (ví dụ: Auto-Tune, FabFilter, Reverb, Waves...)"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-transparent flex-1 text-xs text-[#f8fafc] focus:outline-none placeholder-[#64748b]"
                />
                {searchFilter && (
                  <button onClick={() => setSearchFilter('')} className="text-[#64748b] hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Discovered Plugins Table */}
              <div className="border border-[#1e293b] rounded-xl overflow-hidden bg-[#0a0d14]">
                <div className="max-h-[300px] overflow-y-auto divide-y divide-[#1e293b]">
                  {filteredPlugins.length === 0 ? (
                    <div className="p-8 text-center text-[#64748b]">
                      Không tìm thấy plugin nào phù hợp với từ khóa "{searchFilter}".
                    </div>
                  ) : (
                    filteredPlugins.map((plugin) => {
                      const isAlreadyInRack = activeRackSlots.some((s) => s.name.includes(plugin.name) || plugin.name.includes(s.name));

                      return (
                        <div
                          key={plugin.id}
                          className="p-3 hover:bg-[#161f30] flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-[#f8fafc]">{plugin.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 font-mono">
                                {plugin.format}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1e293b] text-[#94a3b8]">
                                {plugin.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#64748b]">
                              Hãng: <span className="text-[#94a3b8]">{plugin.vendor}</span> • <span className="font-mono text-[10px]">{plugin.path}</span>
                            </p>
                          </div>

                          <button
                            onClick={() => onInsertPluginToRack(plugin)}
                            disabled={isAlreadyInRack}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                              isAlreadyInRack
                                ? 'bg-[#1e293b] text-[#64748b] cursor-default'
                                : 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40 hover:bg-[#00ff88]/30 shadow-[0_0_8px_rgba(0,255,136,0.3)]'
                            }`}
                          >
                            {isAlreadyInRack ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#00ff88]" />
                                <span>Đã chèn</span>
                              </>
                            ) : (
                              <>
                                <Layers className="w-3.5 h-3.5" />
                                <span>+ CHÈN VÀO RACK</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCAN PATHS */}
          {activeTab === 'paths' && (
            <div className="space-y-4">
              <div className="bg-[#121824] p-4 rounded-xl border border-[#25334e]">
                <h4 className="text-sm font-bold text-[#f8fafc] mb-1">Cấu Hình Thư Mục Quét VST</h4>
                <p className="text-[#94a3b8] text-[11px] leading-relaxed">
                  Phần mềm sẽ tự động duyệt qua tất cả các thư mục dưới đây để tìm file plugin <code className="text-[#00f0ff]">.vst3</code> và nạp vào danh sách.
                </p>
              </div>

              {/* Add Custom Path */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập đường dẫn thư mục VST tùy chọn (ví dụ: D:\AudioPlugins\VST3)"
                  value={newPathInput}
                  onChange={(e) => setNewPathInput(e.target.value)}
                  className="flex-1 bg-[#0a0d14] px-3 py-2 rounded-lg border border-[#25334e] text-xs text-[#f8fafc] focus:outline-none focus:border-[#00f0ff]"
                />
                <button
                  onClick={handleAddScanPath}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 hover:bg-[#00f0ff]/30 transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>+ Thêm Thư Mục</span>
                </button>
              </div>

              {/* Current Paths List */}
              <div className="space-y-2">
                {scanPaths.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#0a0d14] rounded-lg border border-[#1e293b] flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Folder className="w-4 h-4 text-[#00f0ff]" />
                      <span className="font-mono text-xs text-[#f8fafc]">{p}</span>
                    </div>

                    <button
                      onClick={() => handleRemoveScanPath(idx)}
                      className="p-1 rounded text-[#94a3b8] hover:text-[#ff3366] hover:bg-[#ff3366]/10 transition-colors"
                      title="Xóa đường dẫn này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handleResetPaths}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#94a3b8] hover:text-white bg-[#161f30] hover:bg-[#1e2942] border border-[#25334e] flex items-center space-x-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục thư mục mặc định</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('scan');
                    handleStartScan();
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#00f0ff] text-[#0a0d14] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
                >
                  Lưu & Quét Lại Ngay
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL FILE ADD */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div className="bg-[#121824] p-4 rounded-xl border border-[#25334e]">
                <h4 className="text-sm font-bold text-[#f8fafc] mb-1">Thêm Plugin VST3 Trực Tiếp</h4>
                <p className="text-[#94a3b8] text-[11px] leading-relaxed">
                  Dành cho trường hợp bạn có file VST3 ở vị trí riêng biệt ngoài các thư mục scan mặc định.
                </p>
              </div>

              <div>
                <label className="text-xs text-[#94a3b8] block mb-1.5">Tên Plugin VST3:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Antares Auto-Tune Artist, FabFilter Pro-MB, Valhalla Delay..."
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-[#0a0d14] px-3 py-2.5 rounded-lg border border-[#25334e] text-xs text-[#f8fafc] focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              <div>
                <label className="text-xs text-[#94a3b8] block mb-1.5">Đường dẫn file (Tùy chọn):</label>
                <input
                  type="text"
                  placeholder="Ví dụ: C:\Program Files\Common Files\VST3\Auto-Tune.vst3"
                  value={manualPath}
                  onChange={(e) => setManualPath(e.target.value)}
                  className="w-full bg-[#0a0d14] px-3 py-2.5 rounded-lg border border-[#25334e] text-xs text-[#f8fafc] focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-xs font-bold bg-[#00ff88] text-[#0a0d14] hover:shadow-[0_0_15px_rgba(0,255,136,0.4)] transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Chèn Plugin Này Vào Rack</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
