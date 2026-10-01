import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Settings,
  Plus,
  Play,
  Square,
  Upload,
  RotateCcw,
  Trash2,
  X,
  Check,
  Sparkles,
} from 'lucide-react';
import { audioEngineInstance } from '../services/webAudioEngine';
import { SfxSlot, SfxPresetType } from '../types/audio';

const INITIAL_SFX_SLOTS: SfxSlot[] = [
  { id: 'sfx-1', name: '👏 Vỗ Tay', preset: 'applause', volume: 1.0, color: '#00f0ff' },
  { id: 'sfx-2', name: '😂 Tiếng Cười', preset: 'laugh', volume: 1.0, color: '#f59e0b' },
  { id: 'sfx-3', name: '📢 Còi Hơi DJ', preset: 'horn', volume: 1.0, color: '#ff3366' },
  { id: 'sfx-4', name: '🎉 Hò Reo', preset: 'crowd', volume: 1.0, color: '#a855f7' },
  { id: 'sfx-5', name: '🥁 Ba-dum-tss', preset: 'rimshot', volume: 1.0, color: '#10b981' },
  { id: 'sfx-6', name: '🎺 Troll Hài', preset: 'sad_trombone', volume: 1.0, color: '#eab308' },
  { id: 'sfx-7', name: '🔔 Chuông Ting', preset: 'bell', volume: 1.0, color: '#38bdf8' },
  { id: 'sfx-8', name: '⚡ Bắn Laser', preset: 'laser', volume: 1.0, color: '#ec4899' },
];

