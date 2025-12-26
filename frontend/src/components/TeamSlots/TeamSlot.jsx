// components/TeamSlots/TeamSlot.jsx
import React, { useState, useRef, useEffect } from "react";
import CharacterSlot from "./CharacterSlot";
import PerkPreview from "./PerkPreview";
import PerkSlot from "./PerkSlot";
import SubSlot from "./SubSlot";
import "./TeamSlot.css";

const TeamSlot = ({
  hero,
  teamSlotIndex,
  subSlots,
  subStars,
  advancement, // 🔥 Cette prop vient du TeamContext (null/0/1/2)
  perks,
  onRemoveHero,
  onSubSlotClick,
  onPerkClick,
}) => {
  console.log("🚀 TeamSlot - ENTREE =====================");
  console.log(`🔍 TeamSlot ${teamSlotIndex} (${hero?.name || 'empty'}) reçoit:`, {
    advancement,
    'typeof advancement': typeof advancement,
    '=== 0': advancement === 0,
    '=== "0"': advancement === "0",
    '=== "none"': advancement === "none",
    '=== null': advancement === null,
    '=== undefined': advancement === undefined,
    'valeur brute': advancement
  });
  
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
    if (!hero) {
      console.log(`❌ TeamSlot ${teamSlotIndex} - Pas de héros`);
      return null;
    }
    
    // Priorité au slug, sinon créer à partir du nom
    if (hero.slug) {
      console.log(`✅ TeamSlot ${teamSlotIndex} - Slug trouvé: ${hero.slug}`);
      return hero.slug;
    }
    if (hero.id && hero.id.includes('_')) {
      // Si l'ID est un slug formaté
      console.log(`✅ TeamSlot ${teamSlotIndex} - Slug depuis id: ${hero.id}`);
      return hero.id;
    }
    if (hero.name) {
      const slug = hero.name.toLowerCase().replace(/\s+/g, '-');
      console.log(`✅ TeamSlot ${teamSlotIndex} - Slug créé depuis nom: ${slug}`);
      return slug;
    }
    
    console.log(`❌ TeamSlot ${teamSlotIndex} - Pas de slug disponible`);
    return null;
  };

  // 🔥 Fonction pour obtenir la valeur d'advancement correcte
  const getAdvancementForSubSlot = (subIndex) => {
    console.log(`🔄 TeamSlot ${teamSlotIndex} - getAdvancementForSubSlot(${subIndex}):`, {
      'subIndex': subIndex,
      'advancement reçu': advancement,
      'type advancement': typeof advancement,
      'est UW?': subIndex === 0
    });
    
    // UW (slot 0) utilise la vraie valeur d'advancement
    if (subIndex === 0) {
      console.log(`✅ TeamSlot ${teamSlotIndex} - Slot UW (${subIndex}), advancement:`, advancement);
      return advancement; // null/0/1/2
    }
    // Les autres slots n'ont pas d'advancement
    console.log(`✅ TeamSlot ${teamSlotIndex} - Slot non-UW (${subIndex}), advancement: null`);
    return null;
  };

  console.log("🎨 TeamSlot - RENDU =====================");
  console.log(`📦 TeamSlot ${teamSlotIndex} - subSlots:`, subSlots);
  console.log(`⭐ TeamSlot ${teamSlotIndex} - subStars:`, subStars);
  console.log(`📊 TeamSlot ${teamSlotIndex} - perks:`, perks);

  return (
    <div className="team-slot">
      {/* Slot principal du héros */}
      <CharacterSlot
        hero={hero}
        onRemove={() => hero && onRemoveHero(hero.id)}
      />

      {/* Sous-slots (UW, UT, Artifact, GearSet) */}
      <div className="sub-slots-grid">
        {[0, 1, 2, 3].map((subIndex) => {
          const advancementForSlot = getAdvancementForSubSlot(subIndex);
          
          console.log(`🔧 TeamSlot ${teamSlotIndex} - Rendu SubSlot ${subIndex}:`, {
            'item présent': !!subSlots?.[subIndex],
            'stars': subStars?.[subIndex],
            'advancement passé': advancementForSlot,
            'type advancement passé': typeof advancementForSlot,
            '=== 0': advancementForSlot === 0,
            '=== "none"': advancementForSlot === "none"
          });
          
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
              // 🔥 CORRECTION : UW (slot 0) reçoit l'advancement, autres reçoivent null
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
      
      {/* 🔥 DEBUG TEMPORAIRE */}
      <div style={{
        position: 'absolute',
        top: '5px',
        right: '5px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        fontSize: '10px',
        padding: '2px 4px',
        borderRadius: '3px',
        zIndex: 1000
      }}>
        Adv: {typeof advancement === 'number' ? advancement : 'null'}
      </div>
      
    </div>
  );
};

export default TeamSlot;