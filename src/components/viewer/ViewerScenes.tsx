
import React from 'react';
import { SagaData } from '../../context/ViewerContext';

// --- TYPES ---
type Player = NonNullable<SagaData['standings']>[number];
export type AuraType = 'red' | 'gold' | 'blue' | 'neutral';

// --- AURA VFX COMPONENT ---
const AuraLayer: React.FC<{ type: AuraType }> = ({ type }) => {
  if (type === 'neutral') return null;

  // CSS-first radial gradients for performance
  const styles = {
    red: "bg-[radial-gradient(circle,rgba(220,38,38,0.4)_0%,transparent_70%)] animate-pulse", // Champion
    gold: "bg-[radial-gradient(circle,rgba(234,179,8,0.3)_0%,transparent_70%)] animate-[pulse_3s_infinite]", // Top 3
    blue: "bg-[radial-gradient(circle,rgba(59,130,246,0.3)_0%,transparent_70%)] animate-[pulse_2s_infinite]", // Streak
  };

  return (
    <div className={`absolute inset-0 ${styles[type]} blur-3xl z-0 pointer-events-none mix-blend-screen`} />
  );
};

// --- SPONSOR COMPONENT ---
const SponsorFooter: React.FC<{ text?: string }> = ({ text }) => {
  if (!text) return null;
  return (
    <div className="absolute bottom-8 text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold opacity-60">
      {text}
    </div>
  );
};

// --- CHAMPION SCENE (MODE 1) ---
export const ChampionScene: React.FC<{ player: Player; sagaName: string; aura: AuraType; sponsor?: string }> = ({ 
  player, 
  sagaName,
  aura,
  sponsor 
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black text-white relative overflow-hidden animate-in fade-in duration-1000">
      {/* Dynamic Aura Layer */}
      <AuraLayer type={aura} />

      {/* Background Ambience (Static) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-black to-black opacity-80 z-0"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-8">
        <div className="text-yellow-500 text-5xl font-black tracking-widest uppercase animate-pulse drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
          🏆 Reigning Champion
        </div>

        <div className="flex flex-col items-center">
            <div className="text-[10rem] leading-none font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 drop-shadow-2xl">
            {player.name}
            </div>
            <div className={`w-32 h-2 mt-4 shadow-[0_0_20px_rgba(255,255,255,0.5)] ${aura === 'red' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
        </div>

        <div className="mt-8 flex items-center gap-12">
            <div className="text-center">
                <div className="text-slate-500 text-lg uppercase tracking-widest font-bold">Total Points</div>
                <div className="text-6xl font-mono font-bold text-yellow-400">
                  {player.points || player.wins} <span className="text-2xl text-yellow-600">PTS</span>
                </div>
            </div>
            <div className="w-px h-16 bg-slate-800"></div>
             <div className="text-center">
                <div className="text-slate-500 text-lg uppercase tracking-widest font-bold">PPG</div>
                <div className="text-6xl font-mono font-bold text-slate-300">{player.ppg.toFixed(2)}</div>
            </div>
        </div>

        <div className="mt-12 text-sm tracking-[0.5em] text-slate-600 uppercase font-bold">
          PBZ Saga · {sagaName}
        </div>
      </div>
      
      <SponsorFooter text={sponsor} />
    </div>
  );
};

// --- SPOTLIGHT SCENE (MODE 2) ---
export const SpotlightScene: React.FC<{ player: Player; rank: number; aura: AuraType; sponsor?: string }> = ({ 
  player, 
  rank,
  aura,
  sponsor 
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0F14] text-white relative animate-in zoom-in-95 duration-700 overflow-hidden">
      
      <AuraLayer type={aura} />

      <div className="absolute top-10 left-10 text-9xl font-black text-slate-800/50 select-none z-0">
        #{rank}
      </div>

      <div className="relative z-10 text-center space-y-4">
        <div className="text-slate-500 text-2xl font-bold uppercase tracking-widest mb-2">
            Player Spotlight
        </div>
        
        <div className="text-9xl font-black uppercase tracking-tight text-slate-100 drop-shadow-xl">
            {player.name}
        </div>

        <div className="text-5xl font-mono font-bold text-slate-400 mt-6">
            {player.points || player.wins} <span className="text-xl uppercase text-slate-600 font-sans tracking-widest">PTS</span>
        </div>

        <div className="flex justify-center gap-8 mt-8">
            <div className="bg-slate-800/80 backdrop-blur px-6 py-3 rounded border border-slate-700">
                <span className="block text-xs text-slate-500 uppercase tracking-wider">PPG</span>
                <span className="text-2xl font-bold text-white">{player.ppg.toFixed(2)}</span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur px-6 py-3 rounded border border-slate-700">
                <span className="block text-xs text-slate-500 uppercase tracking-wider">Win %</span>
                <span className="text-2xl font-bold text-green-400">
                    {player.played > 0 ? Math.round((player.wins / player.played) * 100) : 0}%
                </span>
            </div>
             {player.streak && player.streak >= 2 && (
                 <div className="bg-orange-900/40 backdrop-blur px-6 py-3 rounded border border-orange-500/30">
                    <span className="block text-xs text-orange-500 uppercase tracking-wider">Streak</span>
                    <span className="text-2xl font-bold text-orange-400">🔥 {player.streak}</span>
                </div>
            )}
        </div>
      </div>

      <SponsorFooter text={sponsor} />
    </div>
  );
};
