
import React, { createContext, useContext, ReactNode, useState } from 'react';

// Define a flexible shape for the saga data since we don't have the upstream types
export interface SagaData {
  sagaName?: string;
  day?: number;
  standings?: Array<{
    name: string;
    ppg: number;
    played: number;
    wins: number;
    losses?: number; // Added Losses field for W-L record
    points?: number; 
    streak?: number;
    balls?: number;
    isEligible?: boolean; // For greying out
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
  isDayComplete?: boolean;
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
  const [data, setData] = useState<SagaData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState<boolean>(true);

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
