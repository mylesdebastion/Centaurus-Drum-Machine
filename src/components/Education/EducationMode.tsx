import React, { useState } from 'react';
import { useEffect } from 'react';
import { BookOpen, Play, Check, ArrowRight, RotateCcw, Star } from 'lucide-react';
import * as Tone from 'tone';
import { EducationLesson } from '../../types';
import { audioEngine } from '../../utils/audioEngine';

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

  const lessons: EducationLesson[] = [
    {
      id: '1',
      title: 'Rhythm Patterns',
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
          instruction: 'Watch how different drum sounds create different colors',
          hint: 'Low sounds like kick drums appear as red, high sounds like hi-hats appear as blue/violet',
          completed: false
        },
        {
          id: '2-2',
          instruction: 'Try switching between color modes to see the difference',
          hint: 'Each mode shows a different way to map sound to color',
          completed: false
        }
      ]
    },
    {
      id: '3',
      title: 'Basic Beat',
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
    if (!currentStep.expectedPattern) return true;
    
    // For the second step of Basic Beat lesson (snare track)
    if (selectedLesson.id === '3' && currentStepIndex === 1) {
      return JSON.stringify(snarePattern) === JSON.stringify(currentStep.expectedPattern);
    }
    
    return JSON.stringify(userPattern) === JSON.stringify(currentStep.expectedPattern);
  };

  const nextStep = () => {
    if (!selectedLesson) return;
    
    if (currentStepIndex < selectedLesson.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      // Don't reset kick pattern when moving to snare step
      if (!(selectedLesson.id === '3' && currentStepIndex === 0)) {
        setUserPattern(new Array(16).fill(false));
      }
      setSnarePattern(new Array(16).fill(false));
    } else {
      // Lesson completed
      setSelectedLesson(null);
      setCurrentStepIndex(0);
      setUserPattern(new Array(16).fill(false));
      setSnarePattern(new Array(16).fill(false));
    }
  };

  const resetPattern = () => {
    // For the second step of Basic Beat lesson (snare track)
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
    
    const scheduleId = Tone.Transport.scheduleRepeat((time) => {
      // Play drum sound if step is active
      if (userPattern[stepIndex]) {
        audioEngine.playDrum('kick', 0.8);
      }
      
      // Play snare if snare pattern is active (for Basic Beat lesson)
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

  if (!selectedLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
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
  const isPatternCorrect = checkPattern();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
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
        {currentStep.expectedPattern && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-6 border border-white/20">
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
            <div className="grid grid-cols-8 sm:flex sm:gap-2 gap-1 mb-3 sm:ml-4">
              {Array.from({ length: 16 }, (_, i) => (
                <div
                  key={i}
                  className={`h-6 flex items-center justify-center text-xs font-mono ${
                    i % 4 === 0 ? 'text-yellow-400' : 'text-white/60'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Pattern Grid */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-full sm:w-16 text-white font-medium text-center sm:text-left">Kick</div>
              <div className="grid grid-cols-8 sm:flex sm:gap-2 gap-1 w-full sm:w-auto">
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

            {/* Snare Track for Basic Beat lesson step 2 */}
            {selectedLesson.id === '3' && currentStepIndex === 1 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
                <div className="w-full sm:w-16 text-white font-medium text-center sm:text-left">Snare</div>
                <div className="grid grid-cols-8 sm:flex sm:gap-2 gap-1 w-full sm:w-auto">
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

        {/* Play Button */}
        <div className="text-center">
          <button 
            onClick={handlePlayPattern}
            className={`text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 flex items-center gap-3 mx-auto w-full sm:w-auto touch-target transition-colors ${
              isPlaying 
                ? 'bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg'
                : 'btn-primary'
            }`}
          >
            <Play className="w-5 h-5 sm:w-6 sm:h-6" />
            {isPlaying ? 'Stop Pattern' : 'Play Your Pattern'}
          </button>
        </div>
      </div>
    </div>
  );
};