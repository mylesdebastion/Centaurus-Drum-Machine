import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getPersonaFromURL, getReferralFromURL, hasCompletedOnboarding } from '@/utils/personaCodes';
import { trackReferralEvent } from '@/utils/referralTracking';
import { resetOnboarding } from '@/utils/devShortcuts';
import { PersonaSelector } from './PersonaSelector';
import { MusicianTutorial } from './tutorials/MusicianTutorial';
import { EducatorTutorial } from './tutorials/EducatorTutorial';
import { VisualLearnerTutorial } from './tutorials/VisualLearnerTutorial';
import { ProducerTutorial } from './tutorials/ProducerTutorial';

/**
 * OnboardingRouter - Epic 22 Story 22.1 + 22.3
 *
 * Routes users based on:
 * 1. URL params (?v=e → Educator tutorial)
 * 2. Onboarding completion (redirect to /studio)
 * 3. No params + not completed → PersonaSelector
 *
 * Story 22.3: Tracks visit + referral events
 */
export function OnboardingRouter() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const personaCode = getPersonaFromURL(searchParams);
  const referralCode = getReferralFromURL(searchParams);

  useEffect(() => {
    // Track visit event (Story 22.3)
    if (personaCode) {
      trackReferralEvent('visit', personaCode, referralCode || undefined);
    }

    // Redirect returning users to Studio
    if (!personaCode && hasCompletedOnboarding()) {
      console.log('[OnboardingRouter] Returning user detected, redirecting to /studio');
      navigate('/studio');
    }

    // Dev shortcut: Ctrl+Shift+R to reset onboarding
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        resetOnboarding();
        window.location.reload();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [personaCode, referralCode, navigate]);

  // User has persona code → show specific tutorial
  if (personaCode) {
    switch (personaCode) {
      case 'm':
        return <MusicianTutorial />;
      case 'e':
        return <EducatorTutorial />;
      case 'v':
        return <VisualLearnerTutorial />;
      case 'p':
        return <ProducerTutorial />;
      case 'd':
      case 'i':
        // Week 2/3 personas - fallback to PersonaSelector for now
        return <PersonaSelector />;
      default:
        return <PersonaSelector />;
    }
  }

  // No persona code → show PersonaSelector
  return <PersonaSelector />;
}
