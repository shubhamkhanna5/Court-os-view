
import React from 'react';
import { useViewerMode } from '../../context/ViewerContext';
import { LiveCourtCard } from './LiveCourtCard';
import { formatIdToName } from '../../layouts/ViewerLayout';

export const ScoreboardView: React.FC = () => {
  const { data, lastUpdated, isOnline } = useViewerMode();

  const activeMatches = data?.activeMatches || [];
  const upcomingMatches = data?.upcomingMatches || [];
  const standings = data?.standings || [];

  // Strictly bind slots to Court 1 and Court 2
  const matchC1 = activeMatches.find(m => m.court === 1);
  const matchC2 = activeMatches.find(m => m.court === 2);
  const courtSlots = [matchC1, matchC2];

  if (!data) {
     return (
       <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-mono animate-pulse gap-4">
         <span className="text-xs tracking-widest uppercase">Loading Scoreboard...</span>
       </div>
     );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0F14] text-white animate-in fade-in duration-500 overflow-hidden">
      
      {/* HEADER */}
      <header className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-black border-b border-white/5 z-10 shrink-0">
         <div className="flex items-center gap-4">
            <div className="text-slate-200 font-black tracking-[0.2em] text-sm md:text-lg uppercase">COURT OS</div>
            <div className="h-4 w-px bg-slate-800"></div>
            <div className="text-yellow-500 font-bold tracking-widest text-[10px] md:text-xs uppercase">SCOREBOARD</div>
         </div>
         <div className="flex items-center gap-2 md:gap-4">
            <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-wider">
               {isOnline ? '● CONNECTED' : '○ OFFLINE'}
            </span>
            <span className="text-slate-600 font-mono text-[10px] md:text-xs">
               {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
         </div>
      </header>

      {/* BODY - 3 ZONES (Responsive Grid/Flex) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 overflow-y-auto lg:overflow-hidden">
         
         {/* LEFT ZONE (60%) */}
         <div className="w-full lg:w-[60%] flex flex-col gap-6 lg:h-full">
            {/* Active Courts */}
            <div className="h-auto lg:h-[55%] grid grid-cols-1 md:grid-cols-2 gap-6">
                {courtSlots.map((m, i) => (
                    <div key={i} className="h-[250px] md:h-full">
                        {m ? (
                            <LiveCourtCard
                                court={m.court}
                                teamA={m.team1.map(id => formatIdToName(id, data.playerNames))}
                                teamB={m.team2.map(id => formatIdToName(id, data.playerNames))}
                                scoreA={m.scoreA}
                                scoreB={m.scoreB}
                                status={m.status}
                            />
                        ) : (
                            <div className="h-full border border-white/5 rounded-xl bg-white/[0.02] flex flex-col items-center justify-center text-slate-600">
                                <span className="text-xs font-bold uppercase tracking-widest opacity-50">Court {i + 1} Open</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Up Next */}
            <div className="flex-1 bg-[#161b22] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col min-h-[200px] lg:min-h-0">
                 <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-3 flex items-center gap-2 shrink-0">
                     <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Up Next</h3>
                 </div>
                 <div className="overflow-y-auto no-scrollbar flex-1">
                    {upcomingMatches.slice(0, 4).map((m, i) => (
                        <div key={i} className="p-3 border-b border-slate-800/50 last:border-0 hover:bg-white/5 transition-colors flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Court {m.court}</span>
                            <div className="text-sm font-bold text-slate-300 uppercase truncate max-w-[70%] text-right">
                                 <span className="truncate">{m.team1.map(id => formatIdToName(id, data.playerNames)).join('/')}</span>
                                 <span className="text-[10px] text-slate-600 italic px-2">VS</span>
                                 <span className="truncate">{m.team2.map(id => formatIdToName(id, data.playerNames)).join('/')}</span>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
         </div>

         {/* RIGHT ZONE (40%) - STANDINGS */}
         <div className="w-full lg:w-[40%] bg-[#161b22] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-[400px] lg:h-full">
            <div className="bg-black/50 border-b border-slate-800 p-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs">🏆</span>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Standings</h3>
                </div>
            </div>
            
            <div className="grid grid-cols-[3rem_1fr_4rem_3rem] bg-black/30 border-b border-slate-800 p-2 text-[9px] uppercase font-bold text-slate-500 tracking-wider shrink-0">
                 <div className="pl-2">#</div>
                 <div>Player</div>
                 <div className="text-right">W-L</div>
                 <div className="text-right pr-2">PTS</div>
            </div>
            
            <div className="overflow-y-auto no-scrollbar flex-1">
                 {standings.map((p, idx) => (
                    <div key={idx} className={`grid grid-cols-[3rem_1fr_4rem_3rem] p-3 items-center border-b border-slate-800/30 hover:bg-white/5 transition-colors ${idx < 3 ? 'bg-white/[0.02]' : ''}`}>
                         <div className={`font-mono font-bold pl-2 ${idx === 0 ? 'text-yellow-500' : 'text-slate-600'}`}>
                             {idx + 1}
                         </div>
                         <div className="font-bold text-slate-300 truncate text-xs pr-2">
                             {p.name}
                         </div>
                         <div className="text-right font-mono font-bold text-slate-400 text-xs">
                             {p.wins}-{p.losses || 0}
                         </div>
                         <div className="text-right font-mono font-bold text-yellow-500 text-sm pr-2">
                             {p.points || 0}
                         </div>
                    </div>
                 ))}
            </div>
         </div>

      </div>
    </div>
  );
};
