import React, { useState, useRef, useEffect } from 'react';
import {
  Youtube,
  Move,
  Minimize2,
  Maximize2,
  X,
  Volume2,
  ExternalLink,
  Pin,
  Sparkles,
  Scaling,
} from 'lucide-react';

interface YouTubePipModalProps {
  isOpen: boolean;
  videoId: string;
  onClose: () => void;
  musicVolume: number;
  onMusicVolumeChange: (vol: number) => void;
}

export const YouTubePipModal: React.FC<YouTubePipModalProps> = ({
  isOpen,
  videoId,
  onClose,
  musicVolume,
  onMusicVolumeChange,
}) => {
  if (!isOpen || !videoId) return null;

  // Window position (Draggable)
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: Math.max(20, window.innerWidth - 440),
    y: 60,
  });
  // Window size (Resizable)
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 400,
    height: 240,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState<{ width: number; height: number }>({ width: 400, height: 240 });
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle Dragging
  const handleMouseDownHeader = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  // Handle Resizing
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY });
    setInitialSize({ width: size.width, height: size.height });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(10, Math.min(window.innerWidth - size.width - 10, e.clientX - dragStart.x));
        const newY = Math.max(10, Math.min(window.innerHeight - size.height - 10, e.clientY - dragStart.y));
        setPosition({ x: newX, y: newY });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newW = Math.max(260, Math.min(800, initialSize.width + deltaX));
        const newH = Math.max(160, Math.min(500, initialSize.height + deltaY));
        setSize({ width: newW, height: newH });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, initialSize, size]);

  const setPresetSize = (w: number, h: number) => {
    setSize({ width: w, height: h });
  };

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height + 40}px`,
      }}
      className="fixed z-50 bg-[#0a0d14] rounded-xl border-2 border-[#ff0000]/60 shadow-[0_0_30px_rgba(255,0,0,0.35)] flex flex-col overflow-hidden select-none animate-in fade-in duration-150"
    >
      {/* Draggable Title Header */}
      <div
        onMouseDown={handleMouseDownHeader}
        className="px-2.5 py-1.5 bg-[#161f30] border-b border-[#25334e] flex items-center justify-between cursor-move text-xs text-[#f8fafc]"
      >
        <div className="flex items-center space-x-1.5 truncate">
          <Youtube className="w-3.5 h-3.5 text-[#ff0000] flex-shrink-0" />
          <span className="font-bold text-[11px] truncate tracking-wide text-white">
            KARAOKE YOUTUBE (KÉO THẢ & CO GIÃN)
          </span>
        </div>

        {/* Quick Sizing & Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setPresetSize(280, 165)}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1e293b] hover:bg-[#ff0000]/20 text-[#cbd5e1] hover:text-[#ff4444] transition-colors"
            title="Thu nhỏ 280px"
          >
            Nhỏ
          </button>
          <button
            onClick={() => setPresetSize(420, 245)}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1e293b] hover:bg-[#ff0000]/20 text-[#cbd5e1] hover:text-[#ff4444] transition-colors"
            title="Vừa 420px"
          >
            Vừa
          </button>
          <button
            onClick={() => setPresetSize(600, 340)}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1e293b] hover:bg-[#ff0000]/20 text-[#cbd5e1] hover:text-[#ff4444] transition-colors"
            title="Lớn 600px"
          >
            To
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded text-[#94a3b8] hover:text-[#ff3366] hover:bg-[#1e2942] transition-colors cursor-pointer"
            title="Đóng Popup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Embedded Iframe Video Screen */}
      <div className="flex-1 bg-black relative w-full h-full overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${window.location.origin}`}
          title="YouTube PiP Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0 pointer-events-auto"
        />

        {/* Corner Resize Drag Handle */}
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute bottom-0 right-0 w-5 h-5 bg-[#ff0000]/30 hover:bg-[#ff0000] text-white flex items-center justify-center cursor-nwse-resize z-10 rounded-tl-lg transition-colors"
          title="Bấm giữ và kéo để phóng to / thu nhỏ khung video"
        >
          <Scaling className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
