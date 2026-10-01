import React, { useState, useEffect } from 'react';
import { Circle, Square, Disc, Download } from 'lucide-react';
import { audioEngineInstance } from '../services/webAudioEngine';

export const RecordingSection: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState('00:00');

  useEffect(() => {
    const timer = setInterval(() => {
      if (audioEngineInstance.isCurrentlyRecording()) {
        setIsRecording(true);
        const sec = audioEngineInstance.getRecordDuration();
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        setDuration(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      } else {
        setIsRecording(false);
      }
    }, 250);
    return () => clearInterval(timer);
  }, []);

  const handleToggleRecord = () => {
    if (isRecording) {
      audioEngineInstance.stopRecording();
      setIsRecording(false);
    } else {
      const ok = audioEngineInstance.startRecording();
      if (ok) {
        setIsRecording(true);
      }
    }
  };

  return (
    <div className="bg-[#101622] rounded-xl border border-[#25334e] p-3 shadow-lg flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center space-x-3">
        {/* Record Button */}
        <button
          onClick={handleToggleRecord}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
            isRecording
              ? 'bg-[#ff3366] text-white animate-pulse shadow-[0_0_20px_#ff3366]'
              : 'bg-[#ff3366]/20 text-[#ff3366] border border-[#ff3366]/40 hover:bg-[#ff3366]/30'
          }`}
        >
          {isRecording ? <Square className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5 fill-current" />}
          <span>{isRecording ? '■ DỪNG GHI ÂM' : '● BẮT ĐẦU GHI ÂM'}</span>
        </button>

        {/* Live Timer */}
        <div className="flex items-center space-x-2 bg-[#0a0d14] px-3 py-1.5 rounded-lg border border-[#1e293b]">
          <Disc className={`w-4 h-4 ${isRecording ? 'text-[#ff3366] animate-spin' : 'text-[#64748b]'}`} />
          <span className="font-mono text-sm font-bold text-[#f8fafc]">
            {isRecording ? duration : '00:00'}
          </span>
          <span className="text-[10px] text-[#00f0ff] uppercase tracking-wider pl-1 border-l border-[#1e293b]">
            24-BIT PCM WAV
          </span>
        </div>
      </div>

      <div className="text-xs text-[#94a3b8] flex items-center space-x-2">
        <Download className="w-3.5 h-3.5 text-[#00ff88]" />
        <span>
          Tự động lưu file định dạng: <code className="text-[#00ff88] font-mono text-[11px]">HNStudio_Record_YYYY-MM-DD_HH-MM-SS.wav</code>
        </span>
      </div>
    </div>
  );
};
