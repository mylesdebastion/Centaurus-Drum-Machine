/**
 * Persona URL Code System for Epic 22: Product-Led Growth
 *
 * Discrete URL codes (v=m/d/e/v/p/i) that look like version parameters
 * Referral codes (r=hash) for attribution tracking
 */

import { trackReferralEvent } from './referralTracking';

export type PersonaCode = 'm' | 'd' | 'e' | 'v' | 'p' | 'i';

export interface PersonaConfig {
  code: PersonaCode;
  title: string;
  subtitle: string;
  messagingFocus: string;
  primaryNeed: string;
  tutorialModule: 'drum-machine' | 'chord-arranger' | 'piano-roll' | 'studio-modules';
  shareMessage: string;
  emoji: string;
}

export const PERSONAS: Record<PersonaCode, PersonaConfig> = {
  m: {
    code: 'm',
    title: 'Musician',
    subtitle: 'Browser-based music creation',
    messagingFocus: 'Make music easily',
    primaryNeed: 'Create music in the browser',
    tutorialModule: 'drum-machine',
    shareMessage: 'Check out this browser-based music tool I found!',
    emoji: '🎵',
  },
  d: {
    code: 'd',
    title: 'Deaf/HOH Person',
    subtitle: 'Music for everyone. No hearing required.',
    messagingFocus: 'Accessible music experience',
    primaryNeed: 'Visual music creation',
    tutorialModule: 'piano-roll',
    shareMessage: 'Found an accessible visual music tool - check it out!',
    emoji: '👂',
  },
  e: {
    code: 'e',
    title: 'Educator',
    subtitle: 'Teach music visually',
    messagingFocus: 'Inclusive classroom tools',
    primaryNeed: 'Teaching tools for students',
    tutorialModule: 'chord-arranger',
    shareMessage: 'Great visual music teaching tool for students!',
    emoji: '📚',
  },
  v: {
    code: 'v',
    title: 'Visual Learner',
    subtitle: 'Music for visual thinkers',
    messagingFocus: 'Learn by patterns',
    primaryNeed: 'See music as patterns',
    tutorialModule: 'piano-roll',
    shareMessage: 'This visual music tool makes learning so much easier!',
    emoji: '🎨',
  },
  p: {
    code: 'p',
    title: 'Producer/Beatmaker',
    subtitle: 'Professional DAW in browser',
    messagingFocus: 'Portable production',
    primaryNeed: 'Mobile music production',
    tutorialModule: 'studio-modules',
    shareMessage: 'Portable browser DAW - pretty powerful!',
    emoji: '🎛️',
  },
  i: {
    code: 'i',
    title: 'Enterprise/Institution',
    subtitle: 'Scalable accessible music education',
    messagingFocus: 'Institutional solution',
    primaryNeed: 'Classroom/therapy deployment',
    tutorialModule: 'studio-modules',
    shareMessage: 'Scalable music education platform for institutions',
    emoji: '🏫',
  },
};

/**
 * Parse persona code from URL query params
 */
export function getPersonaFromURL(searchParams: URLSearchParams): PersonaCode | null {
  const code = searchParams.get('v');
  if (code && isValidPersonaCode(code)) {
    return code as PersonaCode;
  }
  return null;
}

/**
 * Parse referral code from URL query params
 */
export function getReferralFromURL(searchParams: URLSearchParams): string | null {
  return searchParams.get('r');
}

/**
 * Type guard for persona codes
 */
export function isValidPersonaCode(code: string): code is PersonaCode {
  return ['m', 'd', 'e', 'v', 'p', 'i'].includes(code);
}

/**
 * Get persona config by code
 */
export function getPersonaConfig(code: PersonaCode): PersonaConfig {
  return PERSONAS[code];
}

/**
 * Build share URL with persona and referral codes
 */
export function buildShareURL(personaCode: PersonaCode, referralHash?: string): string {
  const baseURL = window.location.origin;
  const params = new URLSearchParams();
  params.set('v', personaCode);
  if (referralHash) {
    params.set('r', referralHash);
  }
  return `${baseURL}?${params.toString()}`;
}

/**
 * Track persona analytics event
 * @deprecated Use trackReferralEvent from referralTracking.ts instead (Story 22.3)
 */
export function trackPersonaEvent(
  event: 'tutorial_started' | 'tutorial_completed' | 'share_clicked' | 'converted_to_pro',
  personaCode: PersonaCode,
  metadata?: Record<string, any>
) {
  // Wrapper for backward compatibility - calls trackReferralEvent
  trackReferralEvent(event, personaCode, metadata?.referral, metadata);
}

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem('audiolux_onboarding_completed') === 'true';
}

/**
 * Mark onboarding as completed
 */
export function setOnboardingCompleted(personaCode?: PersonaCode) {
  localStorage.setItem('audiolux_onboarding_completed', 'true');
  if (personaCode) {
    localStorage.setItem('audiolux_persona', personaCode);
  }
}

/**
 * Get user's persona (if set)
 */
export function getUserPersona(): PersonaCode | null {
  const code = localStorage.getItem('audiolux_persona');
  if (code && isValidPersonaCode(code)) {
    return code as PersonaCode;
  }
  return null;
}
