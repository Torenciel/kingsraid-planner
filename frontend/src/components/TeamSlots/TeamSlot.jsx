// components/TeamSlots/TeamSlot.jsx
import React, { useState, useRef, useEffect } from "react";
import CharacterSlot from "./CharacterSlot";
import PerkPreview from "./PerkPreview";
import PerkSlot from "./PerkSlot";
import SubSlot from "./SubSlot";
import SubSlotOverlay from "./SubSlotOverlay";

import "./TeamSlot.css";

const TeamSlot = ({
  hero,
  teamSlotIndex,
  subSlots,
  subStars,
  advancement,
  perks,
  onRemoveHero,
  onSubSlotClick,
  onPerkClick,
}) => {
  // State for managing hovered sub-slot
  const [hoveredSubSlot, setHoveredSubSlot] = useState(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  // Timeout refs for delayed show/hide
  const hideTimeoutRef = useRef(null);
  const showTimeoutRef = useRef(null);

  // Refs for each sub-slot
  const subSlotRefs = useRef([
    React.createRef(),
    React.createRef(),
    React.createRef(),
    React.createRef(),
  ]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    };
  }, []);

  // Handle sub-slot hover enter
  const handleSubSlotMouseEnter = (subIndex) => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);

    showTimeoutRef.current = setTimeout(() => {
      if (subSlots?.[subIndex] === null || subSlots?.[subIndex] === undefined) {
        return;
      }

      setHoveredSubSlot(subIndex);
      setIsOverlayVisible(true);
    }, 150);
  };

  // Handle sub-slot hover leave
  const handleSubSlotMouseLeave = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      setIsOverlayVisible(false);
      setTimeout(() => {
        if (!isOverlayVisible) {
          setHoveredSubSlot(null);
        }
      }, 50);
    }, 200);
  };

  // Prevent overlay from hiding when hovered
  const handleOverlayMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  // Hide overlay after leaving it
  const handleOverlayMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsOverlayVisible(false);
      setTimeout(() => {
        setHoveredSubSlot(null);
      }, 50);
    }, 200);
  };

  // Get hero slug
  const getHeroSlug = () => {
    if (!hero) return null;

    if (hero.slug) return hero.slug;

    if (hero.id && hero.id.includes("_")) {
      return hero.id;
    }

    if (hero.name) {
      return hero.name.toLowerCase().replace(/\s+/g, "-");
    }

    return null;
  };

  // Return advancement only for UW (subIndex 0)
  const getAdvancementForSubSlot = (subIndex) => {
    if (subIndex === 0) {
      return advancement;
    }
    return null;
  };

  return (
    <div className="team-slot">
      {/* Main hero slot */}
      <CharacterSlot
        hero={hero}
        onRemove={() => hero && onRemoveHero(hero.id)}
      />

      {/* Sub-slots: UW, UT, Artifact, GearSet */}
      <div className="sub-slots-grid">
        {[0, 1, 2, 3].map((subIndex) => {
          const advancementForSlot = getAdvancementForSubSlot(subIndex);

          return (
            <div
              key={subIndex}
              className="sub-slot-container"
              onMouseEnter={() => handleSubSlotMouseEnter(subIndex)}
              onMouseLeave={handleSubSlotMouseLeave}
            >
              <SubSlot
                teamSlotIndex={teamSlotIndex}
                subSlotIndex={subIndex}
                item={subSlots?.[subIndex]}
                stars={subStars?.[subIndex]}
                advancement={subIndex === 0 ? advancementForSlot : null}
                hasHero={!!hero}
                onClick={onSubSlotClick}
                heroName={hero?.name}
                heroSlug={getHeroSlug()}
                slotRef={subSlotRefs.current[subIndex]}
              />
            </div>
          );
        })}
      </div>

      {/* Perks button */}
      <PerkSlot
        teamSlotIndex={teamSlotIndex}
        hasPerks={perks && perks.length > 0}
        onClick={onPerkClick}
      />

      {/* Perks preview */}
      <PerkPreview
        selectedPerks={perks || []}
        heroClass={hero?.role}
        heroName={hero?.name}
      />

      {/* Global SubSlot overlay */}
      {isOverlayVisible && hoveredSubSlot !== null && (
        <SubSlotOverlay
          subSlotIndex={hoveredSubSlot}
          item={subSlots?.[hoveredSubSlot]}
          stars={subStars?.[hoveredSubSlot]}
          advancement={hoveredSubSlot === 0 ? advancement : null}
          heroSlug={getHeroSlug()}
          heroName={hero?.name}
          slotRef={subSlotRefs.current[hoveredSubSlot]}
          onMouseEnter={handleOverlayMouseEnter}
          onMouseLeave={handleOverlayMouseLeave}
        />
      )}
    </div>
  );
};

export default TeamSlot;
