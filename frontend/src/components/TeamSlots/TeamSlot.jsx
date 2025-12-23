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
  // État pour gérer quel sub-slot est survolé
  const [hoveredSubSlot, setHoveredSubSlot] = useState(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  
  // Timeout pour gérer le hide avec délai
  const hideTimeoutRef = useRef(null);
  const showTimeoutRef = useRef(null);
  
  // Refs pour chaque sub-slot
  const subSlotRefs = useRef([
    React.createRef(),
    React.createRef(),
    React.createRef(),
    React.createRef()
  ]);
  
  // Nettoyage des timeouts
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    };
  }, []);
  
  // Fonctions pour gérer l'affichage de l'overlay
  const handleSubSlotMouseEnter = (subIndex) => {
    // Annuler tout hide en cours
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    // Annuler tout show en cours
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }
    
    // Afficher l'overlay après un court délai
    showTimeoutRef.current = setTimeout(() => {
      if (!subSlots?.[subIndex]) return; // Pas d'overlay si le slot est vide
      
      setHoveredSubSlot(subIndex);
      setIsOverlayVisible(true);
    }, 150); // Délai légèrement plus long pour éviter les apparitions/disparitions rapides
  };
  
  const handleSubSlotMouseLeave = () => {
    // Annuler tout show en cours
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }
    
    // Cacher l'overlay après un court délai
    hideTimeoutRef.current = setTimeout(() => {
      setIsOverlayVisible(false);
      setTimeout(() => {
        if (!isOverlayVisible) {
          setHoveredSubSlot(null);
        }
      }, 50);
    }, 200);
  };
  
  const handleOverlayMouseEnter = () => {
    // Annuler tout hide en cours
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };
  
  const handleOverlayMouseLeave = () => {
    // Cacher l'overlay après un court délai
    hideTimeoutRef.current = setTimeout(() => {
      setIsOverlayVisible(false);
      setTimeout(() => {
        setHoveredSubSlot(null);
      }, 50);
    }, 200);
  };

  // Obtenir le slug du héros
  const getHeroSlug = () => {
    if (!hero) return null;
    
    // Priorité au slug, sinon créer à partir du nom
    if (hero.slug) return hero.slug;
    if (hero.id && hero.id.includes('_')) {
      // Si l'ID est un slug formaté
      return hero.id;
    }
    if (hero.name) {
      return hero.name.toLowerCase().replace(/\s+/g, '-');
    }
    
    return null;
  };

  return (
    <div className="team-slot">
      {/* Slot principal du héros */}
      <CharacterSlot
        hero={hero}
        onRemove={() => hero && onRemoveHero(hero.id)}
      />

      {/* Sous-slots (UW, UT, Artifact, GearSet) */}
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
              advancement={subIndex === 0 ? advancement : "none"}
              hasHero={!!hero}
              onClick={onSubSlotClick}
              heroName={hero?.name}
              heroSlug={getHeroSlug()}
              slotRef={subSlotRefs.current[subIndex]}
            />
          </div>
        ))}
      </div>

      {/* Bouton Perks */}
      <PerkSlot
        teamSlotIndex={teamSlotIndex}
        hasPerks={perks && perks.length > 0}
        onClick={onPerkClick}
      />

      {/* Perk Preview */}
      <PerkPreview
        selectedPerks={perks || []}
        heroClass={hero?.role}
        heroName={hero?.name}
      />
      
    </div>
  );
};

export default TeamSlot;