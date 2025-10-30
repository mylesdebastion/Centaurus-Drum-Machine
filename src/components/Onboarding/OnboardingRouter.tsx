import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getPersonaFromURL, getReferralFromURL, hasCompletedOnboarding } from '@/utils/personaCodes';
import { trackReferralEvent } from '@/utils/referralTracking';
import { PersonaSelector } from './PersonaSelector';

/**
 * OnboardingRouter - Epic 22 Story 22.1 + 22.3 + Epic 23 Story 23.3
 *
 * Routes users based on:
 * 1. URL params (?v=e → Redirect to /studio with preset)
 * 2. Onboarding completion (redirect to /studio)
 * 3. No params + not completed → PersonaSelector
 *
 * Story 22.3: Tracks visit + referral events
 * Story 23.3: Redirects to Studio with presets instead of separate tutorials
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

      // Story 23.3: Redirect to Studio with preset instead of showing separate tutorial
      const allowedPersonas = ['m', 'e', 'v']; // Only ready personas
      if (allowedPersonas.includes(personaCode)) {
        console.log('[OnboardingRouter] Redirecting to Studio with preset:', personaCode);
        navigate(`/studio?v=${personaCode}&tour=true`);
      }
    }

    // Redirect returning users to Studio
    if (!personaCode && hasCompletedOnboarding()) {
      console.log('[OnboardingRouter] Returning user detected, redirecting to /studio');
      navigate('/studio');
    }
  }, [personaCode, referralCode, navigate]);

  // No persona code → show PersonaSelector
  console.log('[OnboardingRouter] No persona code, rendering PersonaSelector');
  return <PersonaSelector />;
}
