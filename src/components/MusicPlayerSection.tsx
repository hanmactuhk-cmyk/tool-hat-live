import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Square, Upload, Music, SkipBack, Disc, Volume2 } from 'lucide-react';
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
  const [activeBeatType, setActiveBeatType] = useState<string | null>(null);
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
      const isActuallyPlaying = audioEngineInstance.isMusicPlaying();
      setIsPlaying(isActuallyPlaying);
      if (isActuallyPlaying && audioEngineInstance.isDemoBeatActive()) {
        setActiveBeatType(audioEngineInstance.getDemoBeatType());
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await audioEngineInstance.ensureAudioContext();
      await audioEngineInstance.loadMusicFile(file);
      setTrackName(file.name.replace(/\.[^/.]+$/, ''));
      setActiveBeatType('custom');
      setIsPlaying(true);
    }
  };

  const handlePlayDemoBeat = async (type: 'ballad' | 'bolero' | 'lofi') => {
    await audioEngineInstance.ensureAudioContext();
    if (activeBeatType === type && isPlaying) {
      // Toggle pause if clicking current playing demo beat
      audioEngineInstance.pauseMusic();
      setIsPlaying(false);
      return;
    }

    const titles: Record<string, string> = {
      ballad: 'Beat Demo: Pop Ballad Acoustic (84 BPM - G Major)',
      bolero: 'Beat Demo: Bolero Trữ Tình Guitar (94 BPM - D Minor)',
      lofi: 'Beat Demo: Lofi Chill R&B (76 BPM - C Major)',
    };

    setTrackName(titles[type]);
    setActiveBeatType(type);
    setIsPlaying(true);
    await audioEngineInstance.playDemoBeat(type);
  };

  const handlePlay = async () => {
    await audioEngineInstance.ensureAudioContext();
    if (activeBeatType && activeBeatType !== 'custom') {
      await audioEngineInstance.playDemoBeat(activeBeatType as 'ballad' | 'bolero' | 'lofi');
    } else {
      await audioEngineInstance.playMusic();
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    audioEngineInstance.pauseMusic();
    setIsPlaying(false);
  };

  const handleStop = () => {
    audioEngineInstance.stopMusic();
    setIsPlaying(false);
    setActiveBeatType(null);
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
    <div className="bg-[#101622] rounded-xl border border-[#25334e] p-3.5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-[#d946ef]/20 text-[#d946ef] flex items-center justify-center">
            <Music className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-[#d946ef] uppercase tracking-wider">
            MUSIC PLAYER (BEAT / NHẠC NỀN - TÁCH BUS RIÊNG BIỆT)
          </span>
        </div>

        <span className="text-[11px] text-[#00ff88] bg-[#00ff88]/10 px-2 py-0.5 rounded border border-[#00ff88]/30 font-medium">
          ✓ Bus riêng sạch sẽ • TUYỆT ĐỐI không dính Reverb/Compressor của Mic
        </span>
      </div>

      {/* Main Transport & Beat Selector */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Open Beat File Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={async () => {
            await audioEngineInstance.ensureAudioContext();
            fileInputRef.current?.click();
          }}
          className="px-3 py-2 rounded-lg text-xs font-bold bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 hover:bg-[#00f0ff]/30 transition-all flex items-center space-x-1.5 cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)]"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>CHỌN FILE NHẠC TỪ MÁY (.mp3, .wav)</span>
        </button>

        {/* Built-in Beat Presets */}
        <div className="flex items-center space-x-1.5 bg-[#0a0d14] p-1 rounded-lg border border-[#1e293b]">
          <span className="text-[10px] text-[#94a3b8] px-1 font-bold">BEAT SẴN:</span>
          
          <button
            onClick={() => handlePlayDemoBeat('ballad')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
              activeBeatType === 'ballad' && isPlaying
                ? 'bg-[#d946ef] text-white shadow-[0_0_12px_rgba(217,70,239,0.5)]'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white'
            }`}
          >
            <Disc className={`w-3 h-3 ${activeBeatType === 'ballad' && isPlaying ? 'animate-spin' : ''}`} />
            <span>Ballad Acoustic</span>
          </button>

          <button
            onClick={() => handlePlayDemoBeat('bolero')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
              activeBeatType === 'bolero' && isPlaying
                ? 'bg-[#d946ef] text-white shadow-[0_0_12px_rgba(217,70,239,0.5)]'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white'
            }`}
          >
            <Disc className={`w-3 h-3 ${activeBeatType === 'bolero' && isPlaying ? 'animate-spin' : ''}`} />
            <span>Bolero Guitar</span>
          </button>

          <button
            onClick={() => handlePlayDemoBeat('lofi')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
              activeBeatType === 'lofi' && isPlaying
                ? 'bg-[#d946ef] text-white shadow-[0_0_12px_rgba(217,70,239,0.5)]'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white'
            }`}
          >
            <Disc className={`w-3 h-3 ${activeBeatType === 'lofi' && isPlaying ? 'animate-spin' : ''}`} />
            <span>Lofi R&B</span>
          </button>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center space-x-1 bg-[#0a0d14] p-1 rounded-lg border border-[#1e293b]">
          <button
            onClick={() => {
              audioEngineInstance.seekMusic(0);
            }}
            className="p-1.5 rounded text-[#94a3b8] hover:text-white hover:bg-[#1e2942] transition-colors cursor-pointer"
            title="Về đầu bài"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {isPlaying ? (
            <button
              onClick={handlePause}
              className="p-1.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 hover:bg-[#f59e0b]/30 transition-colors cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)]"
              title="Tạm dừng"
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="p-1.5 rounded bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40 hover:bg-[#00ff88]/30 transition-colors cursor-pointer shadow-[0_0_10px_rgba(0,255,136,0.3)]"
              title="Phát nhạc"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          )}

          <button
            onClick={handleStop}
            className="p-1.5 rounded text-[#94a3b8] hover:text-[#ff3366] hover:bg-[#1e2942] transition-colors cursor-pointer"
            title="Dừng hẳn"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Track Title Display */}
        <div className="flex-1 min-w-[200px] bg-[#0a0d14] px-3 py-1.5 rounded-lg border border-[#1e293b] flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#f8fafc] truncate block">
            {trackName}
          </span>
        </div>

        {/* Music Volume Slider */}
        <div className="flex items-center space-x-2 text-xs text-[#94a3b8] bg-[#0a0d14] px-2.5 py-1.5 rounded-lg border border-[#1e293b]">
          <Volume2 className="w-3.5 h-3.5 text-[#d946ef]" />
          <span>Beat Vol:</span>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.01"
            value={musicVolume}
            onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
            className="w-20 accent-[#d946ef] cursor-pointer"
          />
          <span className="font-mono text-[#f8fafc] w-9 font-bold">{(musicVolume * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Timeline seek bar */}
      <div className="mt-2.5 flex items-center space-x-3">
        <span className="text-[11px] font-mono text-[#00f0ff] w-12 text-right font-bold">
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

        <span className="text-[11px] font-mono text-[#64748b] w-12 font-bold">
          {formatTime(progress.duration)}
        </span>
      </div>
    </div>
  );
};
