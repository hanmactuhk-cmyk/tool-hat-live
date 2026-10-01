import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Upload,
  Music,
  SkipBack,
  Disc,
  Volume2,
  Youtube,
  Search,
  ExternalLink,
  Zap,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Sparkles,
  Scaling,
} from 'lucide-react';
import { audioEngineInstance } from '../services/webAudioEngine';
import { YouTubePipModal } from './YouTubePipModal';

interface MusicPlayerSectionProps {
  onMusicVolumeChange: (vol: number) => void;
  musicVolume: number;
}

const YOUTUBE_PRESETS = [
  {
    title: 'Duyên Phận - Tone Nữ (Bolero Chuẩn)',
    url: 'https://www.youtube.com/watch?v=kYJqD9kK7Qc',
    genre: 'Bolero',
    tag: 'Tone Nữ',
  },
  {
    title: 'Ai Chung Tình Được Mãi - Tone Nam',
    url: 'https://www.youtube.com/watch?v=9_gYF_hFk4M',
    genre: 'Ballad',
    tag: 'Tone Nam',
  },
  {
    title: 'Hoa Cỏ Lau - Remix Bass Cực Căng',
    url: 'https://www.youtube.com/watch?v=mD0e4mNqT8U',
    genre: 'Remix',
    tag: 'Vinahouse',
  },
  {
    title: 'Ngày Chưa Giông Bão - Acoustic Guitar',
    url: 'https://www.youtube.com/watch?v=0kF4g8I2U0s',
    genre: 'Acoustic',
    tag: 'Acoustic',
  },
  {
    title: 'Cắt Đôi Nỗi Sầu - Beat Chuẩn Ca Sĩ',
    url: 'https://www.youtube.com/watch?v=H7BwQcK9tZ8',
    genre: 'Nhạc Trẻ',
    tag: 'Tone Chuẩn',
  },
  {
    title: 'Sầu Tím Thiệp Hồng - Song Ca Nam Nữ',
    url: 'https://www.youtube.com/watch?v=Z6z_Y-VwYlU',
    genre: 'Song Ca',
    tag: 'Song Ca',
  },
];

