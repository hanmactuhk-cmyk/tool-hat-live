import React from 'react';
import { Sliders, Shield, Zap, Wind, Sparkles, Disc, Waves, Repeat } from 'lucide-react';
import {
  NoiseGateParams,
  CompressorParams,
  DeEsserParams,
  ShortReverbParams,
  LongReverbParams,
  EchoDelayParams,
  LimiterParams,
} from '../types/audio';

interface DspToolbarProps {
  noiseGate: NoiseGateParams;
  compressor: CompressorParams;
  eqEnabled: boolean;
  deEsser: DeEsserParams;
  shortReverb: ShortReverbParams;
  longReverb: LongReverbParams;
  echoDelay: EchoDelayParams;
  limiter: LimiterParams;
  onToggleGate: () => void;
  onToggleComp: () => void;
  onToggleEq: () => void;
  onToggleDeEsser: () => void;
  onToggleShortReverb: () => void;
  onToggleLongReverb: () => void;
  onToggleEchoDelay: () => void;
  onToggleLimiter: () => void;
  onOpenPopup: (id: string) => void;
}

export const DspToolbar: React.FC<DspToolbarProps> = ({
  noiseGate,
  compressor,
  eqEnabled,
  deEsser,
  shortReverb,
  longReverb,
  echoDelay,
  limiter,
  onToggleGate,
  onToggleComp,
  onToggleEq,
  onToggleDeEsser,
  onToggleShortReverb,
  onToggleLongReverb,
  onToggleEchoDelay,
  onToggleLimiter,
  onOpenPopup,
}) => {
  const dspModules = [
    {
      id: 'gate',
      title: 'GATE',
      enabled: noiseGate.enabled,
      icon: Wind,
      toggleAction: onToggleGate,
      popupId: 'noise_gate',
      details: `${noiseGate.threshold} dB`,
    },
    {
      id: 'comp',
      title: 'COMP',
      enabled: compressor.enabled,
      icon: Zap,
      toggleAction: onToggleComp,
      popupId: 'compressor',
      details: `${compressor.threshold}dB | ${compressor.ratio}:1`,
    },
    {
      id: 'eq',
      title: '13-EQ',
      enabled: eqEnabled,
      icon: Sliders,
      toggleAction: onToggleEq,
      popupId: 'eq',
      details: 'Parametric',
    },
    {
      id: 'deesser',
      title: 'DE-ESS',
      enabled: deEsser.enabled,
      icon: Disc,
      toggleAction: onToggleDeEsser,
      popupId: 'deesser',
      details: `${deEsser.frequency}Hz`,
    },
    {
      id: 'short_reverb',
      title: 'VANG NGẮN',
      enabled: shortReverb.enabled,
      icon: Sparkles,
      toggleAction: onToggleShortReverb,
      popupId: 'short_reverb',
      details: `${shortReverb.decay.toFixed(1)}s (Plate)`,
    },
    {
      id: 'long_reverb',
      title: 'VANG DÀI',
      enabled: longReverb.enabled,
      icon: Waves,
      toggleAction: onToggleLongReverb,
      popupId: 'long_reverb',
      details: `${longReverb.decay.toFixed(1)}s (Hall)`,
    },
    {
      id: 'echo_delay',
      title: 'ECHO / DELAY',
      enabled: echoDelay.enabled,
      icon: Repeat,
      toggleAction: onToggleEchoDelay,
      popupId: 'echo_delay',
      details: `${echoDelay.time}ms | ${(echoDelay.feedback * 100).toFixed(0)}%`,
    },
    {
      id: 'limiter',
      title: 'LIMITER',
      enabled: limiter.enabled,
      icon: Shield,
      toggleAction: onToggleLimiter,
      popupId: 'limiter',
      details: `${limiter.threshold}dB`,
    },
  ];

  return (
    <div className="bg-[#101622] rounded-xl border border-[#25334e] p-2 shadow-md flex-shrink-0">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[11px] font-bold text-[#00f0ff] uppercase tracking-wider flex items-center space-x-1">
          <Sliders className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span>MIC HARDWARE DSP (VANG NGẮN + VANG DÀI + ECHO DELAY + COMP)</span>
        </span>
        <span className="text-[10px] text-[#64748b] hidden md:inline">
          Routing: Gate → Anti-Feedback → Comp → EQ → DeEsser → Vang Ngắn/Dài → Echo
        </span>
      </div>

      <div className="grid grid-cols-4 lg:grid-cols-8 gap-1.5">
        {dspModules.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className={`rounded-lg p-1.5 border transition-all duration-200 flex flex-col justify-between ${
                m.enabled
                  ? 'bg-[#161f30] border-[#00f0ff]/40 shadow-[0_0_8px_rgba(0,240,255,0.1)]'
                  : 'bg-[#0d121c] border-[#1e293b] opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center space-x-1 truncate">
                  <Icon
                    className={`w-3 h-3 flex-shrink-0 ${
                      m.enabled ? 'text-[#00f0ff]' : 'text-[#64748b]'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold truncate ${
                      m.enabled ? 'text-[#f8fafc]' : 'text-[#64748b]'
                    }`}
                  >
                    {m.title}
                  </span>
                </div>
              </div>

              <div className="text-[9px] text-[#94a3b8] truncate mb-0.5">
                {m.details}
              </div>

              <div className="flex items-center space-x-1 pt-0.5 border-t border-[#1e293b]/60">
                <button
                  onClick={m.toggleAction}
                  className={`flex-1 py-0.5 rounded text-[10px] font-bold tracking-wider transition-colors cursor-pointer ${
                    m.enabled
                      ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50'
                      : 'bg-[#1e293b] text-[#64748b] border border-[#25334e]'
                  }`}
                >
                  {m.enabled ? '● BẬT' : '○ TẮT'}
                </button>

                <button
                  onClick={() => onOpenPopup(m.popupId)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1e2942] text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#25334e] border border-[#25334e] transition-colors cursor-pointer"
                  title="Chỉnh chi tiết"
                >
                  Sửa
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
