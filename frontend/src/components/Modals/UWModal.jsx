// frontend/src/components/Modals/UWModal.jsx
import { useEffect, useRef, useState } from "react";
import { useOverlay } from "../../contexts/OverlayContext";
import { useTeam } from "../../contexts/TeamContext";
import ItemOverlay from "./ItemOverlay";
import StarRating from "./StarRating";
import "./UWModal.css";

const UWModal = ({ data, onClose }) => {
  const {
    teamSlotIndex,
    subSlotIndex,
    heroName,
    heroSlug,
    currentItem,
    currentStars,
    currentAdvancement,
  } = data;
  const { updateSubSlot, updateAdvancement } = useTeam();
  const { showOverlay, hideOverlay } = useOverlay();

  // console.log("🚀 UWModal - Données initiales:", {
  //   teamSlotIndex,
  //   subSlotIndex,
  //   heroName,
  //   heroSlug,
  //   currentItem,
  //   currentStars,
  //   currentAdvancement,
  //   typeCurrentAdvancement: typeof currentAdvancement
  // });

  const [selectedOption, setSelectedOption] = useState(
    currentItem ? "uw" : "empty"
  );
  const [selectedStars, setSelectedStars] = useState(currentStars || 0);
  
  // 🔥 Stocker en STRING pour éviter les problèmes de comparaison
  const [selectedAdvancement, setSelectedAdvancement] = useState(() => {
    // console.log("📋 UWModal - Initialisation advancement:", {
    //   original: currentAdvancement,
    //   type: typeof currentAdvancement,
    //   "=== null": currentAdvancement === null,
    //   "=== 0": currentAdvancement === 0,
    //   "=== '0'": currentAdvancement === "0",
    //   "=== 1": currentAdvancement === 1,
    //   "=== '1'": currentAdvancement === "1",
    //   "=== 2": currentAdvancement === 2,
    //   "=== '2'": currentAdvancement === "2",
    //   "=== 'none'": currentAdvancement === "none",
    //   "=== 'blue'": currentAdvancement === "blue",
    //   "=== 'purple'": currentAdvancement === "purple",
    //   "=== 'red'": currentAdvancement === "red"
    // });
    
    // Convertir TOUT en string
    const value = currentAdvancement;
    
    if (value === null || value === "null") return "null";
    if (value === 0 || value === "0") return "0";
    if (value === 1 || value === "1") return "1";
    if (value === 2 || value === "2") return "2";
    
    // Conversion depuis les anciennes valeurs
    if (value === "none") return "null";
    if (value === "blue") return "0";
    if (value === "purple") return "1";
    if (value === "red") return "2";
    
    console.warn("⚠️ UWModal - Valeur advancement inconnue, default 'null':", value);
    return "null"; // Par défaut
  });
  
  const [hoveredAdvancement, setHoveredAdvancement] = useState(null);
  const [heroData, setHeroData] = useState(null);
  const [heroFullName, setHeroFullName] = useState(null);
  const uwItemRef = useRef(null);

  // 🔥 Debogage
  useEffect(() => {
    // console.log("🔍 UWModal - State advancement:", {
    //   selected: selectedAdvancement,
    //   type: typeof selectedAdvancement,
    //   isStringZero: selectedAdvancement === "0",
    //   isNumberZero: selectedAdvancement === 0,
    //   isNull: selectedAdvancement === null,
    //   isUndefined: selectedAdvancement === undefined
    // });
  }, [selectedAdvancement]);

  // Charger les données du héros
  useEffect(() => {
    const loadHeroData = async () => {
      try {
        const slug = heroSlug || heroName?.toLowerCase().replace(/\s+/g, '-');
        
        if (!slug) {
          console.warn("No hero slug or name provided");
          return;
        }
        
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
        const response = await fetch(`${API_BASE_URL}/api/v2/heroes/${slug}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();

        if (result.success && result.hero) {
          setHeroData(result.hero);
          setHeroFullName(result.hero.name || result.hero.infos?.name || heroName);
          console.log("✅ UWModal - Données héros chargées:", result.hero.name);
        } else {
          throw new Error("No hero data found");
        }
      } catch (error) {
        console.error("Error loading hero data from MongoDB:", error);
        
        try {
          const fallbackName = heroName || heroSlug;
          const fallbackResponse = await fetch(
            `/kingsraid-data/table-data/heroes/${fallbackName}.json`
          );
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setHeroData(fallbackData);
            setHeroFullName(fallbackData.name || fallbackData.infos?.name || heroName);
            console.log("✅ UWModal - Données héros fallback chargées");
          }
        } catch (fallbackError) {
          console.error("Error loading fallback hero data:", fallbackError);
          setHeroFullName(heroName);
        }
      }
    };
    
    if (heroName || heroSlug) {
      loadHeroData();
    } else {
      setHeroFullName(heroSlug);
    }
  }, [heroName, heroSlug]);

  const getUWImagePath = () => {
    const nameToUse = heroFullName || heroName || heroSlug || 'unknown';
    const encodedName = encodeURIComponent(nameToUse);
    const path = `/kingsraid-data/assets/heroes/${encodedName}/uw.png`;
    // console.log("🖼 UWModal - UW Image Path:", path);
    return path;
  };

  const getAdvancementImagePath = (fileName) => {
    const path = `/kingsraid-data/assets/advancements/${fileName}`;
    // console.log("🖼 UWModal - Advancement Image Path:", path);
    return path;
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // console.log("🎯 UWModal - handleConfirm DÉBUT ====================");
    // console.log("- Selected option:", selectedOption);
    // console.log("- Selected stars:", selectedStars);
    // console.log("- Selected advancement (string):", selectedAdvancement);
    // console.log("- Type selectedAdvancement:", typeof selectedAdvancement);
    // console.log("- teamSlotIndex:", teamSlotIndex);
    // console.log("- subSlotIndex:", subSlotIndex);

    if (selectedOption === "empty") {
      // console.log("🗑 UWModal - Option 'empty' sélectionnée");
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
      updateAdvancement(teamSlotIndex, null);
    } else {
      // console.log("🗡 UWModal - Option 'uw' sélectionnée");
      const uwObject = {
        uwPath: getUWImagePath(),
        heroSlug: heroSlug || heroName?.toLowerCase().replace(/\s+/g, '-'),
        heroName: heroName,
        stars: selectedStars
      };
      
      // console.log("📤 UWModal - uwObject créé:", uwObject);
      updateSubSlot(teamSlotIndex, subSlotIndex, uwObject, selectedStars);
      
      // 🔥 CONVERTIR STRING -> null/0/1/2 pour updateAdvancement
      let advancementValue = null;
      
      // console.log("🔄 UWModal - Conversion advancement:");
      // console.log("   selectedAdvancement =", selectedAdvancement);
      // console.log("   selectedAdvancement === '0' ?", selectedAdvancement === "0");
      // console.log("   selectedAdvancement === '1' ?", selectedAdvancement === "1");
      // console.log("   selectedAdvancement === '2' ?", selectedAdvancement === "2");
      
      if (selectedAdvancement === "0") {
        advancementValue = 0;
        // console.log("   → Conversion '0' -> 0");
      } else if (selectedAdvancement === "1") {
        advancementValue = 1;
        // console.log("   → Conversion '1' -> 1");
      } else if (selectedAdvancement === "2") {
        advancementValue = 2;
        // console.log("   → Conversion '2' -> 2");
      } else {
        // console.log("   → Garde null (selectedAdvancement =", selectedAdvancement, ")");
      }
      
      // console.log("🎯 UWModal - APRÈS conversion:");
      // console.log("   - advancementValue:", advancementValue);
      // console.log("   - Type advancementValue:", typeof advancementValue);
      // console.log("   - Est-ce 0 exact? (===)", advancementValue === 0);
      // console.log("   - Est-ce '0'? (===)", advancementValue === "0");
      // console.log("   - Est-ce null? (===)", advancementValue === null);
      // console.log("   - Valeurs acceptées? [null, 0, 1, 2].includes:", [null, 0, 1, 2].includes(advancementValue));
      
      // console.log("📤 UWModal - Appel updateAdvancement avec:", {
      //   slotIndex: teamSlotIndex,
      //   advancementValue,
      //   type: typeof advancementValue
      // });
      
      updateAdvancement(teamSlotIndex, advancementValue);
    }
    
    // console.log("✅ UWModal - handleConfirm FIN ====================");
    onClose();
  };

  const getUWData = () => {
    if (!heroData) {
      // console.log("❌ UWModal - Pas de heroData");
      return null;
    }
    
    if (heroData.uw) {
      // console.log("✅ UWModal - UW trouvé dans heroData.uw");
      return heroData.uw;
    }
    
    if (heroData.rawData?.uw) {
      // console.log("✅ UWModal - UW trouvé dans heroData.rawData.uw");
      return heroData.rawData.uw;
    }
    
    // console.log("❌ UWModal - Pas de données UW trouvées");
    return null;
  };

  const handleUWHover = (e) => {
    // console.log("🖱 UWModal - handleUWHover");
    const uwData = getUWData();
    if (!uwData) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      left: rect.left + rect.width / 2,
      top: rect.top,
      transform: "translateX(-50%) translateY(-100%)",
    };

    const values = uwData.value || {};
    
    showOverlay(
      <ItemOverlay
        title={uwData.name || "Unique Weapon"}
        stars={selectedStars}
        description={uwData.description || ""}
        values={values}
        itemType="uw"
      />,
      position
    );
  };

  const handleUWImageError = (e) => {
    console.warn(`❌ UWModal - UW image failed to load: ${e.target.src}`);
    e.target.style.display = "none";
    const fallback = e.target.nextElementSibling;
    if (fallback) {
      fallback.style.display = "flex";
    }
  };

  const renderAdvancementOptions = () => {
    // console.log("🎨 UWModal - renderAdvancementOptions");
    
    const advancements = [
      {
        id: "none",
        value: "null",
        label: "None",
        image: getAdvancementImagePath("none.png"),
      },
      {
        id: "blue",
        value: "0",
        label: "Blue",
        image: getAdvancementImagePath("blue.png"),
      },
      {
        id: "purple",
        value: "1",
        label: "Purple",
        image: getAdvancementImagePath("purple.png"),
      },
      {
        id: "red",
        value: "2",
        label: "Red",
        image: getAdvancementImagePath("red.png"),
      },
    ];

    return (
      <div className="advancement-options">
        {advancements.map((adv) => {
          const isSelected = selectedAdvancement === adv.value;
          
          // console.log(`🔘 ${adv.label}:`, {
          //   value: adv.value,
          //   selected: selectedAdvancement,
          //   isSelected,
          //   comparison: `'${adv.value}' === '${selectedAdvancement}'? ${adv.value === selectedAdvancement}`
          // });
          
          return (
            <div
              key={adv.id}
              className={`advancement-option ${isSelected ? "selected" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // console.log(`🎯 UWModal - Advancement ${adv.label} cliqué:`, {
                //   value: adv.value,
                //   type: typeof adv.value,
                //   previous: selectedAdvancement
                // });
                setSelectedAdvancement(adv.value);
              }}
              onMouseEnter={() => {
                // console.log(`🖱 UWModal - Hover sur ${adv.label}`);
                setHoveredAdvancement(adv.value);
              }}
              onMouseLeave={() => {
                // console.log(`🖱 UWModal - Leave sur ${adv.label}`);
                setHoveredAdvancement(null);
              }}
            >
              <div className="advancement-image-container">
                <img
                  src={adv.image}
                  className="advancement-image"
                  alt={adv.label}
                  onError={(e) => {
                    console.error(`❌ UWModal - Advancement image failed to load: ${adv.image}`);
                    e.target.style.display = "none";
                  }}
                />
                
                {/* Border hover */}
                <div
                  className="advancement-border hover-border"
                  style={{
                    opacity: hoveredAdvancement === adv.value ? 1 : 0,
                  }}
                >
                  <img
                    src={getAdvancementImagePath("border-hover.png")}
                    alt="hover border"
                    onError={(e) => {
                      console.error("❌ UWModal - Border hover image failed to load");
                      e.target.style.display = "none";
                    }}
                  />
                </div>
                
                {/* Border selected */}
                <div
                  className="advancement-border selected-border"
                  style={{
                    opacity: isSelected ? 1 : 0,
                  }}
                >
                  <img
                    src={getAdvancementImagePath("border-selected.png")}
                    alt="selected border"
                    onError={(e) => {
                      console.error("❌ UWModal - Border selected image failed to load");
                      e.target.style.display = "none";
                    }}
                  />
                </div>
                
                {/* Indicateur de sélection */}
                {isSelected && (
                  <div className="advancement-selected-indicator">
                    <div className="selection-dot"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="uw-modal-container">
      <h3 className="uw-modal-title">
        Unique Weapon - {heroName || heroSlug}
      </h3>

      <div className="uw-options-container">
        <div
          className={`uw-option empty ${
            selectedOption === "empty" ? "selected" : ""
          }`}
          onClick={() => {
            // console.log("🎯 UWModal - Option 'empty' cliquée");
            setSelectedOption("empty");
          }}
        >
          <div className="empty-slot-label">Empty</div>
        </div>

        <div
          ref={uwItemRef}
          className={`uw-option ${selectedOption === "uw" ? "selected" : ""}`}
          onClick={() => {
            // console.log("🎯 UWModal - Option 'uw' cliquée");
            setSelectedOption("uw");
          }}
          onMouseEnter={handleUWHover}
          onMouseLeave={() => {
            // console.log("🖱 UWModal - UW mouse leave");
            hideOverlay();
          }}
        >
          <img
            src={getUWImagePath()}
            alt="UW"
            className="uw-image"
            onError={handleUWImageError}
          />
          <div className="uw-fallback">
            UW
          </div>
          {selectedOption === "uw" && (
            <div className="uw-selected-indicator">✓</div>
          )}
        </div>
      </div>

      {selectedOption === "uw" && (
        <div className="uw-stars-section">
          <StarRating
            value={selectedStars}
            onChange={(stars) => {
              // console.log("⭐ UWModal - Stars changées:", stars);
              setSelectedStars(stars);
            }}
            maxStars={5}
            showZeroOption={true}
            size="medium"
          />
        </div>
      )}

      {selectedOption === "uw" && (
        <div className="uw-advancement-section">
          <h4 className="uw-modal-subtitle">Soul Weapon</h4>
          {renderAdvancementOptions()}
        </div>
      )}

      <div className="btn-modal">
        <button 
          onClick={() => {
            // console.log("❌ UWModal - Cancel cliqué");
            onClose();
          }} 
          className="btn-modal-cancel"
        >
          Cancel
        </button>
        <button 
          onClick={handleConfirm} 
          className="btn-modal-confirm"
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default UWModal;