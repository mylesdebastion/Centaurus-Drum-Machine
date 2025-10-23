import React, { useState, useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';

interface Announcement {
  id: string;
  message: string;
  link?: string;
  linkText?: string;
  icon?: 'discord' | 'info';
}

interface AnnouncementBannerProps {
  announcement: Announcement;
}

const STORAGE_KEY = 'audiolux-dismissed-notices';

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ announcement }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if this announcement has been dismissed
    const dismissedNotices = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const isDismissed = dismissedNotices.includes(announcement.id);
    setIsVisible(!isDismissed);
  }, [announcement.id]);

  const handleDismiss = () => {
    // Add to dismissed notices
    const dismissedNotices = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    dismissedNotices.push(announcement.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissedNotices));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary-900/95 to-accent-900/95 backdrop-blur-sm border-t border-primary-500/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {announcement.icon === 'discord' && (
              <MessageSquare className="w-5 h-5 text-primary-400 flex-shrink-0" />
            )}
            <p className="text-sm sm:text-base text-white">
              {announcement.message}
            </p>
            {announcement.link && announcement.linkText && (
              <a
                href={announcement.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm sm:text-base font-semibold text-primary-300 hover:text-primary-200 underline transition-colors whitespace-nowrap"
              >
                {announcement.linkText} →
              </a>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-primary-800/50 rounded-lg transition-colors flex-shrink-0"
            aria-label="Dismiss announcement"
          >
            <X className="w-5 h-5 text-primary-300 hover:text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
