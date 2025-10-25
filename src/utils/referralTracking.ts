/**
 * Referral Attribution & Analytics - Epic 22 Story 22.3
 *
 * Tracks persona codes (?v=) and referral codes (?r=) from URL params
 * Stores analytics events in localStorage
 * Provides CSV export for weekly analysis
 */

import { PersonaCode } from './personaCodes';

export interface AnalyticsEvent {
  event: 'visit' | 'tutorial_started' | 'tutorial_completed' | 'share_clicked' | 'converted_to_pro';
  persona?: PersonaCode;
  referral?: string;
  timestamp: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface PersonaStats {
  persona: PersonaCode;
  visits: number;
  tutorialStarts: number;
  tutorialCompletions: number;
  completionRate: number; // tutorialCompletions / tutorialStarts
  shareClicks: number;
  shareRate: number; // shareClicks / tutorialCompletions
}

export interface ReferralStats {
  referral: string;
  persona?: PersonaCode;
  visits: number;
  tutorialCompletions: number;
  conversionRate: number; // tutorialCompletions / visits
}

/**
 * Generate a session ID for tracking user journeys
 */
export function getSessionId(): string {
  const key = 'audiolux_session_id';
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

/**
 * Track analytics event (localStorage for now, Story 22.3 could add Supabase)
 */
export function trackReferralEvent(
  event: AnalyticsEvent['event'],
  persona?: PersonaCode,
  referral?: string,
  metadata?: Record<string, any>
) {
  const analyticsEvent: AnalyticsEvent = {
    event,
    persona,
    referral,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    metadata,
  };

  // Store in localStorage
  const key = 'audiolux_analytics_events';
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push(analyticsEvent);
  localStorage.setItem(key, JSON.stringify(existing));

  console.log('[Referral Analytics]', analyticsEvent);
}

/**
 * Get all analytics events
 */
export function getAnalyticsEvents(): AnalyticsEvent[] {
  const key = 'audiolux_analytics_events';
  return JSON.parse(localStorage.getItem(key) || '[]');
}

/**
 * Get persona statistics
 */
export function getPersonaStats(): PersonaStats[] {
  const events = getAnalyticsEvents();
  const personaMap = new Map<PersonaCode, PersonaStats>();

  // Initialize stats for each persona
  const personas: PersonaCode[] = ['m', 'd', 'e', 'v', 'p', 'i'];
  personas.forEach((persona) => {
    personaMap.set(persona, {
      persona,
      visits: 0,
      tutorialStarts: 0,
      tutorialCompletions: 0,
      completionRate: 0,
      shareClicks: 0,
      shareRate: 0,
    });
  });

  // Count events by persona
  events.forEach((event) => {
    if (!event.persona) return;

    const stats = personaMap.get(event.persona);
    if (!stats) return;

    switch (event.event) {
      case 'visit':
        stats.visits++;
        break;
      case 'tutorial_started':
        stats.tutorialStarts++;
        break;
      case 'tutorial_completed':
        stats.tutorialCompletions++;
        break;
      case 'share_clicked':
        stats.shareClicks++;
        break;
    }
  });

  // Calculate rates
  personaMap.forEach((stats) => {
    if (stats.tutorialStarts > 0) {
      stats.completionRate = stats.tutorialCompletions / stats.tutorialStarts;
    }
    if (stats.tutorialCompletions > 0) {
      stats.shareRate = stats.shareClicks / stats.tutorialCompletions;
    }
  });

  return Array.from(personaMap.values()).filter((stats) => stats.visits > 0);
}

/**
 * Get referral statistics
 */
export function getReferralStats(): ReferralStats[] {
  const events = getAnalyticsEvents();
  const referralMap = new Map<string, ReferralStats>();

  events.forEach((event) => {
    if (!event.referral) return;

    if (!referralMap.has(event.referral)) {
      referralMap.set(event.referral, {
        referral: event.referral,
        persona: event.persona,
        visits: 0,
        tutorialCompletions: 0,
        conversionRate: 0,
      });
    }

    const stats = referralMap.get(event.referral)!;

    switch (event.event) {
      case 'visit':
        stats.visits++;
        break;
      case 'tutorial_completed':
        stats.tutorialCompletions++;
        break;
    }
  });

  // Calculate conversion rates
  referralMap.forEach((stats) => {
    if (stats.visits > 0) {
      stats.conversionRate = stats.tutorialCompletions / stats.visits;
    }
  });

  return Array.from(referralMap.values()).sort((a, b) => b.visits - a.visits);
}

/**
 * Export analytics to CSV format
 */
export function exportAnalyticsCSV(): string {
  const events = getAnalyticsEvents();

  // CSV header
  const header = 'timestamp,event,persona,referral,sessionId,metadata';
  const rows = events.map((event) => {
    const metadata = event.metadata ? JSON.stringify(event.metadata) : '';
    return `${event.timestamp},${event.event},${event.persona || ''},${event.referral || ''},${event.sessionId},"${metadata}"`;
  });

  return [header, ...rows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadAnalyticsCSV() {
  const csv = exportAnalyticsCSV();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audiolux-analytics-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Clear all analytics data (for testing/reset)
 */
export function clearAnalytics() {
  localStorage.removeItem('audiolux_analytics_events');
  localStorage.removeItem('audiolux_persona_analytics'); // Old key from Story 22.1
  console.log('[Analytics] Cleared all data');
}
