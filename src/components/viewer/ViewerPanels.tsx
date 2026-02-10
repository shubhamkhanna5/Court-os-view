
import React from 'react';
import { SagaData } from '../../context/ViewerContext';

// --- LEADERBOARD PANEL ---
export const LeaderboardPanel: React.FC<{ data: SagaData | null }> = ({ data }) => {
  const standings = data?.standings || [];
  const hasData = standings.length > 0;

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in duration-700">
      <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
        <span className="text-amber-500">🏆</span> LEADERBOARD
      </h2>
      <div className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden shadow-xl backdrop-blur-sm relative">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-400 text-sm uppercase tracking-wider font-bold">
            <tr>
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Player</th>
              <th className="px-6 py-4 text-right">PPG</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {standings.map((player, idx) => (
              <tr 
                key={player.name} 
                className={`
                  ${idx < 3 ? 'bg-white/5' : ''} 
                  ${!player.isEligible ? 'opacity-40 grayscale' : ''}
                  transition-colors hover:bg-white/10
                `}
              >
                <td className="px-6 py-5">
                  <span className={`
                    font-mono font-bold text-xl inline-block w-8 h-8 text-center leading-8 rounded
                    ${idx === 0 ? 'bg-amber-500 text-slate-900' : 
                      idx === 1 ? 'bg-slate-400 text-slate-900' : 
                      idx === 2 ? 'bg-amber-700 text-slate-100' : 'text-slate-500'}
                  `}>
                    {idx + 1}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white tracking-tight">{player.name}</span>
                    <div className="flex gap-2 mt-1">
                      {player.streak && player.streak >= 3 ? (
                        <span className="text-xs font-bold text-orange-400 flex items-center gap-1">
                          🔥 {player.streak} WIN STREAK
                        </span>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <span className="font-mono text-3xl font-bold text-amber-400">{player.ppg.toFixed(2)}</span>
                </td>
                <td className="px-6 py-5 text-center text-xl">
                  {player.balls ? '🐉'.repeat(player.balls) : ''}
                  {!player.isEligible && '🔒'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 space-y-4">
             <div className="w-16 h-16 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
             <p className="text-xl font-mono uppercase tracking-widest">Waiting for League Data...</p>
             <p className="text-sm opacity-50">Syncing from Cloud</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- LIVE MATCHES PANEL ---
export const MatchesPanel: React.FC<{ data: SagaData | null }> = ({ data }) => {
  const matches = data?.activeMatches || [];
  const hasMatches = matches.length > 0;

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in duration-700">
      <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
        <span className="text-red-500 animate-pulse">●</span> LIVE ACTION
      </h2>
      
      {hasMatches ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full content-start">
          {matches.map((match, idx) => (
            <div key={idx} className="bg-slate-800 border-2 border-slate-700 rounded-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 bg-slate-700 text-slate-300 px-4 py-1 text-xs font-bold uppercase rounded-bl-xl z-10">
                Court {match.court}
              </div>
              
              <div className="p-8 flex flex-col items-center justify-center h-64 gap-6">
                {/* Team 1 */}
                <div className="text-center">
                  <div className="text-3xl font-black text-white uppercase tracking-tighter">
                    {match.team1.join(' / ')}
                  </div>
                </div>

                {/* VS */}
                <div className="flex items-center gap-4 w-full">
                  <div className="h-px bg-slate-600 flex-1"></div>
                  <span className="text-slate-500 font-bold text-xl italic">VS</span>
                  <div className="h-px bg-slate-600 flex-1"></div>
                </div>

                {/* Team 2 */}
                <div className="text-center">
                  <div className="text-3xl font-black text-white uppercase tracking-tighter">
                    {match.team2.join(' / ')}
                  </div>
                </div>

                {/* Score if available */}
                {match.score && (
                  <div className="mt-4 bg-slate-950 px-6 py-2 rounded text-2xl font-mono text-amber-500 font-bold border border-slate-700 shadow-inner">
                    {match.score}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
           <div className="text-center">
             <p className="text-slate-600 font-bold text-2xl uppercase tracking-widest">No Active Matches</p>
             <p className="text-slate-700 text-sm mt-2">The courts are currently quiet.</p>
           </div>
        </div>
      )}
    </div>
  );
};

// --- LORE PANEL ---
export const LorePanel: React.FC<{ data: SagaData | null }> = ({ data }) => {
  const lore = data?.lore || { dragonBalls: {} };
  // Mock fallback for structure if data is missing, but values should come from DB
  const players = ['Goku', 'Vegeta', 'Gohan', 'Piccolo']; 

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in duration-700 bg-gradient-to-br from-slate-900 to-amber-950/20">
       <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
        <span className="text-amber-500">🐉</span> SAGA WATCH
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {players.map(name => {
          const balls = lore.dragonBalls?.[name] || 0;
          return (
            <div key={name} className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 flex justify-between items-center">
              <span className="text-xl font-bold text-slate-200 uppercase">{name}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full border border-slate-950 transition-all duration-500 ${i <= balls ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)] scale-110' : 'bg-slate-700'}`}></div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-auto p-6 bg-slate-800/50 rounded-xl border border-slate-700">
        <h3 className="text-slate-400 text-sm font-bold uppercase mb-2">Broadcast Status</h3>
        <p className="text-xl text-white italic">"Live Coverage Active"</p>
        <p className="text-sm text-slate-500 mt-2">Updates every 30s</p>
      </div>
    </div>
  )
}
