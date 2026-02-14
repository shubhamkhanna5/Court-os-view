
/**
 * SAGA PPG LAW (FINAL DEFINITION)
 *
 * 1️⃣ A match counts ONLY if:
 *    - match.isCompleted === true
 *    - match.status === "completed"
 *    - match.isForfeit !== true
 *    - match.scoreA !== undefined && match.scoreB !== undefined
 *    - (match.noShowPlayerIds || []).length === 0
 *
 * 2️⃣ League Points Rule (DBZ Scoring)
 *    Winner:
 *      - 3 points for a win
 *      - +1 bonus if opponent scored 0 (Bagel) -> Total 4
 *    Loser:
 *      - 1 point for a loss
 *      - +1 bonus if loser scored 10 or more (Close Loss) -> Total 2
 *      - 0 points if loser scored 0 -> Total 0
 *
 * 3️⃣ Games Played
 *    - Only valid completed matches count.
 *
 * 4️⃣ PPG Formula
 *    - PPG = totalPoints / gamesPlayed
 *    - Keep full precision internally.
 *
 * 5️⃣ Eligibility Rule (60%)
 *    - maxGames = highest gamesPlayed in league
 *    - minRequired = ceil(maxGames * 0.6)
 *    - eligible if gamesPlayed >= minRequired
 */

export interface Player {
  id: string;
  name: string;
}

export interface LeagueMatch {
  id: string;
  dayId?: string;
  courtId: number;
  round?: number;
  teamA: string[];
  teamB: string[];
  type: 'singles' | 'doubles';
  isCompleted: boolean;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled' | 'walkover';
  scoreA?: number;
  scoreB?: number;
  isForfeit?: boolean;
  noShowPlayerIds?: string[];
  orderIndex?: number;
  score?: string;
  [key: string]: any;
}

export interface LeagueDay {
  id: string;
  week: number;
  day: number;
  date: number;
  seed: number;
  status: 'generated' | 'completed';
  matches: LeagueMatch[];
  partners?: any[];
  attendees?: string[];
  backedUp?: boolean;
}

export interface League {
  id: string;
  name: string;
  days: LeagueDay[];
  players: any[];
  currentDay: number;
}

export interface LeagueStanding {
  playerId: string;
  points: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  ppg: number;
  bonusPoints: number; // Bagels
  noShows: number;
  ppgHistory: number[];
  eligibleForTrophies: boolean;
}

export interface ValidMatchResult {
  playerId: string;
  pointsEarned: number;
  isWin: boolean;
  isBagel: boolean;
  isCloseLoss: boolean;
}

/**
 * THE ONE HARD RULE - Calculate points for a single player in a single match
 * This function MUST be identical in both admin and viewer code
 */
export function calculatePlayerMatchPoints(
  playerId: string,
  match: LeagueMatch
): ValidMatchResult | null {
  // 1️⃣ VALIDITY CHECK
  if (!match.isCompleted) return null;
  if (match.status !== 'completed') return null;
  if (match.isForfeit) return null;
  if (match.noShowPlayerIds && match.noShowPlayerIds.length > 0) return null;

  // 2️⃣ SCORE PARSING (Robustness Fallback)
  let scoreA = Number(match.scoreA);
  let scoreB = Number(match.scoreB);

  // If numeric scores are missing, try parsing the "11-9" string format
  if ((isNaN(scoreA) || isNaN(scoreB) || match.scoreA === null || match.scoreA === undefined || match.scoreB === null || match.scoreB === undefined) && typeof match.score === 'string' && match.score.includes('-')) {
     const parts = match.score.split('-');
     const parsedA = parseInt(parts[0]);
     const parsedB = parseInt(parts[1]);
     if (!isNaN(parsedA) && !isNaN(parsedB)) {
         scoreA = parsedA;
         scoreB = parsedB;
     }
  }

  // Final check: if we still don't have valid numbers, the match is invalid
  if (isNaN(scoreA) || isNaN(scoreB)) return null;

  // 3️⃣ DETERMINE TEAMS
  const teamA = match.teamA || match.team1 || [];
  const teamB = match.teamB || match.team2 || [];
  
  const isInTeamA = teamA.includes(playerId);
  const isInTeamB = teamB.includes(playerId);
  
  if (!isInTeamA && !isInTeamB) return null;

  const isWinner = isInTeamA ? scoreA > scoreB : scoreB > scoreA;
  const playerScore = isInTeamA ? scoreA : scoreB;
  const opponentScore = isInTeamA ? scoreB : scoreA;

  // 4️⃣ CALCULATE POINTS - DBZ RULES
  let points = 0;
  const isBagel = opponentScore === 0;
  const isCloseLoss = !isWinner && playerScore >= 10;

  if (isWinner) {
    points = 3;
    if (isBagel) points += 1; // Bagel bonus
  } else {
    points = 1;
    if (isBagel) {
      points = 0; // Got bageled = 0 points
    } else if (isCloseLoss) {
      points += 1; // Close loss bonus
    }
  }

  return {
    playerId,
    pointsEarned: points,
    isWin: isWinner,
    isBagel: isBagel && isWinner, // Only winner gets bagel credit
    isCloseLoss: isCloseLoss
  };
}

