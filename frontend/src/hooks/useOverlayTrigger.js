// hooks/useOverlayTrigger.js
import { useState, useRef, useCallback } from 'react';

export const useOverlayTrigger = (delay = 100) => {
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const showTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  const showOverlay = useCallback(() => {
    clearTimeout(hideTimeoutRef.current);
    clearTimeout(showTimeoutRef.current);
    
    showTimeoutRef.current = setTimeout(() => {
      setIsOverlayVisible(true);
    }, delay);
  }, [delay]);

  const hideOverlay = useCallback(() => {
    clearTimeout(showTimeoutRef.current);
    
    hideTimeoutRef.current = setTimeout(() => {
      setIsOverlayVisible(false);
    }, delay);
  }, [delay]);

  const cancelHide = useCallback(() => {
    clearTimeout(hideTimeoutRef.current);
  }, []);

  return {
    isOverlayVisible,
    showOverlay,
    hideOverlay,
    cancelHide,
  };
};