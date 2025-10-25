import { X, Copy, Check, Send, MessageCircle, Mail } from 'lucide-react';
import { useState } from 'react';
import { PersonaCode, getPersonaConfig, buildShareURL, getUserPersona } from '@/utils/personaCodes';
import { trackReferralEvent } from '@/utils/referralTracking';

interface ShareSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  personaOverride?: PersonaCode; // Optional: specify persona if different from user's
}

/**
 * ShareSessionModal - Epic 22 Story 22.4
 *
 * Viral loop trigger shown after key activation moments:
 * - Tutorial completion
 * - First session created
 * - Milestone achievements (optional)
 *
 * Features:
 * - Persona-specific share copy
 * - Quick share buttons (WhatsApp, Email, Discord, Copy)
 * - Gamification (share count badge)
 * - Referral URL with user's hash
 */
export function ShareSessionModal({ isOpen, onClose, personaOverride }: ShareSessionModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const personaCode = personaOverride || getUserPersona() || 'm'; // Default to Musician
  const persona = getPersonaConfig(personaCode);

  // Generate user's referral hash (simple hash from sessionId for demo)
  const sessionId = sessionStorage.getItem('audiolux_session_id') || 'default';
  const userHash = sessionId.slice(-4);

  // Build share URL with user's referral code
  const shareURL = buildShareURL(personaCode, userHash);

  // Persona-specific share messages
  const shareMessages: Record<PersonaCode, { heading: string; message: string }> = {
    m: {
      heading: 'Share with fellow musicians',
      message: `Check out this browser-based music creation tool I found! No installation, just open and play: ${shareURL}`,
    },
    d: {
      heading: 'Share this accessible music tool',
      message: `Found an amazing visual music tool - no hearing required! Perfect for Deaf/HOH musicians: ${shareURL}`,
    },
    e: {
      heading: 'Invite your students',
      message: `I'm using this visual music teaching tool in my classroom! Perfect for inclusive music education: ${shareURL}`,
    },
    v: {
      heading: 'Share with visual learners',
      message: `This visual music tool makes learning so much easier! See patterns and colors, not just notes: ${shareURL}`,
    },
    p: {
      heading: 'Share with producers',
      message: `Portable browser DAW with MIDI support - pretty powerful! No installation needed: ${shareURL}`,
    },
    i: {
      heading: 'Share with institutions',
      message: `Scalable accessible music education platform for schools and therapy centers: ${shareURL}`,
    },
  };

  const shareData = shareMessages[personaCode];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareURL);
    setCopied(true);
    trackReferralEvent('share_clicked', personaCode, undefined, { platform: 'Copy Link' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    trackReferralEvent('share_clicked', personaCode, undefined, { platform: 'WhatsApp' });
    const encodedMessage = encodeURIComponent(shareData.message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleEmail = () => {
    trackReferralEvent('share_clicked', personaCode, undefined, { platform: 'Email' });
    const subject = encodeURIComponent('Check out Audiolux!');
    const body = encodeURIComponent(shareData.message);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleDiscord = () => {
    trackReferralEvent('share_clicked', personaCode, undefined, { platform: 'Discord' });
    // Copy to clipboard and show instructions
    navigator.clipboard.writeText(shareData.message);
    alert('Message copied! Paste it into your Discord server or DM.');
  };

  // Get share count from localStorage (gamification)
  const getShareCount = (): number => {
    const events = JSON.parse(localStorage.getItem('audiolux_analytics_events') || '[]');
    return events.filter((e: any) => e.event === 'share_clicked').length;
  };

  const shareCount = getShareCount();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl border-2 border-primary-500/50 max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {persona.emoji} {shareData.heading}
            </h2>
            {shareCount > 0 && (
              <p className="text-sm text-gray-400 mt-1">
                🌟 You've shared {shareCount} time{shareCount > 1 ? 's' : ''}!
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 mb-6">{shareData.message}</p>

          {/* Share URL */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 mb-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">Your personal link:</p>
                <p className="text-sm text-primary-400 font-mono truncate">{shareURL}</p>
              </div>
              <button
                onClick={handleCopy}
                className={`flex-shrink-0 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-primary-600 hover:bg-primary-500 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <button
              onClick={handleWhatsApp}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-lg transition-colors flex flex-col items-center gap-2 text-sm font-semibold"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </button>

            <button
              onClick={handleEmail}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-lg transition-colors flex flex-col items-center gap-2 text-sm font-semibold"
            >
              <Mail className="w-5 h-5" />
              Email
            </button>

            <button
              onClick={handleDiscord}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-lg transition-colors flex flex-col items-center gap-2 text-sm font-semibold"
            >
              <Send className="w-5 h-5" />
              Discord
            </button>

            <button
              onClick={handleCopy}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors flex flex-col items-center gap-2 text-sm font-semibold"
            >
              <Copy className="w-5 h-5" />
              Copy Link
            </button>
          </div>

          {/* Gamification Badges */}
          {shareCount >= 3 && (
            <div className="bg-gradient-to-r from-primary-900/30 to-accent-900/30 rounded-lg border border-primary-500/50 p-4 text-center">
              <p className="text-lg font-bold text-white mb-1">🏆 Community Builder</p>
              <p className="text-sm text-gray-300">
                You've shared with {shareCount} people! Keep spreading the music love.
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
