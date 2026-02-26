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
  readOnly = false,
  onReady, // 👈 NEW
}) => {

  const slotRef = useRef(null);

  /* ======================================================
     IMAGE LOAD DETECTION (CRITICAL)
  ====================================================== */
  useEffect(() => {
    const container = slotRef.current;
    if (!container) return;

    const images = container.querySelectorAll("img");

    if (images.length === 0) {
      onReady?.();
      return;
    }

    let loaded = 0;

    const checkDone = () => {
      loaded++;
      if (loaded === images.length) {
        onReady?.();
      }
    };

    images.forEach(img => {
      if (img.complete) {
        checkDone();
      } else {
        img.addEventListener("load", checkDone);
        img.addEventListener("error", checkDone);
      }
    });

  }, []);

  /* ======================================================
     OVERLAY LOGIC (unchanged)
  ====================================================== */

  const [hoveredSubSlot, setHoveredSubSlot] = useState(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  const hideTimeoutRef = useRef(null);
  const showTimeoutRef = useRef(null);

  const subSlotRefs = useRef([
    React.createRef(),
    React.createRef(),
    React.createRef(),
    React.createRef(),
  ]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    };
  }, []);

  const handleSubSlotMouseEnter = (subIndex) => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);

    showTimeoutRef.current = setTimeout(() => {
      if (!subSlots?.[subIndex]) return;
      setHoveredSubSlot(subIndex);
      setIsOverlayVisible(true);
    }, 150);
  };

  const handleSubSlotMouseLeave = () => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);

    hideTimeoutRef.current = setTimeout(() => {
      setIsOverlayVisible(false);
      setHoveredSubSlot(null);
    }, 200);
  };

  const getHeroSlug = () => {
    if (!hero) return null;
    if (hero.slug) return hero.slug;
    if (hero.name) return hero.name.toLowerCase().replace(/\s+/g, "-");
    return null;
  };

  return (
    <div ref={slotRef} className="team-slot">
      <CharacterSlot
        hero={hero}
        onRemove={
          readOnly ? undefined : () => hero && onRemoveHero?.(hero.id)
        }
      />

      <div className="sub-slots-grid">
        {[0, 1, 2, 3].map((subIndex) => (
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
              advancement={subIndex === 0 ? advancement : null}
              hasHero={!!hero}
              onClick={readOnly ? undefined : onSubSlotClick}
              heroName={hero?.name}
              heroSlug={getHeroSlug()}
              slotRef={subSlotRefs.current[subIndex]}
            />
          </div>
        ))}
      </div>

      {!readOnly && (
        <PerkSlot
          teamSlotIndex={teamSlotIndex}
          hasPerks={
            perks &&
            (
              perks.t1?.selected?.length > 0 ||
              perks.t2?.selected?.length > 0 ||
              Object.values(perks.t3 || {}).some(Boolean) ||
              perks.t5
            )
          }
          onClick={onPerkClick}
        />
      )}

      <PerkPreview
        selectedPerks={perks || []}
        heroClass={hero?.role}
        heroName={hero?.name}
      />

      {isOverlayVisible && hoveredSubSlot !== null && (
        <SubSlotOverlay
          subSlotIndex={hoveredSubSlot}
          item={subSlots?.[hoveredSubSlot]}
          stars={subStars?.[hoveredSubSlot]}
          advancement={hoveredSubSlot === 0 ? advancement : null}
          heroSlug={getHeroSlug()}
          heroName={hero?.name}
          slotRef={subSlotRefs.current[hoveredSubSlot]}
        />
      )}
    </div>
  );
};

export default TeamSlot;