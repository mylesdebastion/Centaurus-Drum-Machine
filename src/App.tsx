import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { GlobalMusicProvider } from './contexts/GlobalMusicContext';
import { audioEngine, TransportState } from './utils/audioEngine';
import { WelcomeScreen } from './components/Welcome/WelcomeScreen';
import { JamSession } from './components/JamSession/JamSession';
import { JamSessionLegacy } from './components/JamSessionLegacy/JamSessionLegacy';
import { EducationMode } from './components/Education/EducationMode';
import { IsometricSequencer } from './components/IsometricSequencer/IsometricSequencer';
import { LiveAudioVisualizer } from './components/LiveAudioVisualizer/LiveAudioVisualizer';
import { WLEDDirectTest } from './components/WLEDExperiment/WLEDDirectTest';
import { MIDITest } from './components/MIDI/MIDITest';
import { PianoRoll } from './components/PianoRoll/PianoRoll';
import { GuitarFretboard } from './components/GuitarFretboard/GuitarFretboard';
import { LumiTest } from './components/LumiTest/LumiTest';
import { GlobalMusicHeaderTest } from './components/GlobalMusicHeaderTest';
import { Studio } from './components/Studio/Studio';
import { SupabaseConnectionTest } from './components/SupabaseConnectionTest';

function App() {
  const [sessionCode, setSessionCode] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const transportStateRef = useRef<TransportState | null>(null);

  /**
   * Persist audio transport state across navigation
   * Save state before route changes, restore after
   */
  useEffect(() => {
    // Restore transport state after navigation (if available)
    if (transportStateRef.current) {
      console.log('[App] Restoring transport state after navigation to:', location.pathname);
      audioEngine.restoreTransportState(transportStateRef.current);
      audioEngine.ensureAudioContext(); // Resume if suspended
    }

    // Save transport state before navigation (cleanup function)
    return () => {
      const state = audioEngine.getTransportState();
      transportStateRef.current = state;
      console.log('[App] Saved transport state before navigation from:', location.pathname);
    };
  }, [location]);

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

  const handleStartJamLegacy = () => {
    const code = generateSessionCode();
    setSessionCode(code);
    navigate('/jam-legacy');
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

  const handleWLEDExperiment = () => {
    navigate('/wled-test');
  };

  const handleExitWLEDExperiment = () => {
    navigate('/');
  };

  const handleMIDITest = () => {
    navigate('/midi-test');
  };

  const handleExitMIDITest = () => {
    navigate('/');
  };

  const handlePianoRoll = () => {
    navigate('/piano');
  };

  const handleExitPianoRoll = () => {
    navigate('/');
  };

  const handleGuitarFretboard = () => {
    navigate('/guitar-fretboard');
  };

  const handleExitGuitarFretboard = () => {
    navigate('/');
  };

  const handleLumiTest = () => {
    navigate('/lumi-test');
  };

  const handleExitLumiTest = () => {
    navigate('/');
  };

  const handleHeaderTest = () => {
    navigate('/header-test');
  };

  const handleExitHeaderTest = () => {
    navigate('/');
  };

  const handleStudio = () => {
    navigate('/studio');
  };

  const handleExitStudio = () => {
    navigate('/');
  };

  const handleSupabaseTest = () => {
    navigate('/supabase-test');
  };

  const handleExitSupabaseTest = () => {
    navigate('/');
  };

  return (
    <GlobalMusicProvider>
      <Routes>
        <Route
          path="/"
          element={
            <WelcomeScreen
              onStartJam={handleStartJam}
              onJoinJam={handleJoinJam}
              onStartJamLegacy={handleStartJamLegacy}
              onEducationMode={handleEducationMode}
              onIsometricMode={handleIsometricMode}
              onDJVisualizer={handleDJVisualizer}
              onWLEDExperiment={handleWLEDExperiment}
              onMIDITest={handleMIDITest}
              onPianoRoll={handlePianoRoll}
              onGuitarFretboard={handleGuitarFretboard}
              onLumiTest={handleLumiTest}
              onHeaderTest={handleHeaderTest}
              onStudio={handleStudio}
              onSupabaseTest={handleSupabaseTest}
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
          path="/jam-legacy"
          element={
            <JamSessionLegacy
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
        <Route
          path="/wled-test"
          element={
            <WLEDDirectTest
              onBack={handleExitWLEDExperiment}
            />
          }
        />
        <Route
          path="/midi-test"
          element={
            <MIDITest
              onBack={handleExitMIDITest}
            />
          }
        />
        <Route
          path="/piano"
          element={
            <PianoRoll
              onBack={handleExitPianoRoll}
            />
          }
        />
        <Route
          path="/guitar-fretboard"
          element={
            <GuitarFretboard
              onBack={handleExitGuitarFretboard}
            />
          }
        />
        <Route
          path="/lumi-test"
          element={
            <LumiTest
              onBack={handleExitLumiTest}
            />
          }
        />
        <Route
          path="/header-test"
          element={
            <GlobalMusicHeaderTest
              onBack={handleExitHeaderTest}
            />
          }
        />
        <Route
          path="/studio"
          element={
            <Studio
              onBack={handleExitStudio}
            />
          }
        />
        <Route
          path="/supabase-test"
          element={
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
              <button
                onClick={handleExitSupabaseTest}
                className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                ← Back
              </button>
              <SupabaseConnectionTest />
            </div>
          }
        />
      </Routes>
    </GlobalMusicProvider>
  );
}

export default App;
