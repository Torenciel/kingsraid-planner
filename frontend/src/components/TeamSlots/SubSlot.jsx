// components/TeamSlots/SubSlot.jsx (Show image in subslot, handle onclick and give position to Teamslot.jsx)
import { useRef, useState } from "react";
import "./SubSlot.css";
import SubSlotOverlay from "./SubSlotOverlay";

const SubSlot = ({
  teamSlotIndex,
  subSlotIndex,
  item,
  stars,
  advancement, 
  onClick,
  hasHero,
  heroSlug,
  heroName,
  slotRef,
}) => {


  const subSlotNames = ["UW", "UT", "Artifact", "GearSet"];

  if (!hasHero) {
    return (
      <div className="sub-slot empty">
        <span className="sub-slot-plus">+</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div
        className="sub-slot empty"
        onClick={() => onClick(teamSlotIndex, subSlotIndex)}
      >
        <span className="sub-slot-plus">+</span>
      </div>
    );
  }

  // 🔥 Fonction pour convertir null/0/1/2 en string pour le CSS
const getAdvancementString = () => {
  // console.log(`🔄 getAdvancementString appelé avec:`, {
  //   advancement,
  //   'type': typeof advancement,
  //   '=== 0': advancement === 0,
  //   '=== null': advancement === null
  // });
  
  if (advancement === null || advancement === undefined) {
    // console.log('   → "none" (null/undefined)');
    return "none";
  }
  if (advancement === 0) {
    // console.log('   → "blue" (0)');
    return "blue";
  }
  if (advancement === 1) {
    // console.log('   → "purple" (1)');
    return "purple";
  }
  if (advancement === 2) {
    // console.log('   → "red" (2)');
    return "red";
  }
  console.warn('❌ Valeur advancement inconnue:', advancement);
  return "none";
};

  // 🔥 Fonction pour obtenir la classe de bordure pour l'UW
const getBorderClass = () => {
  // console.log(`🎨 getBorderClass pour slot ${subSlotIndex}:`, {
  //   advancement,
  //   'advancement type': typeof advancement,
  //   'advancement === 0': advancement === 0,
  //   'advancement === "none"': advancement === "none"
  // });
  
  if (subSlotIndex === 0) { // UW slot seulement
    const advString = getAdvancementString();
    // console.log(`   Slot UW (${subSlotIndex}), advString: ${advString}`);
    
    if (advString !== "none") {
      // console.log(`   ✅ Application classe: uw-advancement-${advString}`);
      return `uw-advancement-${advString}`;
    }
  }
  return "";
};

  // 🔥 Fonction pour obtenir le chemin de l'icône d'advancement
  const getAdvancementIconPath = () => {
    const advString = getAdvancementString();
    if (advString !== "none") {
      return `/kingsraid-data/assets/advancements/${advString}.png`;
    }
    return "";
  };

  // Fonction pour encoder les URLs (garde les apostrophes)
  const encodeImagePath = (path) => {
    if (!path) return '';
    
    // Si le chemin commence déjà par http, le garder tel quel
    if (path.startsWith('http')) {
      return path;
    }
    
    // Encoder le chemin mais garder les apostrophes
    const parts = path.split('/');
    const encodedParts = parts.map(part => {
      if (!part) return '';
      // Remplacer les espaces par %20 mais garder les apostrophes
      return part.replace(/\s/g, '%20').replace(/'/g, "'");
    });
    
    return encodedParts.join('/');
  };

  // Fonction pour obtenir l'URL de l'image selon le type d'item
  const getItemImageUrl = (item, subSlotIndex) => {
    if (!item) return '';
    
    // Si c'est un objet (nouveau format MongoDB)
    if (typeof item === 'object') {
      switch (subSlotIndex) {
        case 0: // UW
          return item.uwPath || `/kingsraid-data/assets/heroes/${heroSlug || heroName?.toLowerCase()}/uw.png`;
        
        case 1: // UT
            return item.utPath || `/kingsraid-data/assets/heroes/${heroName}/ut/${item.choice || 1}.png`;
        
        case 2: // Artifact
          // Si on a artifactInfo.thumbnail, construire l'URL
          if (item.artifactInfo?.thumbnail) {
            // Si c'est déjà une URL complète, la garder
            if (item.artifactInfo.thumbnail.startsWith('http') || 
                item.artifactInfo.thumbnail.startsWith('/')) {
              return item.artifactInfo.thumbnail;
            }
            // Si c'est juste un nom de fichier
            // Encoder seulement les espaces, garder les apostrophes
            const encodedFilename = item.artifactInfo.thumbnail.replace(/\s/g, '%20');
            return `/kingsraid-data/assets/artifacts/${encodedFilename}`;
          }
          // Fallback très simple
          return `/kingsraid-data/assets/artifacts/unknown.png`;
        
        case 3: // GearSet
          if (item.gearSetInfo?.thumbnail) {
            // Même logique pour gear set
            if (item.gearSetInfo.thumbnail.startsWith('http') || 
                item.gearSetInfo.thumbnail.startsWith('/')) {
              return item.gearSetInfo.thumbnail;
            }
            const encodedFilename = encodeImagePath(item.gearSetInfo.thumbnail);
            return `/kingsraid-data/assets/gearsets/${encodedFilename}`;
          }
          if (item.gearSetSlug) {
            const encodedSlug = encodeImagePath(`${item.gearSetSlug}.png`);
            return `/kingsraid-data/assets/gearsets/${encodedSlug}`;
          }
          return item.thumbnail || '';
        
        default:
          return '';
      }
    }
    
    // Si c'est une string (ancien format)
    if (typeof item === 'string') {
      return item;
    }
    
    return '';
  };

  // Fonction pour gérer les erreurs d'image avec tentatives multiples
  const handleImageError = (e, itemType, itemData) => {
    console.warn(`${itemType} image failed to load: ${e.target.src}`);
    
    // Si tout échoue, afficher le fallback
    e.target.style.display = "none";
    const fallback = e.target.nextElementSibling;
    if (fallback) {
      fallback.style.display = "flex";
    }
  };

  // Rendu spécial pour les gear sets (2 sets ou 1 set)
  const renderGearSet = (item) => {
    if (!item) return null;
    
    // Si c'est un objet (nouveau format)
    if (typeof item === 'object') {
      // CAS MULTIPLE : si c'est un tableau de gear sets
      if (Array.isArray(item)) {
        return renderMultipleGearSets(item);
      }
      
      // CAS SINGLE : l'ancienne logique pour un seul gear set
      const gearSetSlug = item.gearSetSlug;
      const pieces = item.pieces || 0;
      
      if (!gearSetSlug) return null;
      
      const imageUrl = getItemImageUrl(item, 3);
      
      return (
        <div className="relative w-full h-full">
          <img
            src={imageUrl}
            alt="Gear Set"
            className="sub-slot-image"
            onError={(e) => {
              handleImageError(e, 'GearSet', item);
            }}
          />
          <div className="sub-slot-fallback">Gear</div>
          <div className="sub-slot-stars">{pieces}P</div>
        </div>
      );
    }
    
    // Si c'est un JSON string (ancien format)
    if (typeof item === 'string') {
      try {
        const gearSets = JSON.parse(item);
        return renderMultipleGearSets(gearSets);
      } catch (e) {
        console.error("Error parsing gear set data:", e);
      }
    }

    return null;
  };

  // Nouvelle fonction pour afficher plusieurs gear sets
  const renderMultipleGearSets = (gearSets) => {
    if (!Array.isArray(gearSets) || gearSets.length === 0) return null;
    
    if (gearSets.length === 1) {
      // 1 seul set = 4P
      return (
        <div className="relative w-full h-full">
          <img
            src={`/kingsraid-data/assets/gearsets/${gearSets[0]}.png`}
            alt="Gear Set"
            className="sub-slot-image"
            onError={(e) => {
              e.target.style.display = "none";
              const fallback = e.target.nextElementSibling;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div className="sub-slot-fallback">Gear</div>
          <div className="sub-slot-stars">4P</div>
        </div>
      );
    } else if (gearSets.length === 2) {
      // 2 sets = 2P/2P
      return (
        <div className="relative w-full h-full flex">
          <div className="w-1/2 h-full overflow-hidden">
            <img
              src={`/kingsraid-data/assets/gearsets/${gearSets[0]}.png`}
              alt="Gear Set 1"
              className="w-full h-full object-cover"
              style={{ objectPosition: "left center" }}
              onError={(e) => {
                e.target.style.display = "none";
                const fallback = e.target.nextElementSibling;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <div className="sub-slot-fallback">Gear</div>
          </div>
          <div className="w-1/2 h-full overflow-hidden">
            <img
              src={`/kingsraid-data/assets/gearsets/${gearSets[1]}.png`}
              alt="Gear Set 2"
              className="w-full h-full object-cover"
              style={{ objectPosition: "right center" }}
              onError={(e) => {
                e.target.style.display = "none";
                const fallback = e.target.nextElementSibling;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <div className="sub-slot-fallback">Gear</div>
          </div>
          <div className="sub-slot-stars">2P/2P</div>
        </div>
      );
    }
    
    return null;
  };

  // Rendu normal pour UW, UT, Artifact
  const renderNormalSlot = () => {
    const imageUrl = getItemImageUrl(item, subSlotIndex);
    const slotName = subSlotNames[subSlotIndex];
    
    return (
      <>
        <img
          src={imageUrl}
          alt={slotName}
          className="sub-slot-image"
          onError={(e) => {
            handleImageError(e, slotName, item);
          }}
        />
        <div className="sub-slot-fallback">{slotName}</div>
        
        {/* Stars pour UW, UT, Artifact */}
        {stars > 0 && <div className="sub-slot-stars">{stars}★</div>}

        {/* 🔥 Icône d'avancement pour UW */}
        {subSlotIndex === 0 && advancement !== null && advancement !== undefined && advancement >= 0 && (
          <div className="advancement-corner-icon">
            <img
              src={getAdvancementIconPath()}
              alt={getAdvancementString()}
              onError={(e) => {
                console.warn(`Advancement icon failed to load: ${getAdvancementString()}`);
                e.target.style.display = "none";
              }}
            />
          </div>
        )}
      </>
    );
  };

  // Rendu principal
  const renderContent = () => {
    if (subSlotIndex === 3) { // GearSet
      return renderGearSet(item);
    } else { // UW, UT, Artifact
      return renderNormalSlot();
    }
  };

  return (
    <div
      ref={slotRef}
      className="relative"
    >
      <div
        className={`sub-slot ${getBorderClass()}`}
        onClick={() => onClick(teamSlotIndex, subSlotIndex)}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default SubSlot;