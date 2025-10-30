/**
 * StudioTourOverlay - Story 23.2 (iOS-Style Tooltips)
 *
 * Lightweight tooltip system positioned next to actual UI elements.
 * NO backdrop, NO modals - just small tooltips that guide actions.
 */

import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Check } from 'lucide-react';
import type { TourStep } from '../../config/studioPresets';

interface StudioTourOverlayProps {
  steps: TourStep[];
  presetId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export const StudioTourOverlay: React.FC<StudioTourOverlayProps> = ({
  steps,
  presetId,
  onComplete,
  onSkip,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<React.CSSProperties>({});

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Highlight target element when step changes
  useEffect(() => {
    if (currentStep.targetSelector) {
      // Wait a bit for the module to render (if it was just added)
      const timeoutId = setTimeout(() => {
        const element = document.querySelector(currentStep.targetSelector!) as HTMLElement;
        if (element) {
          setHighlightedElement(element);
          // Scroll element into view
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      // For welcome/completion steps, show tooltip in top-right corner
      setHighlightedElement(null);
    }
  }, [currentStep]);

  // Calculate tooltip position next to highlighted element
  useEffect(() => {
    if (!highlightedElement && currentStep.placement !== 'center') {
      // Non-modal welcome/completion: position in top-right corner
      setTooltipPosition({
        position: 'fixed',
        top: '80px', // Below header
        right: '24px',
        zIndex: 60,
      });
      return;
    }

    if (highlightedElement) {
      const updatePosition = () => {
        const rect = highlightedElement.getBoundingClientRect();
        const placement = currentStep.placement || 'bottom';
        const offset = 12; // Smaller gap for compact tooltips

        let newPosition: React.CSSProperties = { position: 'fixed', zIndex: 60 };

        switch (placement) {
          case 'top':
            newPosition = {
              ...newPosition,
              left: `${rect.left + rect.width / 2}px`,
              bottom: `${window.innerHeight - rect.top + offset}px`,
              transform: 'translateX(-50%)',
            };
            break;
          case 'right':
            newPosition = {
              ...newPosition,
              left: `${rect.right + offset}px`,
              top: `${rect.top + rect.height / 2}px`,
              transform: 'translateY(-50%)',
            };
            break;
          case 'left':
            newPosition = {
              ...newPosition,
              right: `${window.innerWidth - rect.left + offset}px`,
              top: `${rect.top + rect.height / 2}px`,
              transform: 'translateY(-50%)',
            };
            break;
          case 'bottom':
          default:
            newPosition = {
              ...newPosition,
              left: `${rect.left + rect.width / 2}px`,
              top: `${rect.bottom + offset}px`,
              transform: 'translateX(-50%)',
            };
            break;
        }

        setTooltipPosition(newPosition);
      };

      updatePosition();

      // Update position on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [highlightedElement, currentStep]);

  // Listen for user interaction on highlighted element (if action='click')
  useEffect(() => {
    if (currentStep.action === 'click' && highlightedElement) {
      const handleInteraction = () => {
        // User clicked the highlighted element - advance to next step
        handleNext();
      };

      highlightedElement.addEventListener('click', handleInteraction);
      return () => highlightedElement.removeEventListener('click', handleInteraction);
    }
  }, [currentStep, highlightedElement]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleComplete = () => {
    // Save completion to localStorage
    localStorage.setItem(`hasCompletedTour_${presetId}`, 'true');
    onComplete();
  };

  const handleSkipClick = () => {
    // Still mark as completed so user doesn't see it again
    localStorage.setItem(`hasCompletedTour_${presetId}`, 'true');
    onSkip();
  };

  // Get arrow direction based on placement
  const getArrowClasses = () => {
    if (!highlightedElement) return '';

    const placement = currentStep.placement || 'bottom';
    const baseClasses = 'absolute w-0 h-0 border-solid';

    switch (placement) {
      case 'top':
        return `${baseClasses} border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-800 left-1/2 -translate-x-1/2 -bottom-2`;
      case 'right':
        return `${baseClasses} border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-gray-800 top-1/2 -translate-y-1/2 -left-2`;
      case 'left':
        return `${baseClasses} border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-gray-800 top-1/2 -translate-y-1/2 -right-2`;
      case 'bottom':
      default:
        return `${baseClasses} border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-gray-800 left-1/2 -translate-x-1/2 -top-2`;
    }
  };

  return (
    <>
      {/* Subtle highlight ring (NO backdrop) */}
      {highlightedElement && (
        <div
          className="fixed pointer-events-none z-50 rounded-lg ring-2 ring-primary-500/60 ring-offset-2 ring-offset-transparent"
          style={{
            left: highlightedElement.getBoundingClientRect().left - 2,
            top: highlightedElement.getBoundingClientRect().top - 2,
            width: highlightedElement.getBoundingClientRect().width + 4,
            height: highlightedElement.getBoundingClientRect().height + 4,
          }}
        />
      )}

      {/* Compact tooltip positioned next to element */}
      <div
        className="bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl max-w-xs relative"
        style={tooltipPosition}
      >
        {/* Arrow pointer to element */}
        {highlightedElement && (
          <div className={getArrowClasses()} />
        )}

        {/* Progress bar */}
        <div className="w-full h-0.5 bg-gray-700 rounded-t-lg overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-semibold text-white pr-4">{currentStep.title}</h3>
            <button
              onClick={handleSkipClick}
              className="p-0.5 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
              aria-label="Skip tour"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <p className="text-xs text-gray-300 mb-3 leading-relaxed">{currentStep.content}</p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            {/* Step dots */}
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 w-1 rounded-full transition-colors ${
                    index === currentStepIndex
                      ? 'bg-primary-500'
                      : index < currentStepIndex
                      ? 'bg-green-500'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Action button */}
            {currentStep.action === 'none' && (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs rounded-md transition-colors font-medium"
              >
                {isLastStep ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Got it!</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}

            {/* Click instruction */}
            {currentStep.action === 'click' && (
              <div className="text-xs text-primary-400 font-medium animate-pulse">
                Try it! →
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
