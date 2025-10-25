/**
 * Developer Shortcuts - Epic 22 Testing Utils
 *
 * Quick reset functions for testing onboarding flows
 */

/**
 * Reset all onboarding flags and analytics data
 * Useful for testing persona selection and tutorial flows
 */
export function resetOnboarding() {
  console.log('🔄 [resetOnboarding] Starting reset...');

  // Clear onboarding flags
  console.log('  Removing: audiolux_onboarding_completed');
  localStorage.removeItem('audiolux_onboarding_completed');

  console.log('  Removing: audiolux_persona');
  localStorage.removeItem('audiolux_persona');

  // Clear analytics events (optional - comment out to keep analytics)
  console.log('  Removing: audiolux_analytics_events');
  localStorage.removeItem('audiolux_analytics_events');

  console.log('  Removing: audiolux_persona_analytics (old key)');
  localStorage.removeItem('audiolux_persona_analytics'); // Old key from Story 22.1

  // Clear session storage
  console.log('  Removing: audiolux_session_id (sessionStorage)');
  sessionStorage.removeItem('audiolux_session_id');

  console.log('✅ Onboarding reset complete! Refresh to see PersonaSelector.');
  console.log('Cleared: onboarding flags, persona, analytics, session ID');

  return true;
}

/**
 * Reset only onboarding completion flag (keep persona and analytics)
 */
export function resetOnboardingKeepData() {
  localStorage.removeItem('audiolux_onboarding_completed');
  console.log('✅ Onboarding completion flag cleared. Refresh to re-run onboarding.');
  return true;
}

/**
 * Clear all analytics data (keep onboarding flags)
 */
export function clearAnalytics() {
  localStorage.removeItem('audiolux_analytics_events');
  localStorage.removeItem('audiolux_persona_analytics');
  console.log('✅ Analytics data cleared.');
  return true;
}

/**
 * Show current onboarding state
 */
export function showOnboardingState() {
  const completed = localStorage.getItem('audiolux_onboarding_completed');
  const persona = localStorage.getItem('audiolux_persona');
  const sessionId = sessionStorage.getItem('audiolux_session_id');
  const analyticsEvents = JSON.parse(localStorage.getItem('audiolux_analytics_events') || '[]');

  console.log('📊 Onboarding State:');
  console.log('  audiolux_onboarding_completed:', completed === 'true' ? '✅ true' : '❌ ' + (completed || 'null'));
  console.log('  audiolux_persona:', persona || '(none)');
  console.log('  audiolux_session_id:', sessionId || '(none)');
  console.log('  audiolux_analytics_events:', analyticsEvents.length, 'events');
  console.log('  Raw localStorage keys:', Object.keys(localStorage).filter(k => k.startsWith('audiolux_')));

  return {
    completed: completed === 'true',
    persona,
    sessionId,
    eventCount: analyticsEvents.length,
  };
}

// Export to window for console access
if (typeof window !== 'undefined') {
  (window as any).resetOnboarding = resetOnboarding;
  (window as any).resetOnboardingKeepData = resetOnboardingKeepData;
  (window as any).clearAnalytics = clearAnalytics;
  (window as any).showOnboardingState = showOnboardingState;
}
