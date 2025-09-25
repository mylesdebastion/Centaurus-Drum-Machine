import React, { useState } from 'react';
import { BookOpen, Play, Check, ArrowRight, RotateCcw, Star } from 'lucide-react';
import { EducationLesson, LessonStep } from '../../types';

interface EducationModeProps {
  onExitEducation: () => void;
}

export const EducationMode: React.FC<EducationModeProps> = ({ onExitEducation }) => {
  const [selectedLesson, setSelectedLesson] = useState<EducationLesson | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userPattern, setUserPattern] = useState<boolean[]>(new Array(16).fill(false));

  const lessons: EducationLesson[] = [
    {
      id: '1',
      title: 'Basic Beat',
      description: 'Learn to create a simple 4/4 beat with kick and snare',
      difficulty: 'beginner',
      steps: [
        {
          id: '1-1',
          instruction: 'Click on steps 1, 5, 9, and 13 to create a basic kick drum pattern',
          expectedPattern: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
          hint: 'The kick drum should hit on every quarter note (beats 1, 2, 3, 4)',
          completed: false
        },
        {
          id: '1-2',
          instruction: 'Now add a snare on steps 5 and 13 (beats 2 and 4)',
          expectedPattern: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
          hint: 'Snare typically goes on the backbeat (beats 2 and 4)',
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
      title: 'Rhythm Patterns',
      description: 'Learn common rhythm patterns used in music',
      difficulty: 'intermediate',
      steps: [
        {
          id: '3-1',
          instruction: 'Create a "four-on-the-floor" pattern with the kick drum',
          expectedPattern: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
          hint: 'Put the kick on every quarter note (steps 1, 5, 9, 13)',
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
    
    return JSON.stringify(userPattern) === JSON.stringify(currentStep.expectedPattern);
  };

  const nextStep = () => {
    if (!selectedLesson) return;
    
    if (currentStepIndex < selectedLesson.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setUserPattern(new Array(16).fill(false));
    } else {
      // Lesson completed
      setSelectedLesson(null);
      setCurrentStepIndex(0);
      setUserPattern(new Array(16).fill(false));
    }
  };

  const resetPattern = () => {
    setUserPattern(new Array(16).fill(false));
  };

  if (!selectedLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-yellow-400" />
              <h1 className="text-3xl font-bold text-white">Education Mode</h1>
            </div>
            <button
              onClick={onExitEducation}
              className="btn-secondary"
            >
              Exit Education
            </button>
          </div>

          {/* Welcome Message */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-3">Welcome, Music Explorer! 🎵</h2>
            <p className="text-white/80 text-lg">
              Let's learn about rhythm and music through fun, interactive lessons. 
              Watch how your beats create beautiful colors and patterns!
            </p>
          </div>

          {/* Lesson Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
                onClick={() => setSelectedLesson(lesson)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    lesson.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300' :
                    lesson.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {lesson.difficulty}
                  </div>
                  <div className="flex">
                    {Array.from({ length: lesson.difficulty === 'beginner' ? 1 : lesson.difficulty === 'intermediate' ? 2 : 3 }, (_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{lesson.title}</h3>
                <p className="text-white/70 mb-4">{lesson.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">{lesson.steps.length} steps</span>
                  <ArrowRight className="w-5 h-5 text-white/60" />
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedLesson(null)}
              className="text-white/70 hover:text-white transition-colors"
            >
              ← Back to Lessons
            </button>
          </div>
          <button
            onClick={onExitEducation}
            className="btn-secondary"
          >
            Exit Education
          </button>
        </div>

        {/* Lesson Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">{selectedLesson.title}</h2>
            <div className="text-white/70">
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
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-3">📝 Instructions</h3>
          <p className="text-white/90 text-lg mb-4">{currentStep.instruction}</p>
          
          {currentStep.hint && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-yellow-200">💡 Hint: {currentStep.hint}</p>
            </div>
          )}
        </div>

        {/* Interactive Drum Pattern */}
        {currentStep.expectedPattern && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">🥁 Create Your Pattern</h3>
              <button
                onClick={resetPattern}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

            {/* Step Numbers */}
            <div className="flex gap-2 mb-3 ml-4">
              {Array.from({ length: 16 }, (_, i) => (
                <div
                  key={i}
                  className={`w-12 h-6 flex items-center justify-center text-xs font-mono ${
                    i % 4 === 0 ? 'text-yellow-400' : 'text-white/60'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Pattern Grid */}
            <div className="flex items-center gap-4">
              <div className="w-16 text-white font-medium">Kick</div>
              <div className="flex gap-2">
                {userPattern.map((active, index) => (
                  <button
                    key={index}
                    onClick={() => handleStepToggle(index)}
                    className={`step-button ${active ? 'active' : ''}`}
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

            {/* Pattern Check */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPatternCorrect ? (
                  <>
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">Great job! Pattern is correct!</span>
                  </>
                ) : (
                  <span className="text-white/70">Keep trying... you're doing great!</span>
                )}
              </div>
              
              {isPatternCorrect && (
                <button
                  onClick={nextStep}
                  className="btn-accent flex items-center gap-2"
                >
                  {currentStepIndex < selectedLesson.steps.length - 1 ? 'Next Step' : 'Complete Lesson'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Play Button */}
        <div className="text-center">
          <button className="btn-primary text-lg px-8 py-4 flex items-center gap-3 mx-auto">
            <Play className="w-6 h-6" />
            Play Your Pattern
          </button>
        </div>
      </div>
    </div>
  );
};