import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Square, Upload, Music, SkipBack, SkipForward } from 'lucide-react';
import { audioEngineInstance } from '../services/webAudioEngine';

interface MusicPlayerSectionProps {
  onMusicVolumeChange: (vol: number) => void;
  musicVolume: number;
}

export const MusicPlayerSection: React.FC<MusicPlayerSectionProps> = ({
  onMusicVolumeChange,
  musicVolume,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState<string>('Chưa chọn bài hát (Beat)');
  const [progress, setProgress] = useState<{ current: number; duration: number; percent: number }>({
    current: 0,
    duration: 0,
    percent: 0,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const prog = audioEngineInstance.getMusicProgress();
      setProgress(prog);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      audioEngineInstance.loadMusicFile(file);
      setTrackName(file.name.replace(/\.[^/.]+$/, ''));
      audioEngineInstance.playMusic();
      setIsPlaying(true);
    }
  };

  const handlePlay = () => {
    audioEngineInstance.playMusic();
    setIsPlaying(true);
  };

  const handlePause = () => {
    audioEngineInstance.pauseMusic();
    setIsPlaying(false);
  };

  const handleStop = () => {
    audioEngineInstance.stopMusic();
    setIsPlaying(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value);
    audioEngineInstance.seekMusic(percent);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#101622] rounded-xl border border-[#25334e] p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#d946ef] uppercase tracking-wider flex items-center space-x-1.5">
          <Music className="w-4 h-4 text-[#d946ef]" />
          <span>MUSIC PLAYER (BEAT / NHẠC NỀN - TÁCH BUS RIÊNG BIỆT)</span>
        </span>

        <span className="text-[11px] text-[#64748b]">
          TUYỆT ĐỐI không đi qua MIC effects
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Open Beat File Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#161f30] text-[#00f0ff] border border-[#00f0ff]/40 hover:bg-[#00f0ff]/10 transition-colors flex items-center space-x-1.5 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>MỞ NHẠC BEAT</span>
        </button>

        {/* Transport buttons */}
        <div className="flex items-center space-x-1 bg-[#0a0d14] p-1 rounded-lg border border-[#1e293b]">
          <button
            onClick={() => audioEngineInstance.seekMusic(0)}
            className="p-1.5 rounded text-[#94a3b8] hover:text-white hover:bg-[#1e2942] transition-colors"
            title="Về đầu bài"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {isPlaying ? (
            <button
              onClick={handlePause}
              className="p-1.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 hover:bg-[#f59e0b]/30 transition-colors"
              title="Tạm dừng"
            >
              <Pause className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="p-1.5 rounded bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40 hover:bg-[#00ff88]/30 transition-colors"
              title="Phát nhạc"
            >
              <Play className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleStop}
            className="p-1.5 rounded text-[#94a3b8] hover:text-[#ff3366] hover:bg-[#1e2942] transition-colors"
            title="Dừng hẳn"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Track Title */}
        <div className="flex-1 min-w-[200px] bg-[#0a0d14] px-3 py-1.5 rounded-lg border border-[#1e293b]">
          <span className="text-xs font-semibold text-[#f8fafc] truncate block">
            {trackName}
          </span>
        </div>

        {/* Music Volume Quick slider */}
        <div className="flex items-center space-x-2 text-xs text-[#94a3b8]">
          <span>Vol:</span>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.01"
            value={musicVolume}
            onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
            className="w-20 accent-[#d946ef] cursor-pointer"
          />
          <span className="font-mono text-[#f8fafc] w-9">{(musicVolume * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Timeline seek bar */}
      <div className="mt-2.5 flex items-center space-x-3">
        <span className="text-[11px] font-mono text-[#94a3b8] w-10 text-right">
          {formatTime(progress.current)}
        </span>

        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress.percent || 0}
          onChange={handleSeek}
          className="flex-1 h-1.5 rounded-lg bg-[#1e293b] accent-[#d946ef] cursor-pointer"
        />

        <span className="text-[11px] font-mono text-[#64748b] w-10">
          {formatTime(progress.duration)}
        </span>
      </div>
    </div>
  );
};
