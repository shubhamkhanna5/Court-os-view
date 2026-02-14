
import React, { useEffect, useState, useMemo } from 'react';
import { useViewerMode, SagaData } from '../../context/ViewerContext';
import { LiveCourtCard } from './LiveCourtCard';
import { formatIdToName } from '../../layouts/ViewerLayout';
import { generateUltraSagaPdf } from '../../utils/generateUltraSagaPdf';

// --- CONFIG ---
const SPONSOR_CONFIG = {
  arena: "DINK IT",
  broadcast: "COURT OS",
  champion: "DINK IT"
};

const SHOW_DEBUG = true; 

// --- TICKER COMPONENT ---
const BroadcastTicker: React.FC<{ data: SagaData; lastUpdated: Date; activeMatches: number }> = ({ data, lastUpdated, activeMatches }) => {
  const [index, setIndex] = useState(0);

  const messages = useMemo(() => [
    `LIVE MATCHES: ${activeMatches}`,
    `PLAYERS ACTIVE: ${data.standings?.length || 0}`,
    `VENUE: ${SPONSOR_CONFIG.arena} · MOTI NAGAR`,
    `POWERED BY COURT OS`,
    `LAST SYNC: ${lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}`
  ], [data, lastUpdated, activeMatches]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 8000); 
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 flex items-center justify-center h-full w-full">
      <span key={index} className="animate-in fade-in slide-in-from-bottom-2 duration-700 whitespace-nowrap px-4">
        {messages[index]}
      </span>
    </div>
  );
};

