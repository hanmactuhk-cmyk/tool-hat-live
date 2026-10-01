import React from 'react';
import { Volume2, Mic, Music, AlertTriangle } from 'lucide-react';
import { AudioMeterData } from '../types/audio';

interface ChannelStripsProps {
  micVolume: number;
  onMicVolumeChange: (val: number) => void;
  musicVolume: number;
  onMusicVolumeChange: (val: number) => void;
  masterVolume: number;
  onMasterVolumeChange: (val: number) => void;
  meterData: AudioMeterData;
  isLive: boolean;
}

export const ChannelStrips: React.FC<ChannelStripsProps> = ({
  micVolume,
  onMicVolumeChange,
  musicVolume,
  onMusicVolumeChange,
  masterVolume,
  onMasterVolumeChange,
  meterData,
  isLive,
}) => {
  // Render VU LED Segment Tower
  const renderMeter = (peak: number, rms: number, accentColor: string) => {
    const totalSegments = 14;
    const activeSegments = Math.round(peak * totalSegments);
    const rmsSegment = Math.round(rms * totalSegments);

    return (
      <div className="w-3 h-[95px] bg-[#0a0d14] rounded-sm p-[1px] flex flex-col-reverse gap-[1.5px] border border-[#25334e]">
        {Array.from({ length: totalSegments }).map((_, idx) => {
          const isActive = idx < activeSegments;
          const isRms = idx === rmsSegment;

          let colorClass = 'bg-[#1e293b]';
          if (isActive) {
            if (idx >= 12) colorClass = 'bg-[#ff3366] shadow-[0_0_5px_#ff3366]';
            else if (idx >= 9) colorClass = 'bg-[#f59e0b] shadow-[0_0_4px_#f59e0b]';
            else colorClass = accentColor;
          } else if (isRms) {
            colorClass = 'bg-white/70';
          }

          return (
            <div
              key={idx}
              className={`w-full flex-1 rounded-[1px] transition-colors duration-75 ${colorClass}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-nowrap gap-2 flex-shrink-0">
      {/* 1. MIC CHANNEL STRIP */}
      <div className="w-[105px] bg-[#101622] rounded-xl border border-[#25334e] p-2 flex flex-col items-center shadow-md">
        <div className="flex items-center space-x-1 mb-1">
          <Mic className="w-3 h-3 text-[#00f0ff]" />
          <span className="text-[11px] font-bold text-[#00f0ff] uppercase tracking-wider">
            MIC IN
          </span>
        </div>

        <div className="flex items-center space-x-2 my-0.5">
          {/* Fader */}
          <div className="flex flex-col items-center">
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.01"
              value={micVolume}
              onChange={(e) => onMicVolumeChange(parseFloat(e.target.value))}
              className="h-[95px] w-2 appearance-none bg-[#1e293b] rounded-lg accent-[#00f0ff] cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
            />
          </div>

          {/* Meter */}
          {renderMeter(isLive ? meterData.micPeak : 0, meterData.micRms, 'bg-[#00f0ff] shadow-[0_0_4px_#00f0ff]')}
        </div>

        <div className="mt-1 text-center">
          <span className="text-[10px] font-mono font-bold text-[#f8fafc]">
            {(micVolume * 100).toFixed(0)}%
          </span>
          <p className="text-[8px] text-[#64748b]">MIC VOL</p>
        </div>
      </div>

      {/* 2. MUSIC CHANNEL STRIP */}
      <div className="w-[105px] bg-[#101622] rounded-xl border border-[#25334e] p-2 flex flex-col items-center shadow-md">
        <div className="flex items-center space-x-1 mb-1">
          <Music className="w-3 h-3 text-[#d946ef]" />
          <span className="text-[11px] font-bold text-[#d946ef] uppercase tracking-wider">
            MUSIC
          </span>
        </div>

        <div className="flex items-center space-x-2 my-0.5">
          {/* Fader */}
          <div className="flex flex-col items-center">
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.01"
              value={musicVolume}
              onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
              className="h-[95px] w-2 appearance-none bg-[#1e293b] rounded-lg accent-[#d946ef] cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
            />
          </div>

          {/* Meter */}
          {renderMeter(musicVolume * (isLive ? 0.75 : 0), musicVolume * 0.5, 'bg-[#d946ef] shadow-[0_0_4px_#d946ef]')}
        </div>

        <div className="mt-1 text-center">
          <span className="text-[10px] font-mono font-bold text-[#f8fafc]">
            {(musicVolume * 100).toFixed(0)}%
          </span>
          <p className="text-[8px] text-[#64748b]">BEAT VOL</p>
        </div>
      </div>

      {/* 3. MASTER CHANNEL STRIP */}
      <div className="w-[115px] bg-[#101622] rounded-xl border border-[#25334e] p-2 flex flex-col items-center shadow-md">
        <div className="flex items-center justify-between w-full mb-1">
          <div className="flex items-center space-x-1">
            <Volume2 className="w-3 h-3 text-[#00ff88]" />
            <span className="text-[11px] font-bold text-[#00ff88] uppercase tracking-wider">
              MASTER
            </span>
          </div>

          {/* CLIP LED */}
          <div
            className={`px-1 py-0.2 rounded text-[8px] font-bold flex items-center space-x-0.5 transition-colors ${
              meterData.isClipping
                ? 'bg-[#ff3366] text-white animate-bounce shadow-[0_0_8px_#ff3366]'
                : 'bg-[#1e293b] text-[#64748b]'
            }`}
          >
            <AlertTriangle className="w-2 h-2" />
            <span>CLIP</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 my-0.5">
          {/* Fader */}
          <div className="flex flex-col items-center">
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.01"
              value={masterVolume}
              onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
              className="h-[95px] w-2 appearance-none bg-[#1e293b] rounded-lg accent-[#00ff88] cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
            />
          </div>

          {/* Stereo Dual Meters */}
          <div className="flex space-x-1">
            {renderMeter(isLive ? meterData.outPeak : 0, meterData.outRms, 'bg-[#00ff88] shadow-[0_0_4px_#00ff88]')}
            {renderMeter(isLive ? meterData.outPeak * 0.96 : 0, meterData.outRms * 0.96, 'bg-[#00ff88] shadow-[0_0_4px_#00ff88]')}
          </div>
        </div>

        <div className="mt-1 text-center">
          <span className="text-[10px] font-mono font-bold text-[#f8fafc]">
            {(masterVolume * 100).toFixed(0)}%
          </span>
          <p className="text-[8px] text-[#64748b]">MAIN OUT</p>
        </div>
      </div>
    </div>
  );
};
