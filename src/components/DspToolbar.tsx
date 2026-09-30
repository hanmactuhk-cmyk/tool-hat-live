import React from 'react';
import { Sliders, Shield, Zap, Wind, Sparkles, Disc } from 'lucide-react';
import {
  NoiseGateParams,
  CompressorParams,
  DeEsserParams,
  ReverbParams,
  LimiterParams,
} from '../types/audio';

interface DspToolbarProps {
  noiseGate: NoiseGateParams;
  compressor: CompressorParams;
  eqEnabled: boolean;
  deEsser: DeEsserParams;
  reverb: ReverbParams;
  limiter: LimiterParams;
  onToggleGate: () => void;
  onToggleComp: () => void;
  onToggleEq: () => void;
  onToggleDeEsser: () => void;
  onToggleReverb: () => void;
  onToggleLimiter: () => void;
  onOpenPopup: (id: string) => void;
}

export const DspToolbar: React.FC<DspToolbarProps> = ({
  noiseGate,
  compressor,
  eqEnabled,
  deEsser,
  reverb,
  limiter,
  onToggleGate,
  onToggleComp,
  onToggleEq,
  onToggleDeEsser,
  onToggleReverb,
  onToggleLimiter,
  onOpenPopup,
}) => {
  const dspModules = [
    {
      id: 'gate',
      title: 'NOISE GATE',
      enabled: noiseGate.enabled,
      icon: Wind,
      toggleAction: onToggleGate,
      popupId: 'noise_gate',
      details: `${noiseGate.threshold} dB`,
    },
    {
      id: 'comp',
      title: 'COMPRESSOR',
      enabled: compressor.enabled,
      icon: Zap,
      toggleAction: onToggleComp,
      popupId: 'compressor',
      details: `${compressor.threshold} dB | ${compressor.ratio}:1`,
    },
    {
      id: 'eq',
      title: '13-BAND EQ',
      enabled: eqEnabled,
      icon: Sliders,
      toggleAction: onToggleEq,
      popupId: 'eq',
      details: '20Hz - 20kHz Parametric',
    },
    {
      id: 'deesser',
      title: 'DE-ESSER',
      enabled: deEsser.enabled,
      icon: Disc,
      toggleAction: onToggleDeEsser,
      popupId: 'deesser',
      details: `${deEsser.frequency} Hz`,
    },
    {
      id: 'reverb',
      title: 'REVERB',
      enabled: reverb.enabled,
      icon: Sparkles,
      toggleAction: onToggleReverb,
      popupId: 'reverb',
      details: `${reverb.preset}`,
    },
    {
      id: 'limiter',
      title: 'LIMITER',
      enabled: limiter.enabled,
      icon: Shield,
      toggleAction: onToggleLimiter,
      popupId: 'limiter',
      details: `${limiter.threshold} dB Ceiling`,
    },
  ];

  return (
    <div className="bg-[#101622] rounded-xl border border-[#25334e] p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider flex items-center space-x-1.5">
          <Sliders className="w-4 h-4 text-[#00f0ff]" />
          <span>MIC HARDWARE DSP INSERT CHAIN</span>
        </span>
        <span className="text-[11px] text-[#64748b]">
          Routing: Gate → Comp → EQ → DeEsser → Reverb → VST3
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {dspModules.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className={`rounded-lg p-2.5 border transition-all duration-200 flex flex-col justify-between ${
                m.enabled
                  ? 'bg-[#161f30] border-[#00f0ff]/40 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                  : 'bg-[#0d121c] border-[#1e293b] opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      m.enabled ? 'text-[#00f0ff]' : 'text-[#64748b]'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold ${
                      m.enabled ? 'text-[#f8fafc]' : 'text-[#64748b]'
                    }`}
                  >
                    {m.title}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-[#94a3b8] mb-2 truncate">
                {m.details}
              </div>

              <div className="flex items-center space-x-1.5 pt-1 border-t border-[#1e293b]/60">
                {/* On / Off Button */}
                <button
                  onClick={m.toggleAction}
                  className={`flex-1 py-1 rounded text-[11px] font-bold tracking-wider transition-colors cursor-pointer ${
                    m.enabled
                      ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                      : 'bg-[#1e293b] text-[#64748b] border border-[#25334e] hover:text-[#94a3b8]'
                  }`}
                >
                  {m.enabled ? '● ON' : '○ OFF'}
                </button>

                {/* Edit Settings Button */}
                <button
                  onClick={() => onOpenPopup(m.popupId)}
                  className="px-2 py-1 rounded text-[11px] font-medium bg-[#1e2942] text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#25334e] border border-[#25334e] transition-colors cursor-pointer"
                  title="Chỉnh chi tiết"
                >
                  Chỉnh
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
