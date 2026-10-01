import React, { useEffect, useRef } from 'react';
import { audioEngineInstance } from '../services/webAudioEngine';
import { Activity, Radio } from 'lucide-react';

interface OscilloscopeProps {
  isLive: boolean;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({ isLive }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const micBuffer = new Float32Array(512);
    const masterBuffer = new Float32Array(512);

    const render = () => {
      audioEngineInstance.getWaveformData(micBuffer, masterBuffer);

      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      // Background
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, width, height);

      // Grid Lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.moveTo(0, midY - height * 0.35);
      ctx.lineTo(width, midY - height * 0.35);
      ctx.moveTo(0, midY + height * 0.35);
      ctx.lineTo(width, midY + height * 0.35);
      ctx.stroke();

      // Vertical divisions
      const cols = 8;
      for (let i = 1; i < cols; i++) {
        const x = (width / cols) * i;
        ctx.beginPath();
        ctx.setLineDash([2, 4]);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 1. Draw Master Output Waveform (Magenta subtle background)
      ctx.strokeStyle = 'rgba(217, 70, 239, 0.6)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, midY);

      for (let i = 0; i < masterBuffer.length; i++) {
        const x = (i / (masterBuffer.length - 1)) * width;
        const val = masterBuffer[i];
        const y = midY - val * (height * 0.42);
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 2. Draw Mic Waveform (Cyan bright foreground with glow)
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = isLive ? 6 : 0;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, midY);

      for (let i = 0; i < micBuffer.length; i++) {
        const x = (i / (micBuffer.length - 1)) * width;
        const val = isLive ? micBuffer[i] : 0;
        const y = midY - val * (height * 0.42);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isLive]);

  return (
    <div className="relative bg-[#101622] rounded-xl border border-[#25334e] p-2 shadow-md flex-1 min-w-[300px]">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-1.5">
          <Activity className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span className="text-[11px] font-bold text-[#00f0ff] uppercase tracking-wider">
            REALTIME WAVEFORM ANALYZER
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[10px] text-[#94a3b8]">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-0.5 rounded-sm bg-[#00f0ff] inline-block"></span>
            <span>Mic Bus</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-0.5 rounded-sm bg-[#d946ef] inline-block"></span>
            <span>Output Bus</span>
          </span>
          <span className="text-[#64748b] border-l border-[#25334e] pl-1.5 flex items-center space-x-1">
            <Radio className={`w-2.5 h-2.5 ${isLive ? 'text-[#00ff88]' : 'text-[#64748b]'}`} />
            <span>{isLive ? '48kHz' : 'LIVE OFF'}</span>
          </span>
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-[#1e293b]">
        <canvas
          ref={canvasRef}
          width={800}
          height={120}
          className="w-full h-[110px] block"
        />

        {/* Center overlay indicator if silent */}
        {!isLive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#161f30] text-[#94a3b8] border border-[#25334e]">
              Bấm [● LIVE ON] để kích hoạt phân tích tín hiệu Micro
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
