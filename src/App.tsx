import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { GlobalMusicProvider } from './contexts/GlobalMusicContext';
import { HardwareManager } from './hardware';
import { audioEngine, TransportState } from './utils/audioEngine';
import { WelcomeScreen } from './components/Welcome/WelcomeScreen';
import { OnboardingRouter } from './components/Onboarding/OnboardingRouter';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';
import { JamSession } from './components/JamSession/JamSession';
import '@/utils/devShortcuts'; // Load dev shortcuts globally
import { JamSessionLegacy } from './components/JamSessionLegacy/JamSessionLegacy';
import { EducationMode } from './components/Education/EducationMode';
import { IsometricSequencer } from './components/IsometricSequencer/IsometricSequencer';
import { LiveAudioVisualizer } from './components/LiveAudioVisualizer/LiveAudioVisualizer';
import { WLEDDirectTest } from './components/WLEDExperiment/WLEDDirectTest';
import { WLEDManager } from './components/WLEDManager';
import { MIDITest } from './components/MIDI/MIDITest';
import { PianoRoll } from './components/PianoRoll/PianoRoll';
import { GuitarFretboard } from './components/GuitarFretboard/GuitarFretboard';
import { LumiTest } from './components/LumiTest/LumiTest';
import { GlobalMusicHeaderTest } from './components/GlobalMusicHeaderTest';
import { Studio } from './components/Studio/Studio';
import { SupabaseConnectionTest } from './components/SupabaseConnectionTest';
import { ChordMelodyArranger } from './components/Studio/modules/ChordMelodyArranger';
import { UsernameModal, getStoredUsername } from './components/JamSession/UsernameModal';
import { supabaseSessionService } from './services/supabaseSession';
import { AuthTest } from './components/AuthTest';
import { LaunchpadProExperiment } from './components/LaunchpadProExperiment';
import { AnnouncementBanner } from './components/AnnouncementBanner';

