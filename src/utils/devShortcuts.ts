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
  // Clear onboarding flags
  localStorage.removeItem('audiolux_onboarding_completed');
  localStorage.removeItem('audiolux_persona');

  // Clear analytics events (optional - comment out to keep analytics)
  localStorage.removeItem('audiolux_analytics_events');
  localStorage.removeItem('audiolux_persona_analytics'); // Old key from Story 22.1

  // Clear session storage
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
  const analyticsEvents = JSON.parse(localStorage.getItem('audiolux_analytics_events') || '[]');

  console.log('📊 Onboarding State:');
  console.log('  Completed:', completed === 'true' ? '✅' : '❌');
  console.log('  Persona:', persona || 'None');
  console.log('  Analytics Events:', analyticsEvents.length);

  return {
    completed: completed === 'true',
    persona,
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
