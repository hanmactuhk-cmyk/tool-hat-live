import React from 'react';
import { Smile, ThumbsUp, Users, Megaphone } from 'lucide-react';
import { audioEngineInstance } from '../services/webAudioEngine';

export const SfxSection: React.FC = () => {
  const sfxList = [
    { id: 'laugh', title: '😂 Tiếng Cười', icon: Smile, color: 'text-[#f59e0b]' },
    { id: 'applause', title: '👏 Vỗ Tay', icon: ThumbsUp, color: 'text-[#00f0ff]' },
    { id: 'crowd', title: '🎉 Hò Reo', icon: Users, color: 'text-[#a855f7]' },
    { id: 'horn', title: '📢 Còi Hơi', icon: Megaphone, color: 'text-[#ff3366]' },
  ];

  return (
    <div className="bg-[#101622] rounded-xl border border-[#25334e] p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider">
          SFX SOUNDBOARD (HIỆU ỨNG ÂM THANH LIVE)
        </span>
        <span className="text-[11px] text-[#64748b]">Tự động hòa âm vào Master Bus</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {sfxList.map((s) => (
          <button
            key={s.id}
            onClick={() => audioEngineInstance.playSfx(s.id as 'laugh' | 'applause' | 'crowd' | 'horn')}
            className="px-3 py-2 rounded-lg bg-[#161f30] hover:bg-[#1e2942] border border-[#25334e] hover:border-[#94a3b8] transition-all flex items-center justify-center space-x-2 text-xs font-bold text-[#f8fafc] active:scale-95 cursor-pointer shadow-sm"
          >
            <span>{s.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
