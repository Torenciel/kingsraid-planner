// components/TeamSlots/TeamSlot.jsx (Show subslot overlay)
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
  // console.log("🚀 TeamSlot - ENTREE =====================");
  // console.log(`🔍 TeamSlot ${teamSlotIndex} (${hero?.name || 'empty'}) reçoit:`, {
  //   advancement,
  //   'typeof advancement': typeof advancement,
  //   '=== 0': advancement === 0,
  //   '=== "0"': advancement === "0",
  //   '=== "none"': advancement === "none",
  //   '=== null': advancement === null,
  //   '=== undefined': advancement === undefined,
  //   'valeur brute': advancement
  // });
  
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
  console.group(`🟦 Hover SubSlot ${subIndex}`);

  console.log("👉 subIndex:", subIndex);
  console.log("👉 subSlots[subIndex]:", subSlots?.[subIndex]);
  console.log("👉 typeof:", typeof subSlots?.[subIndex]);
  console.log("👉 is null:", subSlots?.[subIndex] === null);
  console.log("👉 is undefined:", subSlots?.[subIndex] === undefined);
  console.log("👉 Boolean():", Boolean(subSlots?.[subIndex]));

  if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);

  showTimeoutRef.current = setTimeout(() => {
    console.log("⏱️ showTimeout fired for subIndex", subIndex);

    if (subSlots?.[subIndex] === null || subSlots?.[subIndex] === undefined) {
      console.warn("⛔ Slot vide → overlay annulé");
      console.groupEnd();
      return;
    }

    console.log("✅ Overlay autorisé");
    setHoveredSubSlot(subIndex);
    setIsOverlayVisible(true);

    console.groupEnd();
  }, 150);
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
    if (!hero) {
      // console.log(`❌ TeamSlot ${teamSlotIndex} - Pas de héros`);
      return null;
    }
    
    // Priorité au slug, sinon créer à partir du nom
    if (hero.slug) {
      // console.log(`✅ TeamSlot ${teamSlotIndex} - Slug trouvé: ${hero.slug}`);
      return hero.slug;
    }
    if (hero.id && hero.id.includes('_')) {
      // Si l'ID est un slug formaté
      // console.log(`✅ TeamSlot ${teamSlotIndex} - Slug depuis id: ${hero.id}`);
      return hero.id;
    }
    if (hero.name) {
      const slug = hero.name.toLowerCase().replace(/\s+/g, '-');
      // console.log(`✅ TeamSlot ${teamSlotIndex} - Slug créé depuis nom: ${slug}`);
      return slug;
    }
    
    // console.log(`❌ TeamSlot ${teamSlotIndex} - Pas de slug disponible`);
    return null;
  };

  // 🔥 Fonction pour obtenir la valeur d'advancement correcte
  const getAdvancementForSubSlot = (subIndex) => {
    // console.log(`🔄 TeamSlot ${teamSlotIndex} - getAdvancementForSubSlot(${subIndex}):`, {
    //   'subIndex': subIndex,
    //   'advancement reçu': advancement,
    //   'type advancement': typeof advancement,
    //   'est UW?': subIndex === 0
    // });
    
    // UW (slot 0) utilise la vraie valeur d'advancement
    if (subIndex === 0) {
      // console.log(`✅ TeamSlot ${teamSlotIndex} - Slot UW (${subIndex}), advancement:`, advancement);
      return advancement; // null/0/1/2
    }
    // Les autres slots n'ont pas d'advancement
    // console.log(`✅ TeamSlot ${teamSlotIndex} - Slot non-UW (${subIndex}), advancement: null`);
    return null;
  };

  // console.log("🎨 TeamSlot - RENDU =====================");
  // console.log(`📦 TeamSlot ${teamSlotIndex} - subSlots:`, subSlots);
  // console.log(`⭐ TeamSlot ${teamSlotIndex} - subStars:`, subStars);
  // console.log(`📊 TeamSlot ${teamSlotIndex} - perks:`, perks);

  return (
    <div className="team-slot">
      {/* Slot principal du héros */}
      <CharacterSlot
        hero={hero}
        onRemove={() => hero && onRemoveHero(hero.id)}
      />

      {/* Sub slots (UW, UT, Artifact, GearSet) */}
      <div className="sub-slots-grid">
        {[0, 1, 2, 3].map((subIndex) => {
          const advancementForSlot = getAdvancementForSubSlot(subIndex);
          
          console.group("🟨 Overlay render check");
          console.log("isOverlayVisible:", isOverlayVisible);
          console.log("hoveredSubSlot:", hoveredSubSlot);
          console.log("item:", subSlots?.[hoveredSubSlot]);
          console.log("stars:", subStars?.[hoveredSubSlot]);
          console.log("advancement:", hoveredSubSlot === 0 ? advancement : null);
          console.log("heroSlug:", getHeroSlug());
          console.log("slotRef:", subSlotRefs.current[hoveredSubSlot]);
          console.groupEnd();
          
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
              advancement={subIndex === 0 ? advancement : null}
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
      
      {/* ===== SubSlot Overlay (GLOBAL) ===== */}
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