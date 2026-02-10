
import React, { useEffect, useState } from 'react';

type Props = {
  court: number;
  teamA: string[];
  teamB: string[];
  scoreA?: number;
  scoreB?: number;
};

export const LiveCourtCard: React.FC<Props> = ({
  court,
  teamA,
  teamB,
  scoreA = 0,
  scoreB = 0,
}) => {
  const [flashA, setFlashA] = useState(false);
  const [flashB, setFlashB] = useState(false);

  // Trigger visual flash on score change
  useEffect(() => {
    if (scoreA > 0) {
        setFlashA(true);
        const timer = setTimeout(() => setFlashA(false), 600);
        return () => clearTimeout(timer);
    }
  }, [scoreA]);

  useEffect(() => {
    if (scoreB > 0) {
        setFlashB(true);
        const timer = setTimeout(() => setFlashB(false), 600);
        return () => clearTimeout(timer);
    }
  }, [scoreB]);

  const isLeadingA = scoreA > scoreB;
  const isLeadingB = scoreB > scoreA;
  const isHighStakes = scoreA >= 10 || scoreB >= 10;

  return (
    <div className={`
      relative overflow-hidden rounded-xl border flex flex-col shadow-2xl transition-all duration-500
      h-auto min-h-[240px] md:h-full
      ${flashA || flashB ? 'ring-2 ring-red-500/80 border-red-500/50 bg-zinc-800' : 'border-white/10 bg-[#0c0c0c]'}
    `}>
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 bg-white/5 border-b border-white/5 shrink-0">
         <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            COURT {court}
         </span>
         <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isHighStakes ? 'bg-yellow-500 animate-[ping_1s_infinite]' : 'bg-red-500 animate-[pulse_1s_infinite]'} shadow-[0_0_8px_currentColor]`}></div>
            <span className={`text-[9px] font-bold tracking-widest uppercase ${isHighStakes ? 'text-yellow-500' : 'text-red-500'}`}>LIVE</span>
         </div>
      </div>

      {/* MATCH BODY */}
      <div className="flex-1 flex flex-col relative justify-center">
        
        {/* TEAM A (TOP) */}
        <div className="flex-1 flex items-center justify-between px-4 md:px-6 py-3 md:py-4 relative">
             <div className="flex flex-col gap-0.5 z-10 max-w-[70%]">
                {teamA.map((name, i) => (
                    <span key={i} className={`text-base md:text-xl font-bold uppercase tracking-tight leading-tight truncate ${isLeadingA ? 'text-white' : 'text-zinc-500'}`}>
                        {name}
                    </span>
                ))}
             </div>
             
             <div className={`
                font-mono text-5xl md:text-7xl font-black tabular-nums tracking-tighter transition-all duration-300 z-10
                ${isLeadingA ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'text-zinc-700'}
                ${flashA ? 'scale-125 brightness-150' : 'scale-100'}
             `}>
                {scoreA}
             </div>

             {/* Background Glow A */}
             <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent transition-opacity duration-500 ${isLeadingA ? 'opacity-100' : 'opacity-0'}`} />
        </div>

        {/* NET (HORIZONTAL DIVIDER) */}
        <div className="h-px w-full bg-zinc-800 flex items-center justify-center relative shrink-0 my-1 md:my-0">
            <div className="absolute left-0 right-0 h-px border-t border-dashed border-zinc-600/50"></div>
            <div className="bg-[#0c0c0c] px-3 z-10 text-[8px] font-bold text-zinc-600 tracking-[0.3em] uppercase">
                NET
            </div>
        </div>

        {/* TEAM B (BOTTOM) */}
        <div className="flex-1 flex items-center justify-between px-4 md:px-6 py-3 md:py-4 relative">
             <div className="flex flex-col gap-0.5 z-10 max-w-[70%]">
                {teamB.map((name, i) => (
                    <span key={i} className={`text-base md:text-xl font-bold uppercase tracking-tight leading-tight truncate ${isLeadingB ? 'text-white' : 'text-zinc-500'}`}>
                        {name}
                    </span>
                ))}
             </div>

             <div className={`
                font-mono text-5xl md:text-7xl font-black tabular-nums tracking-tighter transition-all duration-300 z-10
                ${isLeadingB ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'text-zinc-700'}
                ${flashB ? 'scale-125 brightness-150' : 'scale-100'}
             `}>
                {scoreB}
             </div>

             {/* Background Glow B */}
             <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent transition-opacity duration-500 ${isLeadingB ? 'opacity-100' : 'opacity-0'}`} />
        </div>

      </div>
    </div>
  );
};