// --- COMPONENT: UP NEXT LIST (Per Court) ---
const CourtQueuePanel: React.FC<{ 
    matches: SagaData['upcomingMatches']; 
    playerNames: Record<string,string>;
    courtId: number;
}> = ({ matches, playerNames, courtId }) => {
    // Filter matches specifically for this court
    const courtQueue = (matches || []).filter(m => m.court === courtId).slice(0, 3);
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="flex-1 bg-[#161b22] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full min-h-[60px] transition-all duration-300">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-white/5 border-b border-white/5 p-3 flex items-center justify-between gap-2 shrink-0 w-full hover:bg-white/10 transition-colors"
            >
                 <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Up Next (Court {courtId})</h3>
                 </div>
                 <div className="md:hidden text-slate-500">
                    {isExpanded ? '▼' : '▲'}
                 </div>
            </button>
            
            <div className={`
                overflow-y-auto no-scrollbar flex-1 flex flex-col bg-[#0e1116] transition-all duration-300
                ${isExpanded ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 md:opacity-100 md:max-h-[500px]'}
            `}>
                {courtQueue.map((m, i) => (
                    <div key={i} className="p-3 border-b border-slate-800/50 last:border-0 hover:bg-white/5 transition-colors flex items-center justify-between">
                         <div className="flex items-center gap-3 w-full">
                             <span className="text-[10px] font-mono text-slate-600 font-bold w-4">#{i + 1}</span>
                             <div className="flex-1 flex flex-col">
                                 <div className="text-sm font-bold text-slate-300 uppercase truncate">
                                     {m.team1.map(id => formatIdToName(id, playerNames)).join(' / ')}
                                 </div>
                                 <div className="text-[9px] font-bold text-slate-600 uppercase">VS</div>
                                 <div className="text-sm font-bold text-slate-300 uppercase truncate">
                                     {m.team2.map(id => formatIdToName(id, playerNames)).join(' / ')}
                                 </div>
                             </div>
                         </div>
                    </div>
                ))}
                {courtQueue.length === 0 && (
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50 min-h-[60px] py-4">
                        <span className="text-[10px] uppercase tracking-widest">No Matches Queued</span>
                     </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN BROADCAST VIEW (Strict 2-Column Court Layout) ---
const LiveBroadcastView: React.FC<{ data: SagaData }> = ({ data }) => {
    const activeMatches = data.activeMatches || [];
    const upcomingMatches = data.upcomingMatches || [];

    // Find live matches for specific courts (or undefined if standby)
    const matchC1 = activeMatches.find(m => m.court === 1);
    const matchC2 = activeMatches.find(m => m.court === 2);

    return (
        <div className="flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-6 overflow-y-auto md:overflow-hidden h-full">
            
            {/* COLUMN 1: COURT 1 (Live + Queue) */}
            <div className="flex-1 flex flex-col gap-4 md:gap-6 w-full min-h-0">
                {/* LIVE CARD */}
                <div className="h-auto md:h-[60%] shrink-0">
                    {matchC1 ? (
                        <LiveCourtCard
                            court={1}
                            teamA={matchC1.team1.map(id => formatIdToName(id, data.playerNames))}
                            teamB={matchC1.team2.map(id => formatIdToName(id, data.playerNames))}
                            scoreA={matchC1.scoreA}
                            scoreB={matchC1.scoreB}
                            status={matchC1.status}
                        />
                    ) : (
                        <div className="h-[200px] md:h-full border border-white/5 rounded-xl bg-white/[0.02] flex flex-col items-center justify-center text-slate-600">
                             <div className="w-12 h-12 mb-4 opacity-20 bg-slate-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold uppercase tracking-widest opacity-50">Court 1 Standby</span>
                            <span className="text-[9px] text-slate-700 mt-2 uppercase tracking-wider">Waiting for Match...</span>
                        </div>
                    )}
                </div>
                {/* QUEUE */}
                <div className="flex-1 min-h-0">
                    <CourtQueuePanel matches={upcomingMatches} playerNames={data.playerNames || {}} courtId={1} />
                </div>
            </div>

            {/* COLUMN 2: COURT 2 (Live + Queue) */}
            {/* On mobile, add border top. On desktop, border left */}
            <div className="flex-1 flex flex-col gap-4 md:gap-6 w-full min-h-0 border-t border-white/5 pt-6 md:pt-0 md:border-t-0 md:border-l md:pl-6">
                {/* LIVE CARD */}
                <div className="h-auto md:h-[60%] shrink-0">
                    {matchC2 ? (
                        <LiveCourtCard
                            court={2}
                            teamA={matchC2.team1.map(id => formatIdToName(id, data.playerNames))}
                            teamB={matchC2.team2.map(id => formatIdToName(id, data.playerNames))}
                            scoreA={matchC2.scoreA}
                            scoreB={matchC2.scoreB}
                            status={matchC2.status}
                        />
                    ) : (
                        <div className="h-[200px] md:h-full border border-white/5 rounded-xl bg-white/[0.02] flex flex-col items-center justify-center text-slate-600">
                            <div className="w-12 h-12 mb-4 opacity-20 bg-slate-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold uppercase tracking-widest opacity-50">Court 2 Standby</span>
                            <span className="text-[9px] text-slate-700 mt-2 uppercase tracking-wider">Waiting for Match...</span>
                        </div>
                    )}
                </div>
                {/* QUEUE */}
                <div className="flex-1 min-h-0">
                    <CourtQueuePanel matches={upcomingMatches} playerNames={data.playerNames || {}} courtId={2} />
                </div>
            </div>

        </div>
    );
};

// --- OVERVIEW SCENE (Main Wrapper) ---
export const OverviewScene: React.FC<{ data: SagaData; lastUpdated: Date; isOnline: boolean }> = ({ data, lastUpdated, isOnline }) => {
  return (
    <div className="flex-1 flex flex-col h-full w-full animate-in fade-in duration-500 bg-[#0B0F14] relative overflow-hidden">
      
      {/* 1. BROADCAST HEADER */}
      <header className="grid grid-cols-2 md:grid-cols-3 items-center px-4 md:px-8 py-3 md:py-5 bg-black border-b border-white/5 shadow-2xl relative z-30 shrink-0 gap-y-2">
        {/* Left */}
        <div className="flex flex-col justify-center">
            <h1 className="text-sm md:text-lg font-black tracking-widest uppercase text-white leading-none">PBZ SAGA</h1>
            <span className="text-[8px] md:text-[9px] font-bold tracking-[0.4em] uppercase text-slate-500 mt-1">THE TOURNAMENT Z</span>
        </div>
        {/* Center (Hidden on small mobile if needed, or re-ordered) */}
        <div className="hidden md:flex text-center flex-col items-center justify-center">
            <div className="text-slate-200 font-black tracking-[0.5em] text-lg uppercase">COURT OS</div>
            <div className="w-12 h-0.5 bg-red-600 mt-2"></div>
        </div>
        {/* Right */}
        <div className="flex items-center justify-end gap-2 md:gap-4 text-right col-span-1 md:col-span-1">
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-wider">DAY {data.day}</span>
              <div className="flex items-center gap-2 justify-end mt-1">
                 <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}></span>
                 <span className={`text-[9px] md:text-[10px] font-black tracking-widest uppercase ${isOnline ? 'text-white' : 'text-slate-500'}`}>
                    {isOnline ? 'LIVE' : 'OFFLINE'}
                 </span>
              </div>
            </div>
        </div>
      </header>

      {/* 2. DYNAMIC CONTENT AREA */}
      {/* Always show Live Broadcast View, even if day is complete (shows Court Standby) */}
      <div className="flex-1 min-h-0 relative">
          <LiveBroadcastView data={data} />
      </div>

      {/* 3. FOOTER */}
      <footer className="bg-black py-2 border-t border-slate-900 h-8 relative overflow-hidden z-40 shrink-0 flex justify-between items-center px-4">
        <BroadcastTicker data={data} lastUpdated={lastUpdated} activeMatches={data.activeMatches?.length || 0} />
        
        {/* Report Button (Hidden on Mobile usually, but discreetly placed here) */}
        <button 
           onClick={() => generateUltraSagaPdf(
            data.sagaName || "Saga",
            (data.standings || []).map(s => ({
                name: s.name,
                ppg: s.ppg,
                wins: s.wins,
                losses: s.losses,
                points: s.points,
                played: s.played,
                isEligible: s.isEligible,
                bonusPoints: s.bonusPoints,
                clutchWins: s.clutchWins,
                noShows: s.noShows,
                dragonBalls: s.dragonBalls
            })),
            data.leagueStats
           )}
           className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/5 hover:bg-white/20 text-slate-500 hover:text-white px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-widest transition-all z-50"
        >
           Export PDF
        </button>
      </footer>

      {/* 4. DEBUG */}
      {SHOW_DEBUG && (
        <div className="hidden md:block absolute bottom-12 right-2 z-50 pointer-events-none opacity-30 hover:opacity-100 transition-opacity">
            <pre className="text-[8px] bg-black/80 text-green-400 p-2 rounded border border-green-900/50 font-mono">
                SAGA:{data.sagaName} | M:{data.activeMatches?.length} | Q:{data.upcomingMatches?.length}
            </pre>
        </div>
      )}
    </div>
  );
};

// --- TV DASHBOARD CONTROLLER ---
export const TVDashboard: React.FC = () => {
  const { data, lastUpdated, isOnline } = useViewerMode();
  
  if (!data) return (
     <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-black text-white">
        <div className="text-2xl font-black tracking-widest text-slate-700 animate-pulse">PBZ LIVE</div>
        <div className="text-slate-600 font-mono text-[9px] uppercase tracking-[0.3em]">Establishing Uplink...</div>
     </div>
  );

  return <OverviewScene data={data} lastUpdated={lastUpdated} isOnline={isOnline} />;
};

export const ViewerDashboard: React.FC = () => {
  const { data, lastUpdated, isOnline } = useViewerMode();
  if (!data) return null;
  return <OverviewScene data={data} lastUpdated={lastUpdated} isOnline={isOnline} />;
};
