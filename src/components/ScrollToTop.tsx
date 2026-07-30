import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp } from 'lucide-react';
import { IconButton } from './ui/inputs/IconButton';

interface ScrollToTopProps {
  containerId: string;
  threshold?: number;
}

export function ScrollToTop({ containerId, threshold = 300 }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Find the container element
    const element = document.getElementById(containerId);
    if (!element) {
      return;
    }
    setContainer(element);

    const handleScroll = () => {
      setIsVisible(element.scrollTop > threshold);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger check immediately in case the container is already scrolled
    handleScroll();

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [containerId, threshold]);

  // Defensive check: render null if the container is not found in the DOM
  if (!container) {
    return null;
  }

  const handleScrollToTop = () => {
    container.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-6 right-6 z-40"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <IconButton
            icon={<ChevronUp className="w-6 h-6" />}
            onClick={handleScrollToTop}
            aria-label="Scroll to top"
            className="w-12 h-12 bg-white text-[#0f172a] hover:bg-stone-50 hover:text-stone-900 border border-[#e2e8f0] shadow-lg flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#2563eb]/50"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
