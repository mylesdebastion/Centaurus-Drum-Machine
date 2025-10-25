import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getPersonaFromURL, getReferralFromURL, hasCompletedOnboarding } from '@/utils/personaCodes';
import { trackReferralEvent } from '@/utils/referralTracking';
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

  console.log('[OnboardingRouter] Render - personaCode:', personaCode, 'completed:', hasCompletedOnboarding());

  useEffect(() => {
    console.log('[OnboardingRouter] useEffect - personaCode:', personaCode, 'referralCode:', referralCode);

    // Track visit event (Story 22.3)
    if (personaCode) {
      console.log('[OnboardingRouter] Tracking visit event for persona:', personaCode);
      trackReferralEvent('visit', personaCode, referralCode || undefined);
    }

    // Redirect returning users to Studio
    if (!personaCode && hasCompletedOnboarding()) {
      console.log('[OnboardingRouter] Returning user detected, redirecting to /studio');
      navigate('/studio');
    }
  }, [personaCode, referralCode, navigate]);

  // User has persona code → show specific tutorial
  if (personaCode) {
    console.log('[OnboardingRouter] Rendering tutorial for persona:', personaCode);
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
  console.log('[OnboardingRouter] No persona code, rendering PersonaSelector');
  return <PersonaSelector />;
}
