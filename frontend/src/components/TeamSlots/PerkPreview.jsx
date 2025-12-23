import { useState, useEffect } from "react";
import { useOverlay } from "../../contexts/OverlayContext";
import { api } from "../../services/api";
import "./PerkPreview.css";

const PerkPreview = ({
  selectedPerks,
  heroClass,
  heroName,
  size = "medium",
}) => {
  const { showOverlay, hideOverlay } = useOverlay();
  const [perkData, setPerkData] = useState([]);
  const [heroSkills, setHeroSkills] = useState({});
  const [loading, setLoading] = useState(false);

  // Fonction pour obtenir le nom du skill
  const getSkillName = (skillNumber) => {
    if (!heroSkills || !heroSkills[skillNumber]) {
      return `Skill ${skillNumber}`;
    }
    return heroSkills[skillNumber].name;
  };

  // Informations d'image pour chaque perk (identique à PerkModal)
  const getPerkImageInfo = (rowIndex, perkIndex, globalIndex) => {
    // Row 1: T1 perks
    if (rowIndex === 0) {
      const T1_PERKS = [
        { name: "ATK Up", file: "ATK Up.png", tier: "t1", index: globalIndex },
        { name: "HP Up", file: "HP Up.png", tier: "t1", index: globalIndex },
        { name: "DEF up", file: "DEF up.png", tier: "t1", index: globalIndex },
        { name: "Crit Resist Up", file: "Crit Resist Up.png", tier: "t1", index: globalIndex },
        { name: "Monster Hunting", file: "Monster Hunting.png", tier: "t1", index: globalIndex },
      ];
      return perkIndex < T1_PERKS.length ? T1_PERKS[perkIndex] : null;
    }
    
    // Row 2: T2 class perks
    if (rowIndex === 1 && heroClass) {
      const T2_PERKS_BY_CLASS = {
        Knight: [
          { name: "Experienced Fighter", file: "Experienced Fighter.png", tier: "t2", index: globalIndex },
          { name: "Excellent Strategy", file: "Excellent Strategy.png", tier: "t2", index: globalIndex },
          { name: "Battle Cry", file: "Battle Cry.png", tier: "t2", index: globalIndex },
          { name: "Shield of Protection", file: "Shield of Protection.png", tier: "t2", index: globalIndex },
          { name: "Swift Move", file: "Swift Move.png", tier: "t2", index: globalIndex },
        ],
        Warrior: [
          { name: "Opportune Strike", file: "Opportune Strike.png", tier: "t2", index: globalIndex },
          { name: "Warlike", file: "Warlike.png", tier: "t2", index: globalIndex },
          { name: "Offensive Guard", file: "Offensive Guard.png", tier: "t2", index: globalIndex },
          { name: "Tactical Foresight", file: "Tactical Foresight.png", tier: "t2", index: globalIndex },
          { name: "Blood Wrath", file: "Blood Wrath.png", tier: "t2", index: globalIndex },
        ],
        Assassin: [
          { name: "Target Weakness", file: "Target Weakness.png", tier: "t2", index: globalIndex },
          { name: "Swift and Nimble", file: "Swift and Nimble.png", tier: "t2", index: globalIndex },
          { name: "Tactical Foresight", file: "Tactical Foresight.png", tier: "t2", index: globalIndex },
          { name: "Opportune Strike", file: "Opportune Strike.png", tier: "t2", index: globalIndex },
          { name: "Vital Detection", file: "Vital Detection.png", tier: "t2", index: globalIndex },
        ],
        Mechanic: [
          { name: "Target Weakness", file: "Target Weakness.png", tier: "t2", index: globalIndex },
          { name: "Ready Cannons", file: "Ready Cannons.png", tier: "t2", index: globalIndex },
          { name: "Pressure Point", file: "Pressure Point.png", tier: "t2", index: globalIndex },
          { name: "Special Bullet", file: "Special Bullet.png", tier: "t2", index: globalIndex },
          { name: "Amplified Gunpowder", file: "Amplified Gunpowder.png", tier: "t2", index: globalIndex },
        ],
        Archer: [
          { name: "Precision Shot", file: "Precision Shot.png", tier: "t2", index: globalIndex },
          { name: "Eagle Eye", file: "Eagle Eye.png", tier: "t2", index: globalIndex },
          { name: "Mortal Wound", file: "Mortal Wound.png", tier: "t2", index: globalIndex },
          { name: "Opportune Strike", file: "Opportune Strike.png", tier: "t2", index: globalIndex },
          { name: "Concentration", file: "Concentration.png", tier: "t2", index: globalIndex },
        ],
        Wizard: [
          { name: "Deception", file: "Deception.png", tier: "t2", index: globalIndex },
          { name: "Moral Rise", file: "Moral Rise.png", tier: "t2", index: globalIndex },
          { name: "Blessing of Mana", file: "Blessing of Mana.png", tier: "t2", index: globalIndex },
          { name: "Circuit Burst", file: "Circuit Burst.png", tier: "t2", index: globalIndex },
          { name: "Destruction", file: "Destruction.png", tier: "t2", index: globalIndex },
        ],
        Priest: [
          { name: "Vengeful Curse", file: "Vengeful Curse.png", tier: "t2", index: globalIndex },
          { name: "Goddess Blessing", file: "Goddess Blessing.png", tier: "t2", index: globalIndex },
          { name: "Inner Peace", file: "Inner Peace.png", tier: "t2", index: globalIndex },
          { name: "Blessing of Mana", file: "Blessing of Mana.png", tier: "t2", index: globalIndex },
          { name: "Swiftness", file: "Swiftness.png", tier: "t2", index: globalIndex },
        ],
      };
      
      const classPerks = T2_PERKS_BY_CLASS[heroClass];
      return classPerks && perkIndex < classPerks.length ? classPerks[perkIndex] : null;
    }
    
    // Rows 3-5: Hero-specific perks
    if (rowIndex >= 2 && heroName) {
      const HERO_PERKS = {
        row3: [
          { name: "Skill 1 Light", file: "s1l.png", tier: "t3", skill: 1, type: "light", index: globalIndex },
          { name: "Skill 1 Dark", file: "s1d.png", tier: "t3", skill: 1, type: "dark", index: globalIndex },
          { name: "Skill 2 Light", file: "s2l.png", tier: "t3", skill: 2, type: "light", index: globalIndex },
          { name: "Skill 2 Dark", file: "s2d.png", tier: "t3", skill: 2, type: "dark", index: globalIndex },
        ],
        row4: [
          { name: "Skill 3 Light", file: "s3l.png", tier: "t3", skill: 3, type: "light", index: globalIndex },
          { name: "Skill 3 Dark", file: "s3d.png", tier: "t3", skill: 3, type: "dark", index: globalIndex },
          { name: "Skill 4 Light", file: "s4l.png", tier: "t3", skill: 4, type: "light", index: globalIndex },
          { name: "Skill 4 Dark", file: "s4d.png", tier: "t3", skill: 4, type: "dark", index: globalIndex },
        ],
        row5: [
          { name: "Light Transcendence", file: "light.png", tier: "t5", skill: null, type: "light", index: globalIndex },
          { name: "Dark Transcendence", file: "dark.png", tier: "t5", skill: null, type: "dark", index: globalIndex },
        ],
      };
      
      const perkRow = rowIndex === 2 ? HERO_PERKS.row3 : 
                     rowIndex === 3 ? HERO_PERKS.row4 : 
                     HERO_PERKS.row5;
      
      return perkIndex < perkRow.length ? perkRow[perkIndex] : null;
    }
    
    return null;
  };

  // Trouver une perk dans la base de données
const findPerk = (perkImageInfo) => {
  if (!perkImageInfo || !perkData || !Array.isArray(perkData) || perkData.length === 0) {
    return null;
  }
  
  const { name, file, tier, skill, type } = perkImageInfo;
  const heroSlug = heroName?.toLowerCase();
  
  // Chercher par thumbnail exact
  let foundPerk = perkData.find(perk => perk && perk.thumbnail === file);
  if (foundPerk) return foundPerk;
  
  // Chercher par chemin complet pour T3/T5
  const fullPath = `heroes/${heroName}/perks/${file}`;
  foundPerk = perkData.find(perk => perk && perk.thumbnail === fullPath);
  if (foundPerk) return foundPerk;
  
  // Pour T3/T5: chercher par héro, tier, skill et type
  if ((tier === 't3' || tier === 't5') && heroSlug) {
    foundPerk = perkData.find(perk => 
      perk && 
      perk.heroSlug === heroSlug &&
      perk.tier === tier &&
      perk.skillIndex === skill &&
      perk.type === type
    );
    if (foundPerk) return foundPerk;
  }
  
  // Chercher par nom (approximatif)
  const searchName = name.toLowerCase();
  foundPerk = perkData.find(perk => 
    perk && 
    perk.name && 
    perk.name.toLowerCase().includes(searchName)
  );
  
  return foundPerk || null;
};

// Et modifie aussi le useEffect qui charge les données :
useEffect(() => {
  const loadData = async () => {
    if (!heroName) return;
    
    try {
      setLoading(true);
      
      // Charger les perks
      const perksData = await api.request('/v2/perks');
      
      // Vérifier que perksData est un tableau
      if (perksData && Array.isArray(perksData)) {
        setPerkData(perksData);
      } else if (perksData && perksData.perks && Array.isArray(perksData.perks)) {
        // Si l'API retourne { perks: [...] }
        setPerkData(perksData.perks);
      } else {
        console.warn('Perks data format unexpected:', perksData);
        setPerkData([]);
      }
      
      // Charger les skills du héros
      try {
        const heroSlug = heroName.toLowerCase().replace(/\s+/g, '-');
        const heroData = await api.request(`/v2/heroes/${heroSlug}`);
        if (heroData?.skills) {
          setHeroSkills(heroData.skills);
        }
      } catch (heroError) {
        console.warn(`⚠️ Could not load skills for ${heroName}:`, heroError.message);
      }
      
    } catch (error) {
      console.error("❌ Error loading perk preview data:", error);
      setPerkData([]); // Assure que perkData est toujours un tableau
    } finally {
      setLoading(false);
    }
  };
  
  loadData();
}, [heroName]);
  
  
  // ============ OPTION 1 ============
  // Afficher un overlay différent pour les perks non sélectionnées
  const handlePerkHoverOption1 = (perkImageInfo, isSelected, e) => {
    if (!perkImageInfo || loading) return;

    const perkInfo = findPerk(perkImageInfo);
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      left: rect.left + rect.width / 2,
      top: rect.top,
      transform: "translateX(-50%) translateY(-100%)",
    };

    // Déterminer le coût basé sur la ligne
    const getRowCost = (rowIndex) => {
      const costs = [10, 15, 15, 15, 15];
      return costs[rowIndex] || 15;
    };

    const rowIndex = Math.floor(perkImageInfo.index / 10);
    const cost = getRowCost(rowIndex);

    // DÉTERMINER LE TITRE
    let displayName = "Unknown Perk";
    
    if (perkImageInfo.tier === 't3' && perkImageInfo.skill) {
      const skillName = getSkillName(perkImageInfo.skill);
      const typeName = perkImageInfo.type === 'light' ? 'Light' : 'Dark';
      displayName = `${skillName} - ${typeName}`;
    } else if (perkImageInfo.tier === 't5') {
      const typeName = perkImageInfo.type === 'light' ? 'Light' : 'Dark';
      displayName = `${typeName} Transcendence`;
    } else {
      displayName = perkInfo?.name || perkImageInfo.name || "Unknown Perk";
    }

    // DESCRIPTION
    let description = "No description available";
    if (perkInfo?.description) {
      description = perkInfo.description;
    } else if (perkImageInfo?.effect) {
      description = perkImageInfo.effect;
    } else if (perkImageInfo) {
      description = `Data loading for "${perkImageInfo.name}"...`;
    }

    const overlayContent = (
      <div className={`perk-overlay ${isSelected ? 'selected' : 'unselected'}`}>
        <h4 className="perk-title">{displayName}</h4>
        <p className="perk-description">{description}</p>
        
        {/* <div className="perk-overlay-meta">
          {perkImageInfo?.tier && (
            <span className="perk-tier">Tier: {perkImageInfo.tier.toUpperCase()}</span>
          )}
          {perkInfo?.class && perkInfo.class !== "General" && (
            <span className="perk-class">Class: {perkInfo.class}</span>
          )}
          {perkImageInfo?.skill && (
            <span className="perk-skill">Skill {perkImageInfo.skill}</span>
          )}
        </div>
        
        <div className="perk-cost-overlay">
          Cost: {cost} points
        </div> */}
      </div>
    );

    showOverlay(overlayContent, position);
  };

  // ============ OPTION 2 ============
  // Ne pas afficher d'overlay pour les perks non sélectionnées
  const handlePerkHoverOption2 = (perkImageInfo, isSelected, e) => {
    // Seulement afficher l'overlay si la perk est sélectionnée
    if (!perkImageInfo || loading || !isSelected) return;

    const perkInfo = findPerk(perkImageInfo);
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      left: rect.left + rect.width / 2,
      top: rect.top,
      transform: "translateX(-50%) translateY(-100%)",
    };

    // Déterminer le coût basé sur la ligne
    const getRowCost = (rowIndex) => {
      const costs = [10, 15, 15, 15, 15];
      return costs[rowIndex] || 15;
    };

    const rowIndex = Math.floor(perkImageInfo.index / 10);
    const cost = getRowCost(rowIndex);

    // DÉTERMINER LE TITRE
    let displayName = "Unknown Perk";
    
    if (perkImageInfo.tier === 't3' && perkImageInfo.skill) {
      const skillName = getSkillName(perkImageInfo.skill);
      const typeName = perkImageInfo.type === 'light' ? 'Light' : 'Dark';
      displayName = `${skillName} - ${typeName}`;
    } else if (perkImageInfo.tier === 't5') {
      const typeName = perkImageInfo.type === 'light' ? 'Light' : 'Dark';
      displayName = `${typeName} Transcendence`;
    } else {
      displayName = perkInfo?.name || perkImageInfo.name || "Unknown Perk";
    }

    // DESCRIPTION
    let description = "No description available";
    if (perkInfo?.description) {
      description = perkInfo.description;
    } else if (perkImageInfo?.effect) {
      description = perkImageInfo.effect;
    } else if (perkImageInfo) {
      description = `Data loading for "${perkImageInfo.name}"...`;
    }

    const overlayContent = (
      <div className="perk-overlay selected">
        <h4 className="perk-title">{displayName}</h4>
        <p className="perk-description">{description}</p>
        
        {/* <div className="perk-overlay-meta">
          {perkImageInfo?.tier && (
            <span className="perk-tier">Tier: {perkImageInfo.tier.toUpperCase()}</span>
          )}
          {perkInfo?.class && perkInfo.class !== "General" && (
            <span className="perk-class">Class: {perkInfo.class}</span>
          )}
          {perkImageInfo?.skill && (
            <span className="perk-skill">Skill {perkImageInfo.skill}</span>
          )}
        </div>
        
        <div className="perk-cost-overlay">
          Cost: {cost} points
        </div>
        
        <div className="perk-selection-status selected">
          ✓ Selected
        </div> */}
      </div>
    );

    showOverlay(overlayContent, position);
  };

  // ============ CHOIX DE L'OPTION ============
  // Pour utiliser l'Option 1, commentez la ligne Option 2 et décommentez Option 1
  // Pour utiliser l'Option 2, commentez la ligne Option 1 et décommentez Option 2
  
  // const handlePerkHover = handlePerkHoverOption1; // OPTION 1 - Overlay différent
  const handlePerkHover = handlePerkHoverOption2; // OPTION 2 - Pas d'overlay si non sélectionné

  // Même logique d'affichage que précédemment
  if (!heroName || !selectedPerks || selectedPerks.length === 0) {
    return <div className={`perk-preview ${size}`}></div>;
  }

  const perkLayout = [5, 5, 4, 4, 2];

  return (
    <div className={`perk-preview ${size}`}>
      {perkLayout.map((perkCount, rowIndex) => (
        <div key={rowIndex} className="perk-preview-row">
          {Array.from({ length: perkCount }, (_, i) => {
            const globalIndex = rowIndex * 10 + i;
            const isSelected = selectedPerks.includes(globalIndex);
            const perkImageInfo = getPerkImageInfo(rowIndex, i, globalIndex);
            
            // Construire l'URL de l'image
            let imageUrl = "";
            if (perkImageInfo) {
              if (rowIndex === 0) {
                imageUrl = `/kingsraid-data/assets/perks/t1/${perkImageInfo.file}`;
              } else if (rowIndex === 1 && heroClass) {
                imageUrl = `/kingsraid-data/assets/perks/t2/${heroClass.toLowerCase()}/${perkImageInfo.file}`;
              } else if (rowIndex >= 2 && heroName) {
                imageUrl = `/kingsraid-data/assets/heroes/${heroName}/perks/${perkImageInfo.file}`;
              }
            }

            return (
              <div
                key={globalIndex}
                className={`perk-preview-option ${
                  isSelected ? "selected" : ""
                }`}
                onMouseEnter={(e) => handlePerkHover(perkImageInfo, isSelected, e)}
                onMouseLeave={hideOverlay}
              >
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={`Perk ${globalIndex}`}
                      className="perk-preview-image"
                      onError={(e) => {
                        e.target.style.display = "none";
                        const fallback = e.target.nextElementSibling;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div className="perk-preview-fallback">
                      {rowIndex === 0 ? "T1" : rowIndex === 1 ? "T2" : "H"}
                    </div>
                  </>
                ) : (
                  <div className="perk-preview-fallback">
                    {rowIndex === 0 ? "T1" : rowIndex === 1 ? "T2" : "H"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default PerkPreview;