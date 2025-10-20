import React, { useState } from 'react';
import { useEffect } from 'react';
import { BookOpen, Play, Pause, Check, ArrowRight, RotateCcw, Star } from 'lucide-react';
import * as Tone from 'tone';
import { EducationLesson, VisualizerSettings, MIDINote } from '../../types';
import { audioEngine } from '../../utils/audioEngine';
import { LiveAudioVisualizer } from '../LiveAudioVisualizer/LiveAudioVisualizer';
import type { VisualizationMode } from '../LiveAudioVisualizer/VisualizationEngine';

interface EducationModeProps {
  onExitEducation: () => void;
}

export const EducationMode: React.FC<EducationModeProps> = ({ onExitEducation }) => {
  const [selectedLesson, setSelectedLesson] = useState<EducationLesson | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userPattern, setUserPattern] = useState<boolean[]>(new Array(16).fill(false));
  const [snarePattern, setSnarePattern] = useState<boolean[]>(new Array(16).fill(false));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayStep, setCurrentPlayStep] = useState(0);
  const [tempo] = useState(120); // Fixed tempo for education mode
  const [visualizerSettings, setVisualizerSettings] = useState<VisualizerSettings>({
    colorMode: 'spectrum',
    brightness: 0.8,
    ledMatrixEnabled: false,
    ledMatrixIP: ''
  });
  const [midiNotes, setMidiNotes] = useState<MIDINote[]>([]);
  const [colorModeStep, setColorModeStep] = useState(0);
  const [drumsPlayed, setDrumsPlayed] = useState<Set<string>>(new Set());
  const [vizMode, setVizMode] = useState<VisualizationMode>('spectrum');

  // Initialize audio engine on component mount
  useEffect(() => {
    const initAudio = async () => {
      try {
        await audioEngine.initialize();
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };

    initAudio();
  }, []);

  // Configure FrequencySourceManager for drum visualization in lesson 2
  useEffect(() => {
    if (selectedLesson?.id === '2') {
      const sourceManager = (window as any).frequencySourceManager;
      if (sourceManager && sourceManager.setMixMode) {
        sourceManager.setMixMode('drums-only');
      }
      // Reset all lesson 2 state when starting
      setDrumsPlayed(new Set());
      setColorModeStep(0);
      setVizMode('spectrum');
      setVisualizerSettings(prev => ({
        ...prev,
        colorMode: 'spectrum'
      }));
    }
  }, [selectedLesson]);

  const lessons: EducationLesson[] = [
    {
      id: '1',
      title: 'Basic Beat',
      description: 'Learn to create a simple kick drum pattern',
      difficulty: 'beginner',
      steps: [
        {
          id: '1-1',
          instruction: 'Click on steps 1, 5, 9, and 13 to create a basic kick drum pattern',
          expectedPattern: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
          hint: 'Put the kick on every quarter note (steps 1, 5, 9, 13)',
          completed: false
        }
      ]
    },
    {
      id: '2',
      title: 'Color and Pitch',
      description: 'Discover how musical notes relate to colors',
      difficulty: 'beginner',
      steps: [
        {
          id: '2-1',
          instruction: 'Click the drum buttons below to see how different sounds create live spectrum visualizations',
          hint: 'Notice how low sounds like kick drums appear as red, while high sounds appear as blue/violet in the frequency bars',
          completed: false
        },
        {
          id: '2-2',
          instruction: 'Now switch to Ripple mode to see sound as expanding circles instead of frequency bars',
          hint: 'Ripple mode shows audio energy visually - try playing the drums to see the effect!',
          completed: false
        },
        {
          id: '2-3',
          instruction: 'Try different color modes to see how the same sounds can be colored differently',
          hint: 'Spectrum mode uses frequency (red=low, violet=high), Chromatic uses note names, and Harmonic shows musical relationships',
          completed: false
        }
      ]
    },
    {
      id: '3',
      title: 'Rhythm Patterns',
      description: 'Learn to create a complete 4/4 beat with kick and snare',
      difficulty: 'intermediate',
      steps: [
        {
          id: '3-1',
          instruction: 'First, create a kick drum pattern on steps 1, 5, 9, and 13',
          expectedPattern: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
          hint: 'The kick drum should hit on every quarter note (beats 1, 2, 3, 4)',
          completed: false
        },
        {
          id: '3-2',
          instruction: 'Now add a snare track below. Click on steps 5 and 13 for the snare (beats 2 and 4)',
          expectedPattern: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
          hint: 'Snare typically goes on the backbeat (beats 2 and 4)',
          completed: false
        }
      ]
    }
  ];

  const handleStepToggle = (stepIndex: number) => {
    const newPattern = [...userPattern];
    newPattern[stepIndex] = !newPattern[stepIndex];
    setUserPattern(newPattern);
  };

  const checkPattern = () => {
    if (!selectedLesson) return false;
    const currentStep = selectedLesson.steps[currentStepIndex];
    if (!currentStep) return false;
    if (!currentStep.expectedPattern) return true;
    
    // For the second step of Rhythm Patterns lesson (snare track)
    if (selectedLesson.id === '3' && currentStepIndex === 1) {
      return JSON.stringify(snarePattern) === JSON.stringify(currentStep.expectedPattern);
    }
    
    return JSON.stringify(userPattern) === JSON.stringify(currentStep.expectedPattern);
  };

  const nextStep = () => {
    if (!selectedLesson) return;
    const currentStep = selectedLesson.steps[currentStepIndex];
    if (!currentStep) return;

    if (currentStepIndex < selectedLesson.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      // Don't reset kick pattern when moving to snare step
      if (!(selectedLesson.id === '3' && currentStepIndex === 0)) {
        setUserPattern(new Array(16).fill(false));
      }
      setSnarePattern(new Array(16).fill(false));
    } else {
      // Lesson completed - reset all state
      setSelectedLesson(null);
      setCurrentStepIndex(0);
      setUserPattern(new Array(16).fill(false));
      setSnarePattern(new Array(16).fill(false));
      setDrumsPlayed(new Set());
      setColorModeStep(0);
      setVizMode('spectrum');
      setVisualizerSettings(prev => ({
        ...prev,
        colorMode: 'spectrum'
      }));
    }
  };

  const resetPattern = () => {
    if (!selectedLesson) return;
    const currentStep = selectedLesson.steps[currentStepIndex];
    if (!currentStep) return;
    
    // For the second step of Rhythm Patterns lesson (snare track)
    if (selectedLesson?.id === '3' && currentStepIndex === 1) {
      setSnarePattern(new Array(16).fill(false));
    } else {
      setUserPattern(new Array(16).fill(false));
    }
  };

  // Playback functionality
  useEffect(() => {
    if (!isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setCurrentPlayStep(0);
      return;
    }

    // Set up Tone.js transport
    Tone.Transport.bpm.value = tempo;
    Tone.Transport.cancel(); // Clear any existing events
    
    let stepIndex = 0;
    
    const scheduleId = Tone.Transport.scheduleRepeat(() => {
      // Play drum sound if step is active
      if (userPattern[stepIndex]) {
        audioEngine.playDrum('kick', 0.8);
      }
      
      // Play snare if snare pattern is active (for Rhythm Patterns lesson)
      if (selectedLesson?.id === '3' && snarePattern[stepIndex]) {
        audioEngine.playDrum('snare', 0.8);
      }
      
      // Update visual step indicator
      setCurrentPlayStep(stepIndex);
      
      stepIndex = (stepIndex + 1) % 16;
    }, "16n", 0); // 16th note intervals starting immediately
    
    Tone.Transport.start();

    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel(scheduleId);
    };
  }, [isPlaying, tempo, userPattern, snarePattern, selectedLesson]);

  const handlePlayPattern = () => {
    setIsPlaying(!isPlaying);
  };

  const playDrumSound = (drumName: string, midiNote: number) => {
    // Play the drum sound
    audioEngine.playDrum(drumName, 0.8);

    // Add MIDI note for visualization
    const note: MIDINote = {
      note: midiNote,
      velocity: 0.8,
      channel: 10,
      timestamp: Date.now(),
      userId: 'education'
    };

    setMidiNotes(prev => [...prev.slice(-10), note]);

    // Send drum hit to FrequencySourceManager for LiveAudioVisualizer
    const sourceManager = (window as any).frequencySourceManager;
    if (sourceManager && sourceManager.addDrumHit) {
      sourceManager.addDrumHit(drumName, 0.8);
    }

    // Track which drums have been played in lesson 2
    if (selectedLesson?.id === '2') {
      const updatedDrums = new Set(drumsPlayed).add(drumName);
      setDrumsPlayed(updatedDrums);

      // Auto-advance to step 2.2 when all 4 drums have been played in step 2.1
      if (currentStepIndex === 0 && updatedDrums.size === 4) {
        setTimeout(() => {
          setCurrentStepIndex(1);
        }, 1500);
      }
    }
  };

  const switchVisualizationMode = () => {
    // Toggle between spectrum and ripple only
    const newMode: VisualizationMode = vizMode === 'spectrum' ? 'ripple' : 'spectrum';
    setVizMode(newMode);

    // Auto-advance to step 2.3 when switching to ripple mode in step 2.2
    if (selectedLesson?.id === '2' && currentStepIndex === 1 && newMode === 'ripple') {
      setTimeout(() => {
        setCurrentStepIndex(2);
      }, 1500);
    }
  };

  const switchColorMode = () => {
    const modes: Array<'spectrum' | 'chromatic' | 'harmonic'> = ['spectrum', 'chromatic', 'harmonic'];
    const currentIndex = modes.indexOf(visualizerSettings.colorMode);
    const nextIndex = (currentIndex + 1) % modes.length;

    setVisualizerSettings(prev => ({
      ...prev,
      colorMode: modes[nextIndex]
    }));

    setColorModeStep(prev => prev + 1);
  };

  if (!selectedLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Education Mode</h1>
            </div>
            <button
              onClick={onExitEducation}
              className="btn-secondary w-full sm:w-auto touch-target"
            >
              Exit Education
            </button>
          </div>

          {/* Welcome Message */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-white/20">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Welcome, Music Explorer! 🎵</h2>
            <p className="text-white/80 text-base sm:text-lg">
              Let's learn about rhythm and music through fun, interactive lessons. 
              Watch how your beats create beautiful colors and patterns!
            </p>
          </div>

          {/* Lesson Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer touch-target"
                onClick={() => setSelectedLesson(lesson)}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    lesson.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300' :
                    lesson.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {lesson.difficulty}
                  </div>
                  <div className="flex">
                    {Array.from({ length: lesson.difficulty === 'beginner' ? 1 : lesson.difficulty === 'intermediate' ? 2 : 3 }, (_, i) => (
                      <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{lesson.title}</h3>
                <p className="text-white/70 mb-4 text-sm sm:text-base">{lesson.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">{lesson.steps.length} steps</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentStep = selectedLesson.steps[currentStepIndex];
  
  // Safety check: if currentStep is undefined, reset to lesson selection
  if (!currentStep) {
    setSelectedLesson(null);
    setCurrentStepIndex(0);
    setUserPattern(new Array(16).fill(false));
    setSnarePattern(new Array(16).fill(false));
    return null;
  }
  
  const isPatternCorrect = checkPattern();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedLesson(null)}
              className="text-white/70 hover:text-white transition-colors touch-target"
            >
              ← Back to Lessons
            </button>
          </div>
          <button
            onClick={onExitEducation}
            className="btn-secondary w-full sm:w-auto touch-target"
          >
            Exit Education
          </button>
        </div>

        {/* Lesson Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{selectedLesson.title}</h2>
            <div className="text-white/70 text-sm sm:text-base">
              Step {currentStepIndex + 1} of {selectedLesson.steps.length}
            </div>
          </div>
          
          <div className="w-full bg-white/20 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / selectedLesson.steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-6 border border-white/20">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-3">📝 Instructions</h3>
          <p className="text-white/90 text-base sm:text-lg mb-4">{currentStep.instruction}</p>
          
          {currentStep.hint && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-yellow-200 text-sm sm:text-base">💡 Hint: {currentStep.hint}</p>
            </div>
          )}
        </div>

        {/* Interactive Drum Pattern */}
        {(currentStep.expectedPattern || selectedLesson?.id === '2') && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-6 border border-white/20">
            {selectedLesson?.id === '2' ? (
              // Color and Pitch lesson content
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4">🎨 Sound and Color Explorer</h3>

                {/* Visualizer */}
                <div className="mb-6">
                  <LiveAudioVisualizer
                    embedded={true}
                    currentMode={vizMode}
                    onModeChange={setVizMode}
                    colorMode={visualizerSettings.colorMode}
                    className="mb-6"
                  />
                </div>

                {/* Drum Buttons - Always visible in all steps */}
                <div>
                  <h4 className="text-white font-medium mb-3">
                    {currentStepIndex === 0 && 'Click the drums to hear sounds and see colors:'}
                    {currentStepIndex === 1 && 'Play drums to see the ripple effect:'}
                    {currentStepIndex === 2 && 'Play drums in different color modes:'}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <button
                      onClick={() => playDrumSound('kick', 36)}
                      className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors touch-target relative min-w-[140px]"
                    >
                      <div className="flex items-center justify-between">
                        <Check className={`w-4 h-4 text-green-400 transition-opacity ${drumsPlayed.has('kick') ? 'opacity-100' : 'opacity-0'}`} />
                        <div className="flex-1 text-center">
                          🥁 Kick<br/>
                          <span className="text-xs opacity-75">(Low/Red)</span>
                        </div>
                        <div className="w-4"></div>
                      </div>
                    </button>
                    <button
                      onClick={() => playDrumSound('snare', 38)}
                      className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors touch-target relative min-w-[140px]"
                    >
                      <div className="flex items-center justify-between">
                        <Check className={`w-4 h-4 text-green-400 transition-opacity ${drumsPlayed.has('snare') ? 'opacity-100' : 'opacity-0'}`} />
                        <div className="flex-1 text-center">
                          🥁 Snare<br/>
                          <span className="text-xs opacity-75">(Mid/Green)</span>
                        </div>
                        <div className="w-4"></div>
                      </div>
                    </button>
                    <button
                      onClick={() => playDrumSound('clap', 39)}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors touch-target relative min-w-[140px]"
                    >
                      <div className="flex items-center justify-between">
                        <Check className={`w-4 h-4 text-green-400 transition-opacity ${drumsPlayed.has('clap') ? 'opacity-100' : 'opacity-0'}`} />
                        <div className="flex-1 text-center">
                          👏 Clap<br/>
                          <span className="text-xs opacity-75">(High/Blue)</span>
                        </div>
                        <div className="w-4"></div>
                      </div>
                    </button>
                    <button
                      onClick={() => playDrumSound('hihat', 42)}
                      className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors touch-target relative min-w-[140px]"
                    >
                      <div className="flex items-center justify-between">
                        <Check className={`w-4 h-4 text-green-400 transition-opacity ${drumsPlayed.has('hihat') ? 'opacity-100' : 'opacity-0'}`} />
                        <div className="flex-1 text-center">
                          🎩 Hi-Hat<br/>
                          <span className="text-xs opacity-75">(Very High/Purple)</span>
                        </div>
                        <div className="w-4"></div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Step 2.2: Switch to Ripple Mode */}
                {currentStepIndex === 1 && (
                  <div>
                    <button
                      onClick={switchVisualizationMode}
                      className="btn-primary w-full mb-4 touch-target"
                    >
                      Switch to Ripple Mode
                    </button>
                    <div className="bg-black/30 rounded-lg p-4">
                      <p className="text-white/80 text-sm">
                        📊 <strong>Spectrum Mode</strong> shows frequency bars - low frequencies on the left, high frequencies on the right.
                        <br /><br />
                        🌊 <strong>Ripple mode</strong> will show audio energy as expanding circles instead! Click the button above to switch, then try playing the drums to see the effect.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2.3: Try Color Modes */}
                {currentStepIndex === 2 && (
                  <div>
                    <button
                      onClick={switchColorMode}
                      className="btn-accent w-full mb-4 touch-target"
                    >
                      Switch to {visualizerSettings.colorMode === 'spectrum' ? 'Chromatic' :
                                visualizerSettings.colorMode === 'chromatic' ? 'Harmonic' : 'Spectrum'} Color
                    </button>
                    <div className="bg-black/30 rounded-lg p-4 mb-4">
                      <h4 className="text-white font-medium mb-2">
                        Current: <span className="text-yellow-400 capitalize">{visualizerSettings.colorMode}</span>
                      </h4>
                      <p className="text-white/80 text-sm">
                        {visualizerSettings.colorMode === 'spectrum' &&
                          '🌈 Spectrum Mode: Colors represent frequency - low sounds are red, high sounds are violet'}
                        {visualizerSettings.colorMode === 'chromatic' &&
                          '🎵 Chromatic Mode: Each musical note has its own color that stays the same across octaves'}
                        {visualizerSettings.colorMode === 'harmonic' &&
                          '🎼 Harmonic Mode: Musically related notes have similar colors based on the circle of fifths'}
                      </p>
                    </div>

                    {/* Lesson Complete Button - appears after trying at least 2 color modes */}
                    {colorModeStep >= 1 && (
                      <button
                        onClick={nextStep}
                        className="btn-primary w-full flex items-center justify-center gap-2 touch-target"
                      >
                        <span>Lesson Complete</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Regular pattern creation for other lessons
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white">🥁 Create Your Pattern</h3>
                  <button
                    onClick={resetPattern}
                    className="btn-secondary flex items-center gap-2 touch-target"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                </div>

                {/* Step Numbers */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-3">
                  <div className="w-full sm:w-16"></div>
                  <div className="grid grid-cols-8 sm:flex sm:gap-1.5 gap-1 w-full sm:w-auto">
                    {Array.from({ length: 16 }, (_, i) => {
                      // Determine color based on lesson and step
                      let numberColor = 'text-white/60'; // Default for non-beat steps
                      let animateClass = ''; // For alternating animation

                      // Lesson 1 and Lesson 3 Step 1: Kick on 1, 5, 9, 13 (all red)
                      if (selectedLesson.id === '1' || (selectedLesson.id === '3' && currentStepIndex === 0)) {
                        if (i % 4 === 0) { // Steps 1, 5, 9, 13 (indices 0, 4, 8, 12)
                          numberColor = 'text-red-500'; // Kick color
                        }
                      }

                      // Lesson 3 Step 2: Kick on 1, 9 (red), Steps 5, 13 alternate (both kick+snare)
                      if (selectedLesson.id === '3' && currentStepIndex === 1) {
                        if (i === 0 || i === 8) { // Steps 1, 9 (kick only)
                          numberColor = 'text-red-500'; // Kick color
                        } else if (i === 4 || i === 12) { // Steps 5, 13 (both kick and snare)
                          animateClass = 'animate-kick-snare'; // Alternate red/green
                        }
                      }

                      return (
                        <div
                          key={i}
                          className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-xs font-mono ${numberColor} ${animateClass}`}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pattern Grid */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-full sm:w-16 text-white font-medium text-center sm:text-left">Kick</div>
                  <div className="grid grid-cols-8 sm:flex sm:gap-1.5 gap-1 w-full sm:w-auto">
                    {userPattern.map((active, index) => (
                      <button
                        key={index}
                        onClick={() => handleStepToggle(index)}
                        className={`step-button-compact ${active ? 'active' : ''} ${
                          isPlaying && index === currentPlayStep ? 'ring-2 ring-yellow-400' : ''
                        } touch-target`}
                        style={{
                          backgroundColor: active ? '#ef4444' : undefined,
                          borderColor: active ? '#ef4444' : undefined
                        }}
                      >
                        {active && <div className="w-2 h-2 rounded-full bg-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Snare Track for Rhythm Patterns lesson step 2 */}
                {selectedLesson.id === '3' && currentStepIndex === 1 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
                    <div className="w-full sm:w-16 text-white font-medium text-center sm:text-left">Snare</div>
                    <div className="grid grid-cols-8 sm:flex sm:gap-1.5 gap-1 w-full sm:w-auto">
                      {snarePattern.map((active, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const newPattern = [...snarePattern];
                            newPattern[index] = !newPattern[index];
                            setSnarePattern(newPattern);
                          }}
                          className={`step-button-compact ${active ? 'active' : ''} ${
                            isPlaying && index === currentPlayStep ? 'ring-2 ring-yellow-400' : ''
                          } touch-target`}
                          style={{
                            backgroundColor: active ? '#10b981' : undefined,
                            borderColor: active ? '#10b981' : undefined
                          }}
                        >
                          {active && <div className="w-2 h-2 rounded-full bg-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pattern Check */}
                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {isPatternCorrect ? (
                      <>
                        <Check className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-medium text-sm sm:text-base">Great job! Pattern is correct!</span>
                      </>
                    ) : (
                      <span className="text-white/70 text-sm sm:text-base">Keep trying... you're doing great!</span>
                    )}
                  </div>
                  
                  {isPatternCorrect && (
                    <button
                      onClick={nextStep}
                      className="btn-accent flex items-center gap-2 w-full sm:w-auto touch-target"
                    >
                      <span>{currentStepIndex < selectedLesson.steps.length - 1 ? 'Next Step' : 'Complete Lesson'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Play Button */}
        {selectedLesson?.id !== '2' && (
          <div className="text-center">
            <button
              onClick={handlePlayPattern}
              className="btn-primary flex items-center gap-2 touch-target"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isPlaying ? 'Stop' : 'Play'} Pattern</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};