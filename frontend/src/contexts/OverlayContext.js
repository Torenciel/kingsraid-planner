import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

const OverlayContext = createContext();

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error("useOverlay must be used within OverlayProvider");
  }
  return context;
};

export const OverlayProvider = ({ children }) => {
  const [overlayContent, setOverlayContent] = useState(null);
  const [overlayPosition, setOverlayPosition] = useState({});
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayType, setOverlayType] = useState(null);
  const [overlayData, setOverlayData] = useState(null);

  const showTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const currentRequestId = useRef(0);
  const overlayRef = useRef(null);

  const SHOW_DELAY = 100;
  const HIDE_DELAY = 100;

  // Types d'overlays supportés
  const OVERLAY_TYPES = {
    ITEM_INFO: 'item_info',
    HERO_INFO: 'hero_info',
    TEAM_INFO: 'team_info',
    STATS_INFO: 'stats_info',
    COMPARE_INFO: 'compare_info',
    TOOLTIP: 'tooltip',
    CONTEXT_MENU: 'context_menu'
  };

  const clearShowTimeout = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
  };

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const showOverlay = useCallback((content, position, type = OVERLAY_TYPES.ITEM_INFO, data = null) => {
    const requestId = ++currentRequestId.current;

    clearShowTimeout();
    clearHideTimeout();

    showTimeoutRef.current = setTimeout(() => {
      if (currentRequestId.current === requestId) {
        setOverlayContent(content);
        setOverlayPosition(position);
        setOverlayType(type);
        setOverlayData(data);
        setOverlayVisible(true);
      }
    }, SHOW_DELAY);
  }, []);

  const hideOverlay = useCallback((immediate = true) => {
    clearShowTimeout();
    clearHideTimeout();

    if (immediate) {
      setOverlayVisible(false);
      setOverlayContent(null);
      setOverlayType(null);
      setOverlayData(null);
    } else {
      hideTimeoutRef.current = setTimeout(() => {
        setOverlayVisible(false);
        setOverlayContent(null);
        setOverlayType(null);
        setOverlayData(null);
      }, HIDE_DELAY);
    }
  }, []);

  // Fonctions spécifiques pour le nouveau système

  // Overlay pour info d'artefact
  const showArtifactOverlay = useCallback((artifact, stars = 0, position) => {
    const content = (
      <div className="artifact-overlay">
        <h4>{artifact.name}</h4>
        <div className="overlay-stars">Stars: {stars}</div>
        {artifact.description && (
          <p className="overlay-description">{artifact.description}</p>
        )}
        {artifact.values && renderArtifactValues(artifact.values, stars)}
      </div>
    );

    showOverlay(content, position, OVERLAY_TYPES.ITEM_INFO, {
      itemType: 'artifact',
      item: artifact,
      stars
    });
  }, [showOverlay]);

  // Overlay pour info de gear set
  const showGearSetOverlay = useCallback((gearSet, pieces = 0, position) => {
    const content = (
      <div className="gearset-overlay">
        <h4>{gearSet.name}</h4>
        <div className="overlay-pieces">Pieces: {pieces}/4</div>
        {gearSet.bonus2P && (
          <div className="overlay-bonus">
            <strong>2-Piece Bonus:</strong>
            <p>{gearSet.bonus2P}</p>
          </div>
        )}
        {gearSet.bonus4P && pieces >= 4 && (
          <div className="overlay-bonus">
            <strong>4-Piece Bonus:</strong>
            <p>{gearSet.bonus4P}</p>
          </div>
        )}
      </div>
    );

    showOverlay(content, position, OVERLAY_TYPES.ITEM_INFO, {
      itemType: 'gearset',
      item: gearSet,
      pieces
    });
  }, [showOverlay]);

  // Overlay pour info de héros
  const showHeroOverlay = useCallback((hero, position) => {
    const content = (
      <div className="hero-overlay">
        <div className="overlay-header">
          <h4>{hero.name}</h4>
          <span className="hero-class">{hero.role || hero.class}</span>
        </div>
        <div className="overlay-stats">
          {hero.position && (
            <div className="stat">
              <strong>Position:</strong> {hero.position}
            </div>
          )}
          {hero.hasUW !== undefined && (
            <div className="stat">
              <strong>Has UW:</strong> {hero.hasUW ? 'Yes' : 'No'}
            </div>
          )}
          {hero.hasSW !== undefined && (
            <div className="stat">
              <strong>Has SW:</strong> {hero.hasSW ? 'Yes' : 'No'}
            </div>
          )}
          {hero.utsCount !== undefined && (
            <div className="stat">
              <strong>UTs:</strong> {hero.utsCount}
            </div>
          )}
        </div>
      </div>
    );

    showOverlay(content, position, OVERLAY_TYPES.HERO_INFO, {
      hero,
      heroSlug: hero.slug
    });
  }, [showOverlay]);

  // Overlay pour info de perk
  const showPerkOverlay = useCallback((perk, position) => {
    const content = (
      <div className="perk-overlay">
        <div className="overlay-header">
          <h4>{perk.name}</h4>
          <span className="perk-tier">T{perk.tier?.charAt(1)}</span>
        </div>
        {perk.class && perk.class !== 'General' && (
          <div className="perk-class">
            <strong>Class:</strong> {perk.class}
          </div>
        )}
        {perk.description && (
          <p className="overlay-description">{perk.description}</p>
        )}
        {perk.heroSlug && (
          <div className="perk-hero">
            <small>Hero-specific: {perk.heroSlug}</small>
          </div>
        )}
      </div>
    );

    showOverlay(content, position, OVERLAY_TYPES.ITEM_INFO, {
      itemType: 'perk',
      item: perk
    });
  }, [showOverlay]);

  // Overlay pour stats d'équipe
  const showTeamStatsOverlay = useCallback((teamStats, position) => {
    const content = (
      <div className="team-stats-overlay">
        <h4>Team Statistics</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <strong>Heroes:</strong> {teamStats.totalHeroes}
          </div>
          <div className="stat-item">
            <strong>UW Stars:</strong> {teamStats.totalUWStars}
          </div>
          <div className="stat-item">
            <strong>UT Stars:</strong> {teamStats.totalUTStars}
          </div>
          <div className="stat-item">
            <strong>Artifact Stars:</strong> {teamStats.totalArtifactStars}
          </div>
          <div className="stat-item">
            <strong>Transcendence:</strong> {teamStats.totalTranscendence}
          </div>
          <div className="stat-item">
            <strong>SW Heroes:</strong> {teamStats.hasSW}
          </div>
        </div>
        {teamStats.classes && Object.keys(teamStats.classes).length > 0 && (
          <div className="classes-section">
            <h5>Classes:</h5>
            <div className="classes-list">
              {Object.entries(teamStats.classes).map(([className, count]) => (
                <div key={className} className="class-item">
                  {className}: {count}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );

    showOverlay(content, position, OVERLAY_TYPES.STATS_INFO, teamStats);
  }, [showOverlay]);

  // Overlay pour comparaison d'items
  const showCompareOverlay = useCallback((itemA, itemB, position) => {
    const content = (
      <div className="compare-overlay">
        <h4>Comparison</h4>
        <div className="compare-grid">
          <div className="compare-item">
            <h5>{itemA.name}</h5>
            {renderItemStats(itemA)}
          </div>
          <div className="compare-vs">VS</div>
          <div className="compare-item">
            <h5>{itemB.name}</h5>
            {renderItemStats(itemB)}
          </div>
        </div>
      </div>
    );

    showOverlay(content, position, OVERLAY_TYPES.COMPARE_INFO, { itemA, itemB });
  }, [showOverlay]);

  // Fonction pour rendre les valeurs d'artefact
  const renderArtifactValues = (values, stars) => {
    if (!values || typeof values !== 'object') return null;

    return (
      <div className="artifact-values">
        <h5>Stats at {stars} stars:</h5>
        <ul>
          {Object.entries(values).map(([key, starValues]) => {
            if (starValues && typeof starValues === 'object') {
              const value = starValues[stars] || starValues[stars?.toString()];
              if (value) {
                return (
                  <li key={key}>
                    <strong>Stat {parseInt(key) + 1}:</strong> {value}
                  </li>
                );
              }
            }
            return null;
          }).filter(Boolean)}
        </ul>
      </div>
    );
  };

  // Fonction pour rendre les stats d'un item
  const renderItemStats = (item) => {
    if (!item) return null;

    switch (item.type) {
      case 'artifact':
        return (
          <div className="item-stats">
            <div>Stars: {item.stars || 0}</div>
            {item.description && <div>{item.description}</div>}
          </div>
        );
      case 'gearset':
        return (
          <div className="item-stats">
            <div>Pieces: {item.pieces || 0}/4</div>
            {item.bonus2P && <div>2P: {item.bonus2P}</div>}
          </div>
        );
      default:
        return null;
    }
  };

  // Gestionnaire d'événements pour fermer l'overlay
  const handleDocumentClick = useCallback((event) => {
    if (overlayRef.current && !overlayRef.current.contains(event.target)) {
      hideOverlay(true);
    }
  }, [hideOverlay]);

  // Gestionnaire d'événements pour les touches
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && overlayVisible) {
      hideOverlay(true);
    }
  }, [overlayVisible, hideOverlay]);

  // Effets pour les événements
  useEffect(() => {
    if (overlayVisible) {
      document.addEventListener('mousedown', handleDocumentClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [overlayVisible, handleDocumentClick, handleKeyDown]);

  // Nettoyage
  useEffect(() => {
    return () => {
      clearShowTimeout();
      clearHideTimeout();
    };
  }, []);

  const value = {
    // États
    overlayVisible,
    overlayType,
    overlayData,
    
    // Types
    OVERLAY_TYPES,
    
    // Fonctions de base
    showOverlay,
    hideOverlay,
    clearShowTimeout,
    clearHideTimeout,
    
    // Fonctions spécifiques
    showArtifactOverlay,
    showGearSetOverlay,
    showHeroOverlay,
    showPerkOverlay,
    showTeamStatsOverlay,
    showCompareOverlay,
    
    // Utilitaires
    isOverlayVisible: (type = null) => {
      if (type === null) return overlayVisible;
      return overlayVisible && overlayType === type;
    },
    getOverlayData: () => overlayData
  };

  return (
    <OverlayContext.Provider value={value}>
      {children}

      {/* Overlay global */}
      {overlayVisible && overlayContent && (
        <div
          ref={overlayRef}
          className={`global-overlay overlay-${overlayType}`}
          style={{
            position: "fixed",
            left: `${overlayPosition.left}px`,
            top: `${overlayPosition.top}px`,
            transform: overlayPosition.transform || "translateY(-50%)",
            zIndex: 999999,
            pointerEvents: "auto",
            minWidth: "250px",
            maxWidth: "400px",
            backgroundColor: "var(--color-primary)",
            border: "2px solid var(--color-primary-darker)",
            borderRadius: "8px",
            padding: "12px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
            color: "#ffffff",
            fontSize: "14px",
            backdropFilter: "blur(10px)",
            transition: "opacity 0.2s ease"
          }}
          onMouseEnter={() => {
            clearHideTimeout();
          }}
          onMouseLeave={() => {
            hideOverlay(false);
          }}
        >
          {overlayContent}
        </div>
      )}
    </OverlayContext.Provider>
  );
};