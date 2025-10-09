import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { WelcomeScreen } from './components/Welcome/WelcomeScreen';
import { JamSession } from './components/JamSession/JamSession';
import { EducationMode } from './components/Education/EducationMode';
import { IsometricSequencer } from './components/IsometricSequencer/IsometricSequencer';
import { LiveAudioVisualizer } from './components/LiveAudioVisualizer/LiveAudioVisualizer';

function App() {
  const [sessionCode, setSessionCode] = useState<string>('');
  const navigate = useNavigate();

  const generateSessionCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleStartJam = () => {
    const code = generateSessionCode();
    setSessionCode(code);
    navigate('/jam');
  };

  const handleJoinJam = (code: string) => {
    setSessionCode(code);
    navigate('/jam');
  };

  const handleEducationMode = () => {
    navigate('/education');
  };

  const handleIsometricMode = () => {
    navigate('/isometric');
  };

  const handleLeaveSession = () => {
    navigate('/');
    setSessionCode('');
  };

  const handleExitEducation = () => {
    navigate('/');
  };

  const handleExitIsometric = () => {
    navigate('/');
  };

  const handleDJVisualizer = () => {
    navigate('/dj-visualizer');
  };

  const handleExitDJVisualizer = () => {
    navigate('/');
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <WelcomeScreen
            onStartJam={handleStartJam}
            onJoinJam={handleJoinJam}
            onEducationMode={handleEducationMode}
            onIsometricMode={handleIsometricMode}
            onDJVisualizer={handleDJVisualizer}
          />
        }
      />
      <Route
        path="/jam"
        element={
          <JamSession
            sessionCode={sessionCode}
            onLeaveSession={handleLeaveSession}
          />
        }
      />
      <Route
        path="/education"
        element={
          <EducationMode
            onExitEducation={handleExitEducation}
          />
        }
      />
      <Route
        path="/isometric"
        element={
          <IsometricSequencer
            onBack={handleExitIsometric}
          />
        }
      />
      <Route
        path="/dj-visualizer"
        element={
          <LiveAudioVisualizer
            onBack={handleExitDJVisualizer}
          />
        }
      />
    </Routes>
  );
}

export default App;
