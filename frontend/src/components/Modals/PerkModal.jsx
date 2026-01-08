// frontend/src/components/Modals/PerkModal.jsx
import { useEffect, useState } from "react";
import { useOverlay } from "../../contexts/OverlayContext";
import { useTeam } from "../../contexts/TeamContext";
import { perksToIndices, indicesToPerks } from "../../utils/perkConverter";
import "./PerkModal.css";

const PerkModal = ({ data, onClose }) => {
  const { teamSlotIndex, heroClass, heroName, heroSlug } = data;
  const { updatePerks, perks } = useTeam();
  const { showOverlay, hideOverlay } = useOverlay();

  // 🔥 CORRECTION : Toujours travailler avec des indices dans le modal
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [usedPoints, setUsedPoints] = useState(0);
  const [perkData, setPerkData] = useState([]);
  const [loading, setLoading] = useState(true);
  const maxPoints = 95;

  // Initialiser les indices depuis les perks du context
  useEffect(() => {
    const heroPerks = perks[teamSlotIndex];
    
    console.log("🔍 PerkModal - perks reçues:", heroPerks);
    
    if (heroPerks) {
      // Convertir en indices (quel que soit le format)
      const indices = perksToIndices(heroPerks, heroClass, heroName);
      console.log("🔍 PerkModal - indices calculés:", indices);
      setSelectedIndices(indices);
    } else {
      setSelectedIndices([]);
    }
  }, [teamSlotIndex, perks, heroClass, heroName]);

  // Fonction pour encoder les noms de héros pour les URLs
  const encodeHeroName = (name) => {
    if (!name) return 'unknown';
    return encodeURIComponent(name.trim());
  };

  // Charger les données des perks depuis MongoDB
  useEffect(() => {
    const loadPerkData = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
        const response = await fetch(`${API_BASE_URL}/api/v2/perks`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.perks) {
            setPerkData(result.perks);
          }
        }
      } catch (error) {
        console.error("Error loading perk data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPerkData();
  }, []);

  // Fonction pour trouver une perk dans les données MongoDB
  const findPerk = (perkImageInfo, rowIndex) => {
    if (!perkImageInfo || perkData.length === 0) return null;
    
    const { name, file, tier, skill, type } = perkImageInfo;
    const heroSlugLower = heroSlug || heroName?.toLowerCase();
    
    // Chercher par thumbnail exact
    let foundPerk = perkData.find(perk => perk.thumbnail === file);
    if (foundPerk) return foundPerk;
    
    // Chercher par chemin complet pour T3/T5
    const fullPath = `heroes/${heroName}/perks/${file}`;
    foundPerk = perkData.find(perk => perk.thumbnail === fullPath);
    if (foundPerk) return foundPerk;
    
    // Pour T3/T5: chercher par héro, tier, skill et type
    if (tier === 't3' || tier === 't5') {
      foundPerk = perkData.find(perk => 
        perk.heroSlug === heroSlugLower &&
        perk.tier === tier &&
        perk.skillIndex === skill &&
        perk.type === type
      );
      if (foundPerk) return foundPerk;
    }
    
    // Chercher par nom (approximatif)
    const searchName = name.toLowerCase();
    foundPerk = perkData.find(perk => 
      perk.name.toLowerCase().includes(searchName) || 
      searchName.includes(perk.name.toLowerCase())
    );
    
    return foundPerk;
  };

  // Calculer les points utilisés
  useEffect(() => {
    const perkLayout = [
      { count: 5, cost: 10 },
      { count: 5, cost: 15 },
      { count: 4, cost: 15 },
      { count: 4, cost: 15 },
      { count: 2, cost: 15 },
    ];

    let totalPoints = 0;
    
    if (Array.isArray(selectedIndices)) {
      selectedIndices.forEach((perkIndex) => {
        const rowIndex = Math.floor(perkIndex / 10);
        const cost = perkLayout[rowIndex]?.cost || 0;
        totalPoints += cost;
      });
    }
    
    setUsedPoints(totalPoints);
  }, [selectedIndices]);

  const togglePerkSelection = (perkIndex, cost) => {
    if (!Array.isArray(selectedIndices)) return;
    
    const newPoints = selectedIndices.includes(perkIndex)
      ? usedPoints - cost
      : usedPoints + cost;

    if (newPoints > maxPoints && !selectedIndices.includes(perkIndex)) {
      alert(
        `Cannot select this perk! You would exceed the ${maxPoints} point limit.`
      );
      return;
    }

    setSelectedIndices((prev) => {
      if (prev.includes(perkIndex)) {
        return prev.filter((p) => p !== perkIndex);
      } else {
        return [...prev, perkIndex];
      }
    });
  };

  const handleConfirm = () => {
    console.log("💾 PerkModal - Indices sélectionnés:", selectedIndices);
    
    // Convertir les indices en structure organisée
    const perksData = indicesToPerks(selectedIndices, heroClass, heroName);
    console.log("💾 PerkModal - Structure à sauvegarder:", perksData);
    
    updatePerks(teamSlotIndex, perksData);
    onClose();
  };

  // Gérer le hover sur une perk - AVEC LES DONNÉES MONGODB
  const handlePerkHover = (perkImageInfo, e) => {
    if (!perkImageInfo) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      left: rect.left + rect.width / 2,
      top: rect.top - 10,
      transform: "translateX(-50%) translateY(-100%)",
    };

    const getRowCost = (rowIndex) => {
      const costs = [10, 15, 15, 15, 15];
      return costs[rowIndex] || 15;
    };

    const rowIndex = Math.floor(perkImageInfo.index / 10);
    const cost = getRowCost(rowIndex);

    // Trouver la perk dans les données MongoDB
    const perkInfo = findPerk(perkImageInfo, rowIndex);

    let displayName = "Unknown Perk";
    
    if (perkImageInfo.tier === 't3' && perkImageInfo.skill) {
      const typeName = perkImageInfo.type === 'light' ? 'Light' : 'Dark';
      displayName = `Skill ${perkImageInfo.skill} - ${typeName}`;
    } else if (perkImageInfo.tier === 't5') {
      const typeName = perkImageInfo.type === 'light' ? 'Light' : 'Dark';
      displayName = `${typeName} Transcendence`;
    } else {
      displayName = perkInfo?.name || perkImageInfo.name || "Unknown Perk";
    }

    // Utiliser la description de MongoDB si disponible
    let description = "No description available";
    if (perkInfo?.description) {
      description = perkInfo.description;
    } else if (perkImageInfo?.effect) {
      description = perkImageInfo.effect;
    }

    const overlayContent = (
      <div className="perk-overlay">
        <h4 className="perk-title">{displayName}</h4>
        <p className="perk-description">{description}</p>
      </div>
    );

    showOverlay(overlayContent, position);
  };

  const renderPerkGrid = () => {
    const perkLayout = [
      { count: 5, cost: 10 },
      { count: 5, cost: 15 },
      { count: 4, cost: 15 },
      { count: 4, cost: 15 },
      { count: 2, cost: 15 },
    ];

    return (
      <div className="perk-modal-grid">
        {perkLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="perk-modal-row">
            {Array.from({ length: row.count }, (_, i) => {
              const perkIndex = rowIndex * 10 + i;
              const isSelected = selectedIndices.includes(perkIndex);
              const perkImageInfo = getPerkImageInfo(rowIndex, i, perkIndex);
              const perkInfo = perkImageInfo ? findPerk(perkImageInfo, rowIndex) : null;

              return (
                <div
                  key={perkIndex}
                  className={`perk-modal-option ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => togglePerkSelection(perkIndex, row.cost)}
                  onMouseEnter={(e) => handlePerkHover(perkImageInfo, e)}
                  onMouseLeave={hideOverlay}
                >
                  {renderPerkImage(rowIndex, i, isSelected, row.cost, perkImageInfo)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Informations d'image pour chaque perk
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

  const renderPerkImage = (rowIndex, perkIndex, isSelected, cost, perkImageInfo) => {
    if (!perkImageInfo) {
      return (
        <div className="perk-cost-fallback">
          {cost}
        </div>
      );
    }

    let imagePath = "";
    
    if (rowIndex === 0) {
      imagePath = `/kingsraid-data/assets/perks/t1/${perkImageInfo.file}`;
    } else if (rowIndex === 1 && heroClass) {
      imagePath = `/kingsraid-data/assets/perks/t2/${heroClass.toLowerCase()}/${perkImageInfo.file}`;
    } else if (rowIndex >= 2 && heroName) {
      const encodedHeroName = encodeHeroName(heroName);
      imagePath = `/kingsraid-data/assets/heroes/${encodedHeroName}/perks/${perkImageInfo.file}`;
    }

    return (
      <>
        <img
          src={imagePath}
          alt={perkImageInfo.name}
          className="perk-image"
          style={{ opacity: isSelected ? 1 : 0.4 }}
          onError={(e) => {
            console.warn(`Perk image failed to load: ${imagePath}`);
            e.target.style.display = "none";
            const fallback = e.target.nextElementSibling;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <div className="perk-fallback">
          {perkImageInfo.name.length > 8 
            ? perkImageInfo.name.substring(0, 6) + "..."
            : perkImageInfo.name}
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div>
        <h3 className="perk-modal-title">Perks - {heroName}</h3>
        <div className="perk-loading">Loading perks...</div>
      </div>
    );
  }

  console.log("🔍 DEBUG PerkModal - État final:", {
    selectedIndices,
    length: selectedIndices.length,
    usedPoints,
    heroClass,
    heroName
  });

  return (
    <div>
      <h3 className="perk-modal-title">Perks - {heroName}</h3>

      <div
        className={`perk-modal-points ${
          usedPoints > maxPoints ? "over-limit" : ""
        }`}
      >
        <div>
          Points used: <span>{usedPoints}</span> / {maxPoints}
        </div>
      </div>

      {renderPerkGrid()}

      <div className="btn-modal">
        <button onClick={onClose} className="btn-modal-cancel">
          Cancel
        </button>
        <button onClick={handleConfirm} className="btn-modal-confirm">
          Confirm
        </button>
      </div>
    </div>
  );
};

export default PerkModal;