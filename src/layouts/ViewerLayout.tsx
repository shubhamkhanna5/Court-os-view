
import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ViewerProvider, useViewerMode, SagaData } from '../context/ViewerContext';
import { cloudRestore } from '../utils/cloudSync';
import { TVDashboard } from '../components/viewer/ViewerDashboard';

// Helper to format names if missing in map
export const formatIdToName = (id: string, map?: Record<string, string>) => {
  if (map && map[id]) return map[id];
  return id
    .replace(/^p_/i, '')      // Remove prefix
    .replace(/_/g, ' ')       // Underscores to spaces
    .toLowerCase()            // Lowercase first
    .replace(/\b\w/g, l => l.toUpperCase()); // Title Case
};

// Helper to transform raw backend state into Viewer UI shape
const normalizeData = (rawData: any): SagaData => {
  if (!rawData) {
      console.warn('[Viewer] normalizeData received null/undefined data');
      return {};
  }

  // 1. EXTRACT PLAYER MAP
  const playerNames: Record<string, string> = {};
  const sourcePlayers = rawData.players || rawData.activeLeague?.players || [];
  
  if (Array.isArray(sourcePlayers)) {
    sourcePlayers.forEach((p: any) => {
      if (p.id && p.name) {
        playerNames[p.id] = p.name;
      }
    });
  }

  // 2. PARSE MATCHES & DAY STATUS
  // Initialize as explicit arrays to ensure they are never undefined
  let activeMatches: NonNullable<SagaData['activeMatches']> = [];
  let upcomingMatches: NonNullable<SagaData['upcomingMatches']> = [];
  let isDayComplete = false;
  
  if (rawData.activeLeague && Array.isArray(rawData.activeLeague.days)) {
      const days = rawData.activeLeague.days;
      const activeDay = days.find((d: any) => d.status !== 'completed');
      
      if (activeDay) {
          const allMatchesDone = Array.isArray(activeDay.matches) && 
                                 activeDay.matches.length > 0 && 
                                 activeDay.matches.every((m: any) => m.isCompleted);
          
          if (allMatchesDone) {
            isDayComplete = true;
          }

          if (Array.isArray(activeDay.matches)) {
              // Group incomplete matches by court to determine "Live" vs "Queue"
              const incompleteMatches = activeDay.matches.filter((m: any) => !m.isCompleted);
              const matchesByCourt: Record<number, any[]> = {};

              incompleteMatches.forEach((m: any) => {
                  const cId = m.courtId || m.court || 0;
                  if (!matchesByCourt[cId]) matchesByCourt[cId] = [];
                  matchesByCourt[cId].push(m);
              });

              // Process each court: Head = Live, Tail = Queue
              Object.keys(matchesByCourt).forEach(key => {
                  const courtMatches = matchesByCourt[parseInt(key)];
                  
                  courtMatches.forEach((m: any, index: number) => {
                      let sA = m.scoreA;
                      let sB = m.scoreB;
                      if ((sA === undefined || sB === undefined) && typeof m.score === 'string' && m.score.includes('-')) {
                          const parts = m.score.split('-');
                          sA = parseInt(parts[0]) || 0;
                          sB = parseInt(parts[1]) || 0;
                      }
                      sA = sA || 0;
                      sB = sB || 0;

                      const matchObj = {
                          id: m.id || `match_${m.courtId}_${Date.now()}_${Math.random()}`,
                          court: parseInt(key),
                          team1: m.team1 || m.teamA || [],
                          team2: m.team2 || m.teamB || [],
                          score: m.score,
                          scoreA: sA,
                          scoreB: sB,
                          round: m.round
                      };

                      // BROADCAST RULE: First match is ALWAYS Live (even if 0-0). Rest are Queue.
                      if (index === 0) {
                          activeMatches.push(matchObj);
                      } else {
                          upcomingMatches.push(matchObj);
                      }
                  });
              });
          }
      } else {
        if (days.length > 0 && days[days.length - 1].status === 'completed') {
           isDayComplete = true;
        }
      }
  } 
  
  // Sort Active Matches by Court ID
  activeMatches.sort((a, b) => (a.court || 0) - (b.court || 0));
  // Sort Upcoming Matches by Round, then Court
  upcomingMatches.sort((a, b) => {
     if (a.round !== b.round) return (a.round || 0) - (b.round || 0);
     return (a.court || 0) - (b.court || 0);
  });

  // 3. RECALCULATE STANDINGS (SAGA POINTS: 3/1/0)
  const calculatedStats: Record<string, {
      name: string;
      wins: number;
      played: number;
      totalScore: number;
      points: number; 
  }> = {};

  Object.entries(playerNames).forEach(([id, name]) => {
      calculatedStats[id] = { name, wins: 0, played: 0, totalScore: 0, points: 0 };
  });

  const leagueDays = rawData.activeLeague?.days || [];
  leagueDays.forEach((day: any) => {
      const matches = day.matches || [];
      matches.forEach((m: any) => {
          if (m.isCompleted) {
              const t1 = m.team1 || m.teamA || [];
              const t2 = m.team2 || m.teamB || [];
              
              let sA = m.scoreA;
              let sB = m.scoreB;
              if (sA === undefined && typeof m.score === 'string') {
                   const p = m.score.split('-');
                   sA = parseInt(p[0]);
                   sB = parseInt(p[1]);
              }
              sA = sA || 0;
              sB = sB || 0;

              const updatePlayer = (ids: string[], isWinner: boolean, score: number) => {
                  ids.forEach(id => {
                      if (calculatedStats[id]) {
                          calculatedStats[id].played++;
                          calculatedStats[id].totalScore += score;
                          if (isWinner) {
                              calculatedStats[id].wins++;
                              calculatedStats[id].points += 3; // WIN = 3 PTS
                          } else {
                              calculatedStats[id].points += 1; // LOSS = 1 PT
                          }
                      }
                  });
              };

              if (sA > sB) {
                  updatePlayer(t1, true, sA);
                  updatePlayer(t2, false, sB);
              } else if (sB > sA) {
                  updatePlayer(t1, false, sA);
                  updatePlayer(t2, true, sB);
              }
          }
      });
  });

  let standings = Object.values(calculatedStats).map(stat => ({
      name: stat.name,
      wins: stat.wins,
      losses: stat.played - stat.wins,
      played: stat.played,
      ppg: stat.played > 0 ? stat.totalScore / stat.played : 0,
      points: stat.points,
      isEligible: true
  }));

  // Sort: Points -> Wins -> PPG -> Played
  standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.ppg !== a.ppg) return b.ppg - a.ppg;
      return b.played - a.played;
  });

  if (standings.length === 0 && Array.isArray(rawData.standings) && rawData.standings.length > 0) {
      standings = rawData.standings;
  }

  return {
    sagaName: rawData.activeLeague?.name || rawData.sagaName || rawData.name || 'PBZ Saga',
    day: rawData.activeLeague?.currentDay || rawData.day || rawData.currentDay || 1,
    standings,
    activeMatches,
    upcomingMatches, 
    playerNames,
    isDayComplete,
    lore: rawData.lore || { dragonBalls: {} }
  };
};

