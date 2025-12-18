import { createContext, useContext, useEffect, useRef, useState } from "react";

const OverlayContext = createContext();

export const useOverlay = () => useContext(OverlayContext);

export const OverlayProvider = ({ children }) => {
  const [overlayContent, setOverlayContent] = useState(null);
  const [overlayPosition, setOverlayPosition] = useState({});
  const [overlayVisible, setOverlayVisible] = useState(false);

  const showTimeoutRef = useRef(null);
  const currentRequestId = useRef(0);
  const overlayRef = useRef(null);

  const SHOW_DELAY = 100;
  const HIDE_DELAY = 0;

  const clearShowTimeout = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
  };

  const showOverlay = (content, position) => {
    const requestId = ++currentRequestId.current;

    clearShowTimeout();

    showTimeoutRef.current = setTimeout(() => {
      if (currentRequestId.current === requestId) {
        setOverlayContent(content);
        setOverlayPosition(position);
        setOverlayVisible(true);
      }
    }, SHOW_DELAY);
  };

  const hideOverlay = (immediate = true) => {
    clearShowTimeout();

    if (immediate) {
      setOverlayVisible(false);
      setOverlayContent(null);
    } else {
      setTimeout(() => {
        setOverlayVisible(false);
        setOverlayContent(null);
      }, HIDE_DELAY);
    }
  };

  useEffect(() => {
    return () => {
      clearShowTimeout();
    };
  }, []);

  return (
    <OverlayContext.Provider
      value={{
        showOverlay,
        hideOverlay,
        clearShowTimeout,
      }}
    >
      {children}

      {/* Overlay global - positionné au-dessus */}
      {overlayVisible && overlayContent && (
        <div
          ref={overlayRef}
          className="global-overlay"
          style={{
            position: "fixed",
            left: `${overlayPosition.left}px`,
            top: `${overlayPosition.top}px`,
            transform: overlayPosition.transform || "translateY(-50%)",
            zIndex: 999999,
            pointerEvents: "auto",
            minWidth: "250px",
            maxWidth: "300px",
          }}
          onMouseEnter={() => {
            // Garde l'overlay ouvert quand la souris est dessus
          }}
          onMouseLeave={() => {
            hideOverlay(true);
          }}
        >
          {overlayContent}
        </div>
      )}
    </OverlayContext.Provider>
  );
};
