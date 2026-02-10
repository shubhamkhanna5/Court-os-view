
import React, { useEffect, useState, useMemo } from 'react';
import { useViewerMode, SagaData } from '../../context/ViewerContext';
import { ChampionScene, SpotlightScene, AuraType } from './ViewerScenes';
import { LiveCourtCard } from './LiveCourtCard';
import { formatIdToName } from '../../layouts/ViewerLayout';

// --- CONFIG ---
const SPONSOR_CONFIG = {
  arena: "DINK IT",
  broadcast: "COURT OS",
  champion: "DINK IT"
};

const SHOW_DEBUG = true; 

// --- HELPERS ---
const getAura = (player: NonNullable<SagaData['standings']>[number], rank: number): AuraType => {
  if (rank === 1) return 'red';               
  if (rank <= 3) return 'gold';               
  if ((player.streak || 0) >= 2) return 'blue'; 
  return 'neutral';
};

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

// --- SCENES (Cinematic, Podium) ---
const CinematicScene: React.FC<{ data: SagaData }> = ({ data }) => {
  const [step, setStep] = useState(0);
  const champ = data.standings?.[0];

  useEffect(() => {
    const s1 = setTimeout(() => setStep(1), 500);
    const s2 = setTimeout(() => setStep(2), 4000);
    return () => { clearTimeout(s1); clearTimeout(s2); };
  }, []);

  if (step === 0) return <div className="flex-1 bg-black animate-in fade-in duration-1000"></div>;
  if (step === 1) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center bg-black text-white animate-in zoom-in-95 duration-1000">
              <h1 className="text-6xl md:text-8xl font-black tracking-widest uppercase text-center animate-pulse">
                  DAY {data.day}<br/>COMPLETE
              </h1>
              <div className="h-2 w-32 bg-red-600 mt-8"></div>
          </div>
      );
  }
  if (champ) {
      return (
          <ChampionScene 
            player={champ}
            sagaName={data.sagaName || ''}
            aura="red"
            sponsor="DAY COMPLETE · FINAL STANDINGS"
          />
      );
  }
  return null;
};

const DayCompleteView: React.FC<{ data: SagaData }> = ({ data }) => {
  const top3 = (data.standings || []).slice(0, 3);
  return (
      <section className="flex-1 flex flex-col justify-center px-4 md:px-10 py-8 relative animate-in fade-in duration-1000 overflow-y-auto">
        <div className="flex items-center gap-4 mb-8 opacity-40">
            <div className="h-px bg-slate-800 flex-1"></div>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Final Standings · Day {data.day}</h2>
            <div className="h-px bg-slate-800 flex-1"></div>
        </div>
        {top3.length > 0 && (
          <div className="flex flex-col md:grid md:grid-cols-3 gap-8 items-end">
             {top3[1] && (
              <div className="order-2 md:order-1 w-full bg-[#161b22] border border-slate-800 rounded-xl p-8 text-center transform md:translate-y-4 shadow-lg opacity-80">
                 <div className="text-4xl mb-4 grayscale opacity-50">🥈</div>
                 <div className="text-2xl font-black text-slate-300 uppercase truncate">{top3[1].name}</div>
                 <div className="text-4xl font-mono font-bold text-slate-200 mt-2">{top3[1].points} <span className="text-sm font-sans text-slate-500 uppercase">PTS</span></div>
              </div>
            )}
            {top3[0] && (
              <div className="order-1 md:order-2 w-full bg-gradient-to-b from-[#1c1f26] to-[#0f1115] border border-yellow-500/20 rounded-xl p-10 text-center relative shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 ring-1 ring-white/5 transform scale-105">
                 <div className="text-6xl mb-4 drop-shadow-xl mt-4">👑</div>
                 <div className="text-5xl font-black text-white uppercase truncate">{top3[0].name}</div>
                 <div className="text-7xl font-mono font-bold text-yellow-500 mt-3">{top3[0].points} <span className="text-2xl font-sans text-yellow-700 uppercase">PTS</span></div>
              </div>
            )}
            {top3[2] && (
              <div className="order-3 md:order-3 w-full bg-[#161b22] border border-slate-800 rounded-xl p-8 text-center transform md:translate-y-4 shadow-lg opacity-80">
                 <div className="text-4xl mb-4 grayscale opacity-40">🥉</div>
                 <div className="text-2xl font-black text-slate-300 uppercase truncate">{top3[2].name}</div>
                 <div className="text-4xl font-mono font-bold text-slate-200 mt-2">{top3[2].points} <span className="text-sm font-sans text-slate-500 uppercase">PTS</span></div>
              </div>
            )}
          </div>
        )}
      </section>
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

    return (
        <div className="flex-1 bg-[#161b22] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full min-h-[150px]">
            <div className="bg-white/5 border-b border-white/5 p-3 flex items-center gap-2 shrink-0">
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Court {courtId} Queue</h3>
            </div>
            <div className="overflow-y-auto no-scrollbar flex-1 flex flex-col">
                {courtQueue.map((m, i) => (
                    <div key={i} className="p-4 border-b border-slate-800/50 last:border-0 hover:bg-white/5 transition-colors flex items-center justify-between">
                         <div className="flex items-center gap-3 w-full">
                             <span className="text-[10px] font-mono text-slate-600 font-bold">#{i + 1}</span>
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
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50 min-h-[80px]">
                        <span className="text-[10px] uppercase tracking-widest">No Matches</span>
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
                        />
                    ) : (
                        <div className="h-[200px] md:h-full border border-white/5 rounded-xl bg-white/[0.02] flex flex-col items-center justify-center text-slate-600">
                            <span className="text-xs font-bold uppercase tracking-widest opacity-50">Court 1 Standby</span>
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
                        />
                    ) : (
                        <div className="h-[200px] md:h-full border border-white/5 rounded-xl bg-white/[0.02] flex flex-col items-center justify-center text-slate-600">
                            <span className="text-xs font-bold uppercase tracking-widest opacity-50">Court 2 Standby</span>
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
      {/* Mobile needs to allow scrolling if content overflows */}
      <div className="flex-1 min-h-0 relative">
          {data.isDayComplete ? (
              <DayCompleteView data={data} />
          ) : (
              <LiveBroadcastView data={data} />
          )}
      </div>

      {/* 3. FOOTER */}
      <footer className="bg-black py-2 border-t border-slate-900 h-8 relative overflow-hidden z-40 shrink-0">
        <BroadcastTicker data={data} lastUpdated={lastUpdated} activeMatches={data.activeMatches?.length || 0} />
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