export const MusicPlayerSection: React.FC<MusicPlayerSectionProps> = ({
  onMusicVolumeChange,
  musicVolume,
}) => {
  const [activeTab, setActiveTab] = useState<'local' | 'youtube'>('youtube');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeatType, setActiveBeatType] = useState<string | null>(null);
  const [trackName, setTrackName] = useState<string>('Karaoke YouTube Trực Tuyến');
  const [progress, setProgress] = useState<{ current: number; duration: number; percent: number }>({
    current: 0,
    duration: 0,
    percent: 0,
  });

  // YouTube states
  const [youtubeInput, setYoutubeInput] = useState<string>('https://www.youtube.com/watch?v=9_gYF_hFk4M');
  const [activeYoutubeVideoId, setActiveYoutubeVideoId] = useState<string>('9_gYF_hFk4M');
  const [videoSize, setVideoSize] = useState<'compact' | 'medium' | 'hidden'>('compact');
  const [isPipModalOpen, setIsPipModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Latency measurement
  const [latencyMs, setLatencyMs] = useState<number>(2.4);
  const [ultraLowLatencyMode, setUltraLowLatencyMode] = useState<boolean>(true);

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
      setLatencyMs(audioEngineInstance.getLatencyMs());
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const extractYoutubeVideoId = (input: string): string => {
    if (!input) return '';
    const trimmed = input.trim();
    // Direct 11 char ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    // Standard URL format
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = trimmed.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    return '';
  };

  const handleLoadYoutube = (urlOrId?: string) => {
    const target = urlOrId || youtubeInput;
    const videoId = extractYoutubeVideoId(target);
    if (videoId) {
      setActiveYoutubeVideoId(videoId);
      setTrackName(`YouTube Video: ${videoId}`);
      if (videoSize === 'hidden') setVideoSize('compact');
    } else {
      // If user typed a search query instead of URL, open search helper or use embed query
      const encoded = encodeURIComponent(target + ' karaoke');
      window.open(`https://www.youtube.com/results?search_query=${encoded}`, '_blank');
    }
  };

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
    <div className="bg-[#101622] rounded-xl border border-[#25334e] p-3.5 shadow-xl transition-all">
      {/* Top Header & Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 border-b border-[#1e293b] pb-2.5">
        {/* Tab Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'youtube'
                ? 'bg-[#ff0000]/20 text-[#ff4444] border border-[#ff0000]/50 shadow-[0_0_12px_rgba(255,0,0,0.3)]'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white border border-transparent'
            }`}
          >
            <Youtube className="w-4 h-4 text-[#ff0000]" />
            <span>KHUNG YOUTUBE KARAOKE LIVE</span>
          </button>

          <button
            onClick={() => setActiveTab('local')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'local'
                ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white border border-transparent'
            }`}
          >
            <Music className="w-4 h-4 text-[#00f0ff]" />
            <span>BEAT TỪ MÁY / FILE MP3</span>
          </button>
        </div>

        {/* Real-time Ultra Low Latency Monitor Indicator */}
        <div className="flex items-center space-x-2">
          <div
            onClick={() => setUltraLowLatencyMode(!ultraLowLatencyMode)}
            className="flex items-center space-x-1.5 bg-[#00ff88]/10 text-[#00ff88] px-2.5 py-1 rounded-md border border-[#00ff88]/40 text-[11px] font-mono font-bold cursor-pointer hover:bg-[#00ff88]/20 transition-all shadow-[0_0_8px_rgba(0,255,136,0.15)]"
            title="Độ trễ âm thanh Micro trực tiếp từ phần cứng. Nhấp để chuyển đổi tối ưu."
          >
            <Zap className="w-3.5 h-3.5 fill-current animate-pulse text-[#00ff88]" />
            <span>ĐỘ TRỄ MIC: {latencyMs.toFixed(1)}ms</span>
            <span className="text-[9px] bg-[#00ff88]/30 px-1 py-0.2 rounded text-white font-sans uppercase">
              {ultraLowLatencyMode ? '0-LAG TURBO' : 'CHUẨN'}
            </span>
          </div>

          <span className="text-[11px] text-[#00f0ff] bg-[#00f0ff]/10 px-2 py-1 rounded border border-[#00f0ff]/30 font-medium hidden sm:inline-block">
            ✓ Bus Tách Rời Tuyệt Đối
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: YOUTUBE KARAOKE PLAYER EMBED */}
      {/* ========================================================================= */}
      {activeTab === 'youtube' && (
        <div className="space-y-3">
          {/* YouTube Input & Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[280px] relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#ff0000]">
                <Youtube className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoadYoutube()}
                placeholder="Dán link YouTube (https://www.youtube.com/watch?v=...) hoặc tên bài hát"
                className="w-full pl-8 pr-20 py-2 rounded-lg bg-[#0a0d14] border border-[#25334e] text-xs text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#ff0000] focus:ring-1 focus:ring-[#ff0000] transition-all"
              />
              <button
                onClick={() => handleLoadYoutube()}
                className="absolute right-1 top-1 bottom-1 px-2.5 rounded-md bg-[#ff0000] text-white text-xs font-bold hover:bg-[#cc0000] transition-colors cursor-pointer flex items-center space-x-1"
              >
                <span>MỞ BEAT</span>
              </button>
            </div>

            {/* Quick Video Size Toggles & Floating PiP Button */}
            <div className="flex items-center space-x-1 bg-[#0a0d14] p-1 rounded-lg border border-[#1e293b]">
              <button
                onClick={() => setIsPipModalOpen(true)}
                className="px-2 py-1 rounded text-xs flex items-center space-x-1 bg-[#ff0000]/20 text-[#ff4444] hover:bg-[#ff0000]/30 border border-[#ff0000]/40 transition-colors cursor-pointer shadow-[0_0_8px_rgba(255,0,0,0.2)]"
                title="Mở video ra cửa sổ nổi PiP có thể kéo to nhỏ và di chuyển khắp màn hình"
              >
                <Scaling className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">CỬA SỔ NỔI (PiP)</span>
              </button>

              <button
                onClick={() => setVideoSize(videoSize === 'hidden' ? 'compact' : 'hidden')}
                className={`px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors ${
                  videoSize === 'hidden' ? 'bg-[#ff3366]/20 text-[#ff3366]' : 'text-[#94a3b8] hover:text-white'
                }`}
                title="Ẩn/Hiện Khung Video Chữ Hát"
              >
                {videoSize === 'hidden' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="text-[11px] font-semibold">{videoSize === 'hidden' ? 'Đang Ẩn' : 'Hiện Video'}</span>
              </button>

              <button
                onClick={() => setVideoSize('compact')}
                className={`p-1.5 rounded transition-colors ${
                  videoSize === 'compact' ? 'bg-[#25334e] text-[#00f0ff]' : 'text-[#94a3b8] hover:text-white'
                }`}
                title="Khung Nhỏ Gọn"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setVideoSize('medium')}
                className={`p-1.5 rounded transition-colors ${
                  videoSize === 'medium' ? 'bg-[#25334e] text-[#00f0ff]' : 'text-[#94a3b8] hover:text-white'
                }`}
                title="Khung To Xem Rõ Lời"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Beat Volume Slider */}
            <div className="flex items-center space-x-2 text-xs text-[#94a3b8] bg-[#0a0d14] px-3 py-1.5 rounded-lg border border-[#1e293b]">
              <Volume2 className="w-4 h-4 text-[#ff4444]" />
              <span className="font-semibold">Âm Lượng:</span>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.01"
                value={musicVolume}
                onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
                className="w-20 accent-[#ff0000] cursor-pointer"
              />
              <span className="font-mono text-[#f8fafc] w-9 font-bold">{(musicVolume * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* Preset Buttons for Instant Karaoke Hits */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0a0d14]/70 p-2 rounded-lg border border-[#1e293b]">
            <span className="text-[10px] text-[#f59e0b] font-black uppercase tracking-wider flex items-center mr-1">
              <Sparkles className="w-3 h-3 mr-1" />
              GỢI Ý KARAOKE HOT:
            </span>
            {YOUTUBE_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setYoutubeInput(preset.url);
                  handleLoadYoutube(preset.url);
                }}
                className="px-2 py-1 rounded bg-[#161f30] hover:bg-[#ff0000]/20 text-[#cbd5e1] hover:text-[#ff4444] border border-[#25334e] hover:border-[#ff0000]/40 text-[11px] font-medium transition-all cursor-pointer flex items-center space-x-1"
              >
                <span className="text-[9px] px-1 rounded bg-[#0a0d14] text-[#00f0ff] font-bold">{preset.tag}</span>
                <span>{preset.title.split('-')[0]}</span>
              </button>
            ))}
          </div>

          {/* Interactive YouTube Embed Window (With Lyrics Display) */}
          {videoSize !== 'hidden' && activeYoutubeVideoId && (
            <div className="relative rounded-xl overflow-hidden border border-[#ff0000]/30 shadow-[0_0_20px_rgba(255,0,0,0.15)] bg-black">
              <div
                className={`w-full transition-all duration-300 ${
                  videoSize === 'medium' ? 'h-[420px]' : 'h-[250px]'
                }`}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${activeYoutubeVideoId}?autoplay=1&enablejsapi=1&origin=${window.location.origin}`}
                  title="YouTube Karaoke Video Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              {/* Bottom Quick Bar inside video card */}
              <div className="bg-[#0a0d14] px-3 py-1.5 flex items-center justify-between text-[11px] text-[#94a3b8] border-t border-[#1e293b]">
                <span className="text-[#00ff88] font-medium flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping inline-block mr-1" />
                  Đang phát từ YouTube • Micro hát đè trực tiếp với Reverb & Compressor
                </span>
                <a
                  href={`https://www.youtube.com/watch?v=${activeYoutubeVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00f0ff] hover:underline flex items-center space-x-1 font-semibold"
                >
                  <span>Mở tab YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LOCAL BEAT FILE & SYNTH DEMO BEATS */}
      {/* ========================================================================= */}
      {activeTab === 'local' && (
        <div className="space-y-3">
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
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 hover:bg-[#00f0ff]/30 transition-all flex items-center space-x-1.5 cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)]"
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
            <div className="flex-1 min-w-[180px] bg-[#0a0d14] px-3 py-1.5 rounded-lg border border-[#1e293b] flex items-center space-x-2">
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
      )}

      {/* Floating Draggable & Resizable YouTube PiP Modal */}
      <YouTubePipModal
        isOpen={isPipModalOpen}
        videoId={activeYoutubeVideoId}
        onClose={() => setIsPipModalOpen(false)}
        musicVolume={musicVolume}
        onMusicVolumeChange={onMusicVolumeChange}
      />
    </div>
  );
};
