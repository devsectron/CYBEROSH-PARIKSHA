import React, { useState } from 'react';
import { Monitor, Cpu, FileCheck2, Sparkles, Compass, ShieldAlert, Award, GraduationCap } from 'lucide-react';

export type BackgroundTheme = 'cbt-hall' | 'matrix-blueprint' | 'omr-blueprint';

interface PlatformBackgroundProps {
  initialTheme?: BackgroundTheme;
  showSelector?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const PlatformBackground: React.FC<PlatformBackgroundProps> = ({
  initialTheme = 'cbt-hall',
  showSelector = true,
  className = '',
  children,
}) => {
  const [theme, setTheme] = useState<BackgroundTheme>(initialTheme);

  return (
    <div className={`relative overflow-hidden bg-slate-950 text-white ${className}`}>
      {/* =========================================================================
          LAYER 1: BASE PHOTOGRAPHIC / TEXTURED BACKDROP
          ========================================================================= */}
      {theme === 'cbt-hall' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Authentic CBT Center Image Asset */}
          <img
            src="/assets/images/hero-exam-hall.jpg"
            alt="CYBEROSH PARIKSHA CBT Examination Center"
            className="w-full h-full object-cover object-center scale-105 opacity-30 sm:opacity-40 filter contrast-125 saturate-120 transition-all duration-700"
          />
          {/* Deep Navy to Amber gradient overlays ensuring legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-slate-950/90" />
          <div className="absolute -top-24 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          {/* Fine CBT terminal grid */}
          <div className="absolute inset-0 bg-cbt-grid-dark opacity-40" />
        </div>
      )}

      {theme === 'matrix-blueprint' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Cyber Exam Blueprint Pattern Asset */}
          <img
            src="/assets/images/exam-matrix-blueprint.jpg"
            alt="CYBEROSH PARIKSHA Knowledge Blueprint"
            className="w-full h-full object-cover object-center scale-105 opacity-40 filter contrast-125 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/80 to-slate-950" />
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/60 via-transparent to-amber-950/40" />
          {/* Coordinate graph lines */}
          <div className="absolute inset-0 bg-blueprint-grid opacity-35" />
        </div>
      )}

      {theme === 'omr-blueprint' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 bg-slate-950" />
          {/* High precision OMR Sheet Bubbles & Graph grid */}
          <div className="absolute inset-0 bg-omr-pattern opacity-70" />
          <div className="absolute inset-0 bg-cbt-grid opacity-30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/25 via-slate-950/70 to-slate-950" />
        </div>
      )}

      {/* =========================================================================
          LAYER 2: AUTHENTIC ACADEMIC & EXAMINATION MOTIFS (FLOATING WATERMARKS)
          Representing Bihar Exams (BPSC/STET), Engineering (JEE), Medical (NEET),
          Banking & Railways with authentic symbols & bilingual typography
          ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Ashoka 24-spoke Chakra Silhouette (Civil Services / National Exam prestige) */}
        <div className="absolute -top-12 -right-12 w-96 h-96 opacity-[0.06] sm:opacity-[0.08] text-amber-300">
          <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_120s_linear_infinite]">
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
            {Array.from({ length: 24 }).map((_, i) => (
              <line
                key={i}
                x1="50"
                y1="50"
                x2={50 + 46 * Math.cos((i * 15 * Math.PI) / 180)}
                y2={50 + 46 * Math.sin((i * 15 * Math.PI) / 180)}
                stroke="currentColor"
                strokeWidth="1"
              />
            ))}
          </svg>
        </div>

        {/* Floating Devanagari Academic Glyphs */}
        <div className="absolute top-16 left-6 text-2xl font-serif text-amber-400/20 animate-float-gentle" title="अक्षर">
          अ
        </div>
        <div className="absolute top-44 left-[15%] text-sm font-semibold tracking-widest text-blue-300/20 uppercase font-mono">
          [BPSC · TRE 4.0]
        </div>
        <div className="absolute top-28 right-[18%] text-xl font-serif text-amber-300/25 animate-float-reverse">
          लक्ष्य
        </div>
        <div className="absolute bottom-20 left-[10%] text-sm font-mono text-emerald-400/20">
          ∫ f(x) dx = F(x) + C
        </div>
        <div className="absolute bottom-32 right-[12%] text-xs font-mono text-amber-400/25 tracking-wider">
          E = mc² · ΔH &lt; 0
        </div>
        <div className="absolute top-1/2 left-4 text-xs font-mono text-slate-500/30 -rotate-90 hidden sm:block">
          CBT ENGINE v4.2 // TCS-iON / NTA COMPLIANT
        </div>

        {/* Live Examination Telemetry Watermark (Top Corner) */}
        <div className="absolute top-4 right-4 hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-400/40 bg-slate-900/40 backdrop-blur-sm px-2.5 py-1 rounded border border-slate-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>SERVER DEADLINE: SYNCHRONIZED</span>
          <span>·</span>
          <span>AUTOSAVE: ACTIVE</span>
        </div>
      </div>

      {/* =========================================================================
          LAYER 3: THEME CONTROLLER BAR (ELEGANT & UNOBTRUSIVE)
          Lets students and evaluators experience all authentic background perspectives
          ========================================================================= */}
      {showSelector && (
        <div className="relative z-20 max-w-5xl mx-auto px-4 pt-3 flex items-center justify-end">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800/80 text-xs shadow-xl">
            <span className="text-[11px] font-medium text-slate-400 px-2 hidden sm:inline flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Theme:</span>
            </span>

            <button
              type="button"
              onClick={() => setTheme('cbt-hall')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                theme === 'cbt-hall'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Authentic Indian CBT Examination Center"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>CBT Exam Hall</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('matrix-blueprint')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                theme === 'matrix-blueprint'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Knowledge Matrix & Blueprint Architecture"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Knowledge Matrix</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('omr-blueprint')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                theme === 'omr-blueprint'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="OMR Bubble Sheet & Examination Paper Grid"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>OMR & Rigor</span>
            </button>
          </div>
        </div>
      )}

      {/* Content wrapper */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
