import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import NewsletterSignup from '@/components/NewsletterSignup';

export default function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    // Check if popup has already been shown in this session
    const popupShown = sessionStorage.getItem('newsletterPopupShown');
    if (popupShown) {
      setHasBeenShown(true);
      return;
    }

    const handleScroll = () => {
      // Show popup after scrolling 50% of the page
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      if (scrollPercentage > 50 && !hasBeenShown) {
        setIsVisible(true);
        setHasBeenShown(true);
        sessionStorage.setItem('newsletterPopupShown', 'true');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasBeenShown]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-300"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full p-8 pointer-events-auto animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          </button>

          {/* Content */}
          <div className="mb-6">
            <h2 className="text-2xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
              Stay Connected
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              Join our monthly mailing list for insights on embodied transformation, conscious leadership, and the rise of her.
            </p>
          </div>

          {/* Newsletter Form */}
          <NewsletterSignup variant="modal" />

          {/* Footer Note */}
          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-4">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </>
  );
}