export function calculateLeagueStandings(league: League): LeagueStanding[] {
  const playerMap = new Map<string, LeagueStanding>();

  // Helper to ensure player entry exists
  const getStats = (playerId: string) => {
    if (!playerMap.has(playerId)) {
      playerMap.set(playerId, {
        playerId,
        points: 0,
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        ppg: 0,
        bonusPoints: 0,
        noShows: 0,
        ppgHistory: [],
        eligibleForTrophies: false
      });
    }
    return playerMap.get(playerId)!;
  };

  // 1. Initialize from league.players
  if (league.players && Array.isArray(league.players)) {
    league.players.forEach(p => {
       const pid = typeof p === 'string' ? p : p.id;
       if (pid) getStats(pid);
    });
  }

  // 2. Process Matches
  if (league.days && Array.isArray(league.days)) {
    league.days.forEach(day => {
      if (!day.matches || !Array.isArray(day.matches)) return;

      day.matches.forEach(match => {
        // Get all unique players in this match
        const teamA = match.teamA || match.team1 || [];
        const teamB = match.teamB || match.team2 || [];
        const allPlayers = [...new Set([...teamA, ...teamB])];

        allPlayers.forEach(playerId => {
            // Ensure stats exist (e.g. for subs not in main player list)
            const stats = getStats(playerId);
            const result = calculatePlayerMatchPoints(playerId, match);
            
            if (result) {
                stats.points += result.pointsEarned;
                if (result.isWin) stats.wins++;
                else stats.losses++;
                stats.gamesPlayed++;
                if (result.isBagel) stats.bonusPoints++;
            }
        });
      });
    });
  }

  // 3. FINAL CALCULATIONS
  const standings = Array.from(playerMap.values());
  
  const maxPlayed = Math.max(...standings.map(s => s.gamesPlayed), 0);
  const minRequired = Math.ceil(maxPlayed * 0.6);

  standings.forEach(s => {
    // PPG = Total Points / Games Played (Raw Float, No Rounding)
    s.ppg = s.gamesPlayed > 0 ? s.points / s.gamesPlayed : 0;
    
    // Eligibility
    s.eligibleForTrophies = s.gamesPlayed >= minRequired;
  });

  // 4. SORTING (SAGA LAW)
  return standings.sort((a, b) => {
    // 1. PPG (Primary) - Descending
    if (Math.abs(b.ppg - a.ppg) > 0.000001) return b.ppg - a.ppg;
    
    // 2. Total Points - Descending
    if (b.points !== a.points) return b.points - a.points;
    
    // 3. Wins - Descending
    if (b.wins !== a.wins) return b.wins - a.wins;
    
    // 4. Games Played - Descending
    return b.gamesPlayed - a.gamesPlayed;
  });
}
