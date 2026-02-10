
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { ViewerLayout } from './layouts/ViewerLayout';

// Viewer Components
import { ViewerDashboard } from './components/viewer/ViewerDashboard';
import { ScoreboardView } from './components/viewer/ScoreboardView';

export default function App() {
  const [tvMode, setTvMode] = useState(false);

  return (
    <HashRouter>
      <Routes>
        {/* === VIEWER APP === */}
        {/* Pass the TV Mode state down to the layout */}
        <Route 
          path="/viewer" 
          element={
            <ViewerLayout 
              tvMode={tvMode} 
              onToggleTVMode={() => setTvMode(v => !v)} 
            />
          }
        >
          {/* Default: TV Broadcast Loop */}
          <Route index element={<ViewerDashboard />} />
          
          {/* Live Scoreboard (Static View) */}
          <Route path="scoreboard" element={<ScoreboardView />} />
        </Route>

        {/* === SECURITY REDIRECT === */}
        <Route path="*" element={<Navigate to="/viewer" replace />} />
      </Routes>
    </HashRouter>
  );
}