const ViewerDataFetcher: React.FC<{ 
  children?: React.ReactNode; 
  tvMode: boolean;
  onToggleTVMode: () => void;
}> = ({ children, tvMode, onToggleTVMode }) => {
  const { setData, setLastUpdated, setIsOnline, lastUpdated, data } = useViewerMode();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawData = await cloudRestore();
        
        if (rawData) {
          const cleanData = normalizeData(rawData);
          setData(cleanData);
          setLastUpdated(new Date());
          setIsOnline(true);
        } else {
            console.warn('[Viewer] Cloud returned empty data');
        }
      } catch (e) {
        console.error("Viewer auto-refresh failed", e);
        setIsOnline(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, [setData, setLastUpdated, setIsOnline]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && tvMode) {
        onToggleTVMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tvMode, onToggleTVMode]);

  const isScoreboard = location.pathname.includes('scoreboard');

  return (
    <div className={`
      relative bg-[#0B0F14] text-white font-sans selection:bg-yellow-500 selection:text-black
      ${tvMode ? 'tv-mode h-screen w-screen overflow-hidden' : 'min-h-screen flex flex-col'}
    `}>
       
       {/* NAVIGATION CONTROLS */}
       <div className="tv-toggle fixed top-5 right-5 z-[100] flex items-center gap-2 group">
          
          <div className="flex items-center gap-2 mr-4 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-10 group-hover:translate-x-0">
             <button
               onClick={() => navigate('/viewer')}
               className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors
                 ${!isScoreboard 
                   ? 'bg-white text-black border-white' 
                   : 'bg-black/80 text-slate-400 border-white/10 hover:border-white/30 hover:text-white'}`}
             >
               Broadcast
             </button>
             <button
               onClick={() => navigate('/viewer/scoreboard')}
               className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors
                 ${isScoreboard 
                   ? 'bg-white text-black border-white' 
                   : 'bg-black/80 text-slate-400 border-white/10 hover:border-white/30 hover:text-white'}`}
             >
               Scoreboard
             </button>
          </div>

          <button 
            onClick={onToggleTVMode}
            className="flex items-center gap-3 pl-4 pr-2 py-2 rounded-full bg-black/80 text-white border border-white/10 hover:border-white/30 backdrop-blur-md shadow-2xl transition-all"
          >
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                {tvMode ? 'TV ON' : 'TV OFF'}
            </span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${tvMode ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                {tvMode ? (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                ) : (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                )}
            </div>
          </button>
       </div>
       
       {tvMode && !isScoreboard ? (
          <TVDashboard /> 
       ) : (
          <div className={`flex-1 flex flex-col ${tvMode ? 'h-full' : 'pb-12'}`}>
             <Outlet />
          </div>
       )}

       {!tvMode && (
          <div className="fixed bottom-3 left-1/2 -translate-x-1/2 text-[8px] tracking-[0.4em] text-slate-700 font-bold uppercase pointer-events-none select-none mix-blend-screen z-0 opacity-50">
            COURTOS
          </div>
       )}
    </div>
  );
};

interface ViewerLayoutProps {
  tvMode: boolean;
  onToggleTVMode: () => void;
}

export const ViewerLayout: React.FC<ViewerLayoutProps> = ({ tvMode, onToggleTVMode }) => {
  return (
    <ViewerProvider isReadOnly={true}>
      <ViewerDataFetcher tvMode={tvMode} onToggleTVMode={onToggleTVMode}>
        <Outlet />
      </ViewerDataFetcher>
    </ViewerProvider>
  );
};
