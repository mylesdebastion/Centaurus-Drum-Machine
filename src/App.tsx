import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { WelcomeScreen } from './components/Welcome/WelcomeScreen';
import { JamSession } from './components/JamSession/JamSession';
import { EducationMode } from './components/Education/EducationMode';
import { IsometricSequencer } from './components/IsometricSequencer/IsometricSequencer';
import { LiveAudioVisualizer } from './components/LiveAudioVisualizer/LiveAudioVisualizer';
import { WLEDDirectTest } from './components/WLEDExperiment/WLEDDirectTest';
import { MIDITest } from './components/MIDI/MIDITest';
import { PianoRoll } from './components/PianoRoll/PianoRoll';
import { GuitarFretboard } from './components/GuitarFretboard/GuitarFretboard';
import { LumiTest } from './components/LumiTest/LumiTest';

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
            onWLEDExperiment={handleWLEDExperiment}
            onMIDITest={handleMIDITest}
            onPianoRoll={handlePianoRoll}
            onGuitarFretboard={handleGuitarFretboard}
            onLumiTest={handleLumiTest}
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
    </Routes>
  );
}

export default App;
