
import React, { createContext, useContext, ReactNode, useState } from 'react';

// Define a flexible shape for the saga data since we don't have the upstream types
export interface SagaData {
  sagaName?: string;
  day?: number;
  activeLeague?: any; // Raw league object for precise local calculations
  standings?: Array<{
    name: string;
    ppg: number;
    played: number;
    wins: number;
    losses: number; // Removed optional to be strict
    points: number; // Removed optional to be strict
    streak?: number;
    balls?: number;
    isPresent?: boolean; // Indicates if player is checked in for the current day
    isEligible?: boolean; // For greying out
    // Extended Stats
    bonusPoints?: number; // Bagels
    clutchWins?: number; // 11-10 wins
    noShows?: number;
    dragonBalls?: number;
  }>;
  activeMatches?: Array<{
    id: string; // Added ID for keying animations
    court: number;
    team1: string[];
    team2: string[];
    score?: string;
    scoreA?: number;
    scoreB?: number;
    status?: 'live' | 'pending'; // Explicit status for UI (Red vs Grey badge)
  }>;
  upcomingMatches?: Array<{ // Matches scheduled but not started (0-0)
    id: string;
    court: number;
    team1: string[];
    team2: string[];
    round?: number;
  }>;
  playerNames?: Record<string, string>; // Map ID -> Name
  attendees?: string[]; // List of IDs present today
  isDayComplete?: boolean;
  leagueStats?: {
    totalMatches: number; // Total valid matches played in league history
    minRequired?: number; // Minimum matches required for eligibility (60% of maxPlayed)
  };
  lore?: {
    dragonBalls: Record<string, number>; // player -> count
  };
}

interface ViewerContextType {
  isReadOnly: boolean;
  data: SagaData | null;
  lastUpdated: Date;
  isOnline: boolean;
  setData: (data: SagaData) => void;
  setLastUpdated: (date: Date) => void;
  setIsOnline: (status: boolean) => void;
}

const ViewerContext = createContext<ViewerContextType>({ 
  isReadOnly: false,
  data: null,
  lastUpdated: new Date(),
  isOnline: true,
  setData: () => {},
  setLastUpdated: () => {},
  setIsOnline: () => {}
});

export const useViewerMode = () => useContext(ViewerContext);

interface ViewerProviderProps {
  children: ReactNode;
  isReadOnly?: boolean;
}

export const ViewerProvider: React.FC<ViewerProviderProps> = ({ 
  children, 
  isReadOnly = false 
}) => {
  const [data, setDataState] = useState<SagaData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Simplified: Just update state. 
  // All normalization and logic happens in ViewerLayout::normalizeData before reaching here.
  const setData = (incoming: SagaData) => {
    setDataState(incoming);
  };

  return (
    <ViewerContext.Provider value={{ 
      isReadOnly, 
      data, 
      setData, 
      lastUpdated, 
      setLastUpdated, 
      isOnline, 
      setIsOnline 
    }}>
      {children}
    </ViewerContext.Provider>
  );
};