export const SfxSection: React.FC = () => {
  const [sfxSlots, setSfxSlots] = useState<SfxSlot[]>(INITIAL_SFX_SLOTS);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  // Sync active playing id periodically
  useEffect(() => {
    const timer = setInterval(() => {
      const currentActive = audioEngineInstance.getActiveSfxId();
      setActivePlayingId(currentActive);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Edit modal state
  const [editingSlot, setEditingSlot] = useState<SfxSlot | null>(null);
  const [editName, setEditName] = useState('');
  const [editPreset, setEditPreset] = useState<SfxPresetType>('applause');
  const [editVolume, setEditVolume] = useState(1.0);
  const [editCustomUrl, setEditCustomUrl] = useState<string | undefined>(undefined);
  const [editFileName, setEditFileName] = useState<string | undefined>(undefined);

  // Toggle behavior: Click 1 to play, Click again to stop!
  const handleToggleSfx = async (slot: SfxSlot) => {
    await audioEngineInstance.ensureAudioContext();

    if (activePlayingId === slot.id) {
      // User clicked while it's playing -> Turn OFF!
      audioEngineInstance.stopCurrentSfx();
      setActivePlayingId(null);
      return;
    }

    // Play sound and toggle on
    const isNowPlaying = await audioEngineInstance.playSfx(
      slot.id,
      {
        preset: slot.preset,
        customAudioUrl: slot.customAudioUrl,
        volume: slot.volume,
      },
      () => {
        setActivePlayingId((current) => (current === slot.id ? null : current));
      }
    );

    setActivePlayingId(isNowPlaying ? slot.id : null);
  };

  const handleOpenEdit = (e: React.MouseEvent, slot: SfxSlot) => {
    e.stopPropagation();
    setEditingSlot(slot);
    setEditName(slot.name);
    setEditPreset(slot.preset);
    setEditVolume(slot.volume);
    setEditCustomUrl(slot.customAudioUrl);
    setEditFileName(slot.customFileName);
  };

  const handleCloseEdit = () => {
    setEditingSlot(null);
  };

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setEditCustomUrl(url);
      setEditFileName(file.name);
      setEditPreset('custom');
      if (!editName) {
        setEditName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSaveEdit = () => {
    if (!editingSlot) return;
    setSfxSlots((prev) =>
      prev.map((s) =>
        s.id === editingSlot.id
          ? {
              ...s,
              name: editName.trim() || s.name,
              preset: editPreset,
              volume: editVolume,
              customAudioUrl: editCustomUrl,
              customFileName: editFileName,
            }
          : s
      )
    );
    handleCloseEdit();
  };

  const handleDeleteSlot = (id: string) => {
    if (activePlayingId === id) {
      audioEngineInstance.stopCurrentSfx();
      setActivePlayingId(null);
    }
    setSfxSlots((prev) => prev.filter((s) => s.id !== id));
    handleCloseEdit();
  };

  const handleAddNewSlot = () => {
    const newId = `sfx-${Date.now()}`;
    const newSlot: SfxSlot = {
      id: newId,
      name: `✨ SFX ${sfxSlots.length + 1}`,
      preset: 'applause',
      volume: 1.0,
      color: '#00f0ff',
    };
    setSfxSlots((prev) => [...prev, newSlot]);
  };

  const handleResetDefaults = () => {
    audioEngineInstance.stopCurrentSfx();
    setActivePlayingId(null);
    setSfxSlots(INITIAL_SFX_SLOTS);
  };

  return (
    <div className="bg-[#101622] rounded-xl border border-[#25334e] p-3.5 shadow-lg flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-[#f59e0b]/20 text-[#f59e0b] flex items-center justify-center">
              <Volume2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider">
              SFX SOUNDBOARD (BẤM 1 CÁI ĐỂ BẬT • BẤM LẦN NỮA ĐỂ TẮT)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddNewSlot}
              className="px-2.5 py-1 rounded text-xs font-bold bg-[#1e293b] text-[#00f0ff] hover:bg-[#1e2942] border border-[#00f0ff]/30 flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm Nút</span>
            </button>

            <button
              onClick={handleResetDefaults}
              className="px-2 py-1 rounded text-xs text-[#94a3b8] hover:text-white bg-[#161f30] hover:bg-[#1e2942] border border-[#25334e] flex items-center space-x-1 cursor-pointer transition-colors"
              title="Khôi phục danh sách SFX ban đầu"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Mặc định</span>
            </button>
          </div>
        </div>

        {/* SFX Buttons Grid - Wide Rectangular Layout (Giao diện chữ nhật nằm ngang) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {sfxSlots.map((slot) => {
            const isPlaying = activePlayingId === slot.id;

            return (
              <div
                key={slot.id}
                onClick={() => handleToggleSfx(slot)}
                className={`group relative px-3 py-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between h-13 ${
                  isPlaying
                    ? 'bg-[#18263e] border-[#00f0ff] shadow-[0_0_18px_rgba(0,240,255,0.45)] ring-1 ring-[#00f0ff]'
                    : 'bg-[#121824] hover:bg-[#182337] border-[#25334e] hover:border-[#94a3b8]/50 shadow-sm'
                }`}
              >
                {/* Left section: status dot + title + subtitle */}
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                      isPlaying
                        ? 'bg-[#00ff88] animate-ping shadow-[0_0_8px_#00ff88]'
                        : 'bg-[#475569]'
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#f8fafc] truncate block leading-tight">
                      {slot.name}
                    </span>
                    <span
                      className={`text-[10px] block leading-tight font-medium mt-0.5 ${
                        isPlaying
                          ? 'text-[#00ff88] font-bold animate-pulse'
                          : 'text-[#64748b]'
                      }`}
                    >
                      {isPlaying
                        ? '● ĐANG PHÁT (BẤM TẮT)'
                        : slot.preset === 'custom'
                        ? '📁 File riêng'
                        : 'Bấm để phát'}
                    </span>
                  </div>
                </div>

                {/* Right section: Stop indicator or Edit Button */}
                <div className="flex items-center space-x-1 shrink-0 ml-1">
                  {isPlaying ? (
                    <span className="text-[10px] bg-[#ff3366]/20 text-[#ff3366] px-1.5 py-0.5 rounded border border-[#ff3366]/40 font-bold flex items-center space-x-0.5">
                      <Square className="w-2.5 h-2.5 fill-current" />
                      <span>TẮT</span>
                    </span>
                  ) : null}

                  <button
                    onClick={(e) => handleOpenEdit(e, slot)}
                    className="opacity-50 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[#25334e] text-[#94a3b8] hover:text-white transition-opacity cursor-pointer"
                    title="Cài đặt tên và âm thanh"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-[11px] text-[#64748b] pt-2 border-t border-[#1e293b] mt-2.5 flex items-center justify-between">
        <span>💡 Bấm 1 lần để PHÁT • Bấm lần nữa để TẮT ngay • Bấm biểu tượng ⚙ để đổi Tên & Âm thanh</span>
        <span className="text-[#00ff88]">Master Bus Auto-Mix</span>
      </div>

      {/* Edit SFX Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0e1422] rounded-2xl border border-[#25334e] shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#f59e0b]" />
                <h4 className="text-sm font-bold text-[#f8fafc] uppercase tracking-wider">
                  CÀI ĐẶT NÚT SFX
                </h4>
              </div>
              <button
                onClick={handleCloseEdit}
                className="text-[#94a3b8] hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rename Input */}
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1 font-semibold">
                Tên Hiển Thị Của Nút:
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ví dụ: Vỗ tay, Tiếng cười, Còi bar, Troll..."
                className="w-full bg-[#0a0d14] px-3 py-2 rounded-lg border border-[#25334e] text-xs text-[#f8fafc] focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            {/* Sound Preset Selector */}
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1 font-semibold">
                Chọn Âm Thanh (Sound Preset):
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'applause', label: '👏 Vỗ tay (Applause)' },
                  { id: 'laugh', label: '😂 Tiếng cười (Laugh)' },
                  { id: 'horn', label: '📢 Còi hơi DJ (Air Horn)' },
                  { id: 'crowd', label: '🎉 Khán giả reo hò' },
                  { id: 'rimshot', label: '🥁 Trống Ba-dum-tss' },
                  { id: 'sad_trombone', label: '🎺 Troll Wah-wah' },
                  { id: 'bell', label: '🔔 Chuông Ting ting' },
                  { id: 'laser', label: '⚡ Bắn súng Laser' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setEditPreset(item.id as SfxPresetType);
                      setEditCustomUrl(undefined);
                      setEditFileName(undefined);
                    }}
                    className={`p-2 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                      editPreset === item.id
                        ? 'bg-[#00f0ff]/15 border-[#00f0ff] text-[#00f0ff] font-bold'
                        : 'bg-[#121824] border-[#25334e] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    {editPreset === item.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Audio File Upload */}
            <div className="p-3 bg-[#0a0d14] rounded-xl border border-[#25334e] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#f8fafc]">
                  Hoặc Tải File Âm Thanh Riêng:
                </span>
                {editFileName && (
                  <span className="text-[10px] text-[#00ff88] truncate max-w-[150px]">
                    ✓ {editFileName}
                  </span>
                )}
              </div>

              <label className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border border-dashed border-[#00f0ff]/40 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] text-xs font-bold cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>CHỌN FILE MP3 / WAV TỪ MÁY TÍNH</span>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.ogg"
                  onChange={handleCustomAudioUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Volume Slider */}
            <div>
              <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-1">
                <span>Âm Lượng Nút Này:</span>
                <span className="font-mono text-[#f8fafc] font-bold">
                  {Math.round(editVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={editVolume}
                onChange={(e) => setEditVolume(parseFloat(e.target.value))}
                className="w-full accent-[#00f0ff] cursor-pointer"
              />
            </div>

            {/* Test Play & Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1e293b]">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={async () => {
                    await audioEngineInstance.ensureAudioContext();
                    audioEngineInstance.playSfx(
                      'test-preview',
                      {
                        preset: editPreset,
                        customAudioUrl: editCustomUrl,
                        volume: editVolume,
                      }
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1e293b] text-[#00ff88] hover:bg-[#1e2942] border border-[#00ff88]/40 flex items-center space-x-1 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Nghe thử</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteSlot(editingSlot.id)}
                  className="p-1.5 rounded-lg text-[#ff3366] hover:bg-[#ff3366]/10 cursor-pointer"
                  title="Xóa nút này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#94a3b8] hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#00f0ff] text-[#0a0d14] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
                >
                  LƯU THAY ĐỔI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
