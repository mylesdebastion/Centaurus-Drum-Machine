import { useState } from 'react';
import { WelcomeScreen } from './components/Welcome/WelcomeScreen';
import { JamSession } from './components/JamSession/JamSession';
import { EducationMode } from './components/Education/EducationMode';

type AppState = 'welcome' | 'jam' | 'education';

function App() {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [sessionCode, setSessionCode] = useState<string>('');

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
    setAppState('jam');
  };

  const handleJoinJam = (code: string) => {
    setSessionCode(code);
    setAppState('jam');
  };

  const handleEducationMode = () => {
    setAppState('education');
  };

  const handleLeaveSession = () => {
    setAppState('welcome');
    setSessionCode('');
  };

  const handleExitEducation = () => {
    setAppState('welcome');
  };

  switch (appState) {
    case 'jam':
      return (
        <JamSession
          sessionCode={sessionCode}
          onLeaveSession={handleLeaveSession}
        />
      );
    
    case 'education':
      return (
        <EducationMode
          onExitEducation={handleExitEducation}
        />
      );
    
    default:
      return (
        <WelcomeScreen
          onStartJam={handleStartJam}
          onJoinJam={handleJoinJam}
          onEducationMode={handleEducationMode}
        />
      );
  }
}

export default App;