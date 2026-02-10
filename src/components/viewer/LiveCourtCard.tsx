
import React, { useEffect, useState, useRef } from 'react';

type Props = {
  court: number;
  teamA: string[];
  teamB: string[];
  scoreA?: number;
  scoreB?: number;
  status?: 'live' | 'pending';
};

export const LiveCourtCard: React.FC<Props> = ({
  court,
  teamA,
  teamB,
  scoreA = 0,
  scoreB = 0,
  status = 'live'
}) => {
  const [flashA, setFlashA] = useState(false);
  const [flashB, setFlashB] = useState(false);

  // Track previous scores to only flash on increment/change
  const prevScoreA = useRef(scoreA);
  const prevScoreB = useRef(scoreB);

  // Trigger visual flash on score change
  useEffect(() => {
    if (status === 'live' && scoreA > prevScoreA.current) {
        setFlashA(true);
        const timer = setTimeout(() => setFlashA(false), 600);
        return () => clearTimeout(timer);
    }
    prevScoreA.current = scoreA;
  }, [scoreA, status]);

  useEffect(() => {
    if (status === 'live' && scoreB > prevScoreB.current) {
        setFlashB(true);
        const timer = setTimeout(() => setFlashB(false), 600);
        return () => clearTimeout(timer);
    }
    prevScoreB.current = scoreB;
  }, [scoreB, status]);

  const isLive = status === 'live';
  const isLeadingA = isLive && scoreA > scoreB;
  const isLeadingB = isLive && scoreB > scoreA;
  const isHighStakes = isLive && (scoreA >= 10 || scoreB >= 10);

  return (
    <div className={`
      relative overflow-hidden rounded-xl border flex flex-col shadow-2xl transition-all duration-500
      h-auto min-h-[240px] md:h-full
      ${(flashA || flashB) && isLive ? 'ring-2 ring-red-500/80 border-red-500/50 bg-zinc-800' : 'border-white/10 bg-[#0c0c0c]'}
      ${!isLive ? 'opacity-90' : ''}
    `}>
      
      {/* HEADER */}
      <div className={`flex items-center justify-between px-3 md:px-4 py-2 border-b shrink-0 ${isLive ? 'bg-white/5 border-white/5' : 'bg-slate-900 border-slate-800'}`}>
         <span className={`text-[10px] font-black uppercase tracking-widest ${isLive ? 'text-zinc-400' : 'text-slate-600'}`}>
            COURT {court}
         </span>
         <div className="flex items-center gap-2">
            {isLive ? (
              <>
                <div className={`w-1.5 h-1.5 rounded-full ${isHighStakes ? 'bg-yellow-500 animate-[ping_1s_infinite]' : 'bg-red-500 animate-[pulse_1s_infinite]'} shadow-[0_0_8px_currentColor]`}></div>
                <span className={`text-[9px] font-bold tracking-widest uppercase ${isHighStakes ? 'text-yellow-500' : 'text-red-500'}`}>LIVE</span>
              </>
            ) : (
              <span className="text-[9px] font-bold tracking-widest uppercase text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">UP NEXT</span>
            )}
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
             
             {isLive ? (
               <div className={`
                  font-mono text-5xl md:text-7xl font-black tabular-nums tracking-tighter transition-all duration-300 z-10
                  ${isLeadingA ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'text-zinc-700'}
                  ${flashA ? 'scale-125 brightness-150' : 'scale-100'}
               `}>
                  {scoreA}
               </div>
             ) : (
               <div className="font-mono text-3xl md:text-5xl font-bold text-zinc-800 tabular-nums z-10 select-none">0</div>
             )}

             {/* Background Glow A */}
             {isLive && <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent transition-opacity duration-500 ${isLeadingA ? 'opacity-100' : 'opacity-0'}`} />}
        </div>

        {/* NET (HORIZONTAL DIVIDER) */}
        <div className="h-px w-full bg-zinc-800 flex items-center justify-center relative shrink-0 my-1 md:my-0">
            <div className="absolute left-0 right-0 h-px border-t border-dashed border-zinc-600/50"></div>
            <div className="bg-[#0c0c0c] px-3 z-10 text-[8px] font-bold text-zinc-600 tracking-[0.3em] uppercase">
                {isLive ? 'NET' : 'VS'}
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

             {isLive ? (
               <div className={`
                  font-mono text-5xl md:text-7xl font-black tabular-nums tracking-tighter transition-all duration-300 z-10
                  ${isLeadingB ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'text-zinc-700'}
                  ${flashB ? 'scale-125 brightness-150' : 'scale-100'}
               `}>
                  {scoreB}
               </div>
             ) : (
                <div className="font-mono text-3xl md:text-5xl font-bold text-zinc-800 tabular-nums z-10 select-none">0</div>
             )}

             {/* Background Glow B */}
             {isLive && <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent transition-opacity duration-500 ${isLeadingB ? 'opacity-100' : 'opacity-0'}`} />}
        </div>

      </div>
    </div>
  );
};