function App() {
  const [sessionCode, setSessionCode] = useState<string>('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'join' | null>(null);
  const [pendingJoinCode, setPendingJoinCode] = useState<string>('');
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

  /**
   * Global dev shortcut: Alt+Shift+R to reset onboarding
   * (Ctrl+Shift+R conflicts with Chrome hard refresh)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        const { resetOnboarding } = require('@/utils/devShortcuts');
        resetOnboarding();
        navigate('/');
        window.location.reload();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  /**
   * Hide Crisp chat widget in Education Mode to avoid student distractions
   */
  useEffect(() => {
    // Wait for Crisp to load
    const checkCrisp = setInterval(() => {
      if (window.$crisp) {
        clearInterval(checkCrisp);

        // Hide on Education Mode, show on all other routes
        if (location.pathname === '/education') {
          window.$crisp.push(['do', 'chat:hide']);
        } else {
          window.$crisp.push(['do', 'chat:show']);
        }
      }
    }, 100);

    return () => clearInterval(checkCrisp);
  }, [location.pathname]);

  const handleStartJam = () => {
    // Check if username exists, if not show modal
    const storedUsername = getStoredUsername();
    if (storedUsername) {
      createSessionWithUsername(storedUsername);
    } else {
      setPendingAction('create');
      setShowUsernameModal(true);
    }
  };

  const handleJoinJam = (code: string) => {
    // Check if username exists, if not show modal
    const storedUsername = getStoredUsername();
    if (storedUsername) {
      joinSessionWithUsername(code, storedUsername);
    } else {
      setPendingAction('join');
      setPendingJoinCode(code);
      setShowUsernameModal(true);
    }
  };

  const handleUsernameSubmit = async (username: string) => {
    setShowUsernameModal(false);

    try {
      if (pendingAction === 'create') {
        await createSessionWithUsername(username);
      } else if (pendingAction === 'join') {
        await joinSessionWithUsername(pendingJoinCode, username);
      }
    } catch (error) {
      console.error('[App] Session error:', error);
      alert(error instanceof Error ? error.message : 'Failed to connect to session');
    } finally {
      setPendingAction(null);
      setPendingJoinCode('');
    }
  };

  const handleUsernameCancel = () => {
    setShowUsernameModal(false);
    setPendingAction(null);
    setPendingJoinCode('');
  };

  const createSessionWithUsername = async (username: string) => {
    try {
      const roomCode = await supabaseSessionService.createSession(username);
      setSessionCode(roomCode);
      navigate('/jam');
    } catch (error) {
      throw new Error('Failed to create session. Please try again.');
    }
  };

  const joinSessionWithUsername = async (code: string, username: string) => {
    try {
      await supabaseSessionService.joinSession(code, username);
      setSessionCode(code);
      navigate('/jam');
    } catch (error) {
      throw new Error('Failed to join session. Check the room code and try again.');
    }
  };

  const generateSessionCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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

  const handleLeaveSession = async () => {
    // Leave Supabase session if in one
    if (supabaseSessionService.isInSession()) {
      await supabaseSessionService.leaveSession();
    }
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

  const handleWLEDManager = () => {
    navigate('/wled-manager');
  };

  const handleExitWLEDManager = () => {
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

  const handleChordMelodyTest = () => {
    navigate('/chord-melody-test');
  };

  const handleExitChordMelodyTest = () => {
    navigate('/');
  };

  const handleLaunchpadTest = () => {
    navigate('/launchpad-test');
  };

  const handleExitLaunchpadTest = () => {
    navigate('/');
  };

  return (
    <>
    <GlobalMusicProvider>
      <HardwareManager>
        {/* Username Modal */}
        <UsernameModal
          isOpen={showUsernameModal}
          onSave={handleUsernameSubmit}
          onCancel={handleUsernameCancel}
        />

        <Routes>
        <Route
          path="/"
          element={<OnboardingRouter />}
        />
        <Route
          path="/playground"
          element={
            <WelcomeScreen
              onStartJam={handleStartJam}
              onJoinJam={handleJoinJam}
              onStartJamLegacy={handleStartJamLegacy}
              onEducationMode={handleEducationMode}
              onIsometricMode={handleIsometricMode}
              onDJVisualizer={handleDJVisualizer}
              onWLEDExperiment={handleWLEDExperiment}
              onWLEDManager={handleWLEDManager}
              onMIDITest={handleMIDITest}
              onPianoRoll={handlePianoRoll}
              onGuitarFretboard={handleGuitarFretboard}
              onLumiTest={handleLumiTest}
              onHeaderTest={handleHeaderTest}
              onStudio={handleStudio}
              onSupabaseTest={handleSupabaseTest}
              onChordMelodyTest={handleChordMelodyTest}
              onLaunchpadTest={handleLaunchpadTest}
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
          path="/wled-manager"
          element={
            <WLEDManager
              onBack={handleExitWLEDManager}
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
        <Route
          path="/chord-melody-test"
          element={
            <div className="h-screen">
              <ChordMelodyArranger
                onBack={handleExitChordMelodyTest}
                embedded={false}
              />
            </div>
          }
        />
        <Route
          path="/launchpad-test"
          element={
            <LaunchpadProExperiment
              onBack={handleExitLaunchpadTest}
            />
          }
        />
        <Route
          path="/auth-test"
          element={<AuthTest />}
        />
        <Route
          path="/analytics"
          element={<AnalyticsDashboard />}
        />
      </Routes>
      </HardwareManager>
    </GlobalMusicProvider>

    {/* Announcement Banner */}
    <AnnouncementBanner
      announcement={{
        id: 'discord-launch-2025-10',
        message: 'Join our new Discord community to provide feedback and discuss ideas for the future of Audiolux!',
        link: 'https://discord.gg/ZsXcujcnFe',
        linkText: 'Join Discord',
        icon: 'discord'
      }}
    />
  </>
  );
}

export default App;
