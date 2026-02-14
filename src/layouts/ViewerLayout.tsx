
import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ViewerProvider, useViewerMode, SagaData } from '../context/ViewerContext';
import { cloudRestore } from '../utils/cloudSync';
import { calculateLeagueStandings } from '../utils/leagueLogic';
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

  // 1. EXTRACT PLAYER MAP (Global Registry)
  const playerNames: Record<string, string> = {};
  const sourcePlayers = rawData.players || rawData.activeLeague?.players || [];
  
  if (Array.isArray(sourcePlayers)) {
    sourcePlayers.forEach((p: any) => {
      if (p.id && p.name) {
        playerNames[p.id] = p.name;
      }
    });
  }

  // 2. IDENTIFY ATTENDANCE FOR CURRENT DAY
  const days = rawData.activeLeague?.days || [];
  // Current day is first non-completed, or the last one if all completed
  const activeDay = days.find((d: any) => d.status !== 'completed') || days[days.length - 1]; 
  const attendeeSet = activeDay?.attendees ? new Set<string>(activeDay.attendees) : new Set<string>();

  // 3. PARSE MATCHES (Active/Upcoming)
  let activeMatches: NonNullable<SagaData['activeMatches']> = [];
  let upcomingMatches: NonNullable<SagaData['upcomingMatches']> = [];
  let isDayComplete = false;
  
  if (activeDay) {
      const allMatchesDone = Array.isArray(activeDay.matches) && 
                             activeDay.matches.length > 0 && 
                             activeDay.matches.every((m: any) => m.isCompleted);
      
      if (allMatchesDone) {
        isDayComplete = true;
      }

      if (Array.isArray(activeDay.matches)) {
          // Filter incomplete matches
          const incompleteMatches = activeDay.matches.filter((m: any) => !m.isCompleted && m.status !== 'completed' && m.status !== 'walkover');
          
          // Normalize and determine Status
          const normalizedMatches = incompleteMatches.map((m: any) => {
              const cId = m.courtId || m.court || 0;
              let sA = m.scoreA;
              let sB = m.scoreB;
              // Handle string score "11-9" fallback
              if ((sA === undefined || sB === undefined) && typeof m.score === 'string' && m.score.includes('-')) {
                  const parts = m.score.split('-');
                  sA = parseInt(parts[0]) || 0;
                  sB = parseInt(parts[1]) || 0;
              }
              sA = sA || 0;
              sB = sB || 0;

              // CORE LOGIC: Match is LIVE if score > 0 OR explicit status is 'live'
              const hasStarted = sA > 0 || sB > 0;
              const explicitLive = m.status === 'live';
              const computedStatus = (hasStarted || explicitLive) ? 'live' : 'pending';

              return {
                  id: m.id || `match_${cId}_${m.team1}_${m.team2}`,
                  court: parseInt(cId),
                  team1: m.team1 || m.teamA || [],
                  team2: m.team2 || m.teamB || [],
                  score: m.score,
                  scoreA: sA,
                  scoreB: sB,
                  round: m.round,
                  status: computedStatus, 
                  orderIndex: m.orderIndex ?? 999
              };
          });

          // Group by Status
          const liveMatches = normalizedMatches.filter((m: any) => m.status === 'live');
          const pendingMatches = normalizedMatches.filter((m: any) => m.status === 'pending');

          // Sort Pending by Order/Round
          pendingMatches.sort((a: any, b: any) => {
             if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
             if (a.round !== b.round) return (a.round || 0) - (b.round || 0);
             return a.court - b.court;
          });

          // Populate Display Lists
          if (liveMatches.length > 0) {
              // Mode: LIVE
              activeMatches = liveMatches;
              upcomingMatches = pendingMatches;
          } else {
              // Mode: PREVIEW (Fallback to next matches per court)
              const nextC1 = pendingMatches.find((m: any) => m.court === 1);
              const nextC2 = pendingMatches.find((m: any) => m.court === 2);
              
              if (nextC1) activeMatches.push(nextC1);
              if (nextC2) activeMatches.push(nextC2);

              const activeIds = new Set(activeMatches.map((m: any) => m.id));
              upcomingMatches = pendingMatches.filter((m: any) => !activeIds.has(m.id));
          }
      }
  } else {
    // If no active day, check if last day completed
    if (days.length > 0 && days[days.length - 1].status === 'completed') {
       isDayComplete = true;
    }
  }
  
  // Sort Active Matches by Court ID
  activeMatches.sort((a, b) => (a.court || 0) - (b.court || 0));

  // 4. CALCULATE STANDINGS (Using Centralized Logic)
  let mappedStandings: SagaData['standings'] = [];
  let leagueStats = { totalMatches: 0, minRequired: 0 };

  if (rawData.activeLeague) {
      // ✅ CORE: Use single source of truth for Standings Calculation
      const pbzStandings = calculateLeagueStandings(rawData.activeLeague);
      
      // ✅ METADATA: Calculated locally since it's UI/Report-only metadata not in core logic
      const streaks: Record<string, number> = {};
      const clutchWins: Record<string, number> = {};

      if (rawData.activeLeague.days) {
          rawData.activeLeague.days.forEach((day: any) => {
              if (!day.matches) return;
              day.matches.forEach((m: any) => {
                  if (m.isCompleted && m.status === 'completed' && !m.isForfeit && (!m.noShowPlayerIds || m.noShowPlayerIds.length === 0)) {
                      if (m.scoreA === undefined || m.scoreB === undefined) return;
                      const winners = m.scoreA > m.scoreB ? (m.teamA || m.team1) : (m.teamB || m.team2);
                      const losers = m.scoreA > m.scoreB ? (m.teamB || m.team2) : (m.teamA || m.team1);
                      
                      // Streak Logic
                      winners?.forEach((id: string) => { streaks[id] = (streaks[id] || 0) + 1; });
                      losers?.forEach((id: string) => { streaks[id] = 0; });

                      // Clutch Logic (Destructo Disc) - 1 point diff, winner >= 10
                      const diff = Math.abs(m.scoreA - m.scoreB);
                      const maxScore = Math.max(m.scoreA, m.scoreB);
                      if (diff === 1 && maxScore >= 10) {
                         winners?.forEach((id: string) => { clutchWins[id] = (clutchWins[id] || 0) + 1; });
                      }
                  }
              });
          });
      }

      const dragonBallMap = rawData.lore?.dragonBalls || {};

      // ✅ MAPPING: Strict mapping from PBZ Standings -> Viewer Shape
      mappedStandings = pbzStandings.map(s => ({
          name: playerNames[s.playerId] || s.playerId,
          ppg: s.ppg,
          played: s.gamesPlayed,
          wins: s.wins,
          losses: s.losses,
          points: s.points,
          streak: streaks[s.playerId] || 0,
          balls: 0,
          isPresent: attendeeSet.has(s.playerId),
          isEligible: s.eligibleForTrophies,
          // Extended Stats for Ultra PDF
          bonusPoints: s.bonusPoints, // Bagels
          clutchWins: clutchWins[s.playerId] || 0,
          noShows: s.noShows,
          dragonBalls: dragonBallMap[s.playerId] || 0
      }));

      // Stats
      const maxPlayed = Math.max(...pbzStandings.map(s => s.gamesPlayed), 0);
      leagueStats.minRequired = Math.ceil(maxPlayed * 0.6);
      
      if (rawData.activeLeague.days) {
          rawData.activeLeague.days.forEach((d: any) => {
              if (d.matches) {
                  leagueStats.totalMatches += d.matches.filter((m: any) => m.isCompleted && !m.isForfeit && (!m.noShowPlayerIds || m.noShowPlayerIds.length === 0)).length;
              }
          });
      }
  }

  return {
    sagaName: rawData.activeLeague?.name || rawData.sagaName || rawData.name || 'PBZ Saga',
    day: rawData.activeLeague?.currentDay || rawData.day || rawData.currentDay || 1,
    activeLeague: rawData.activeLeague,
    standings: mappedStandings,
    activeMatches,
    upcomingMatches, 
    playerNames,
    attendees: Array.from(attendeeSet),
    isDayComplete,
    leagueStats,
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
