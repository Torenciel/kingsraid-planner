// frontend/src/components/Modals/UWModal.jsx - Version corrigée
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

  const [selectedOption, setSelectedOption] = useState(
    currentItem ? "uw" : "empty"
  );
  const [selectedStars, setSelectedStars] = useState(currentStars || 0);
  const [selectedAdvancement, setSelectedAdvancement] = useState(currentAdvancement || "none");
  const [hoveredAdvancement, setHoveredAdvancement] = useState(null);
  const [heroData, setHeroData] = useState(null);
  const [heroFullName, setHeroFullName] = useState(null);
  const uwItemRef = useRef(null);

  // Charger les données du héros
  useEffect(() => {
    const loadHeroData = async () => {
      try {
        // Utiliser le slug si fourni, sinon convertir le nom
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
          console.log("Hero data loaded from MongoDB:", result.hero);
          setHeroData(result.hero);
          // Stocker le nom complet du héros
          setHeroFullName(result.hero.name || result.hero.infos?.name || heroName);
        } else {
          throw new Error("No hero data found");
        }
      } catch (error) {
        console.error("Error loading hero data from MongoDB:", error);
        
        // Fallback vers l'ancien système (fichiers JSON)
        try {
          const fallbackName = heroName || heroSlug;
          const fallbackResponse = await fetch(
            `/kingsraid-data/table-data/heroes/${fallbackName}.json`
          );
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setHeroData(fallbackData);
            setHeroFullName(fallbackData.name || fallbackData.infos?.name || heroName);
          }
        } catch (fallbackError) {
          console.error("Error loading fallback hero data:", fallbackError);
          // Utiliser heroName comme fallback
          setHeroFullName(heroName);
        }
      }
    };
    
    if (heroName || heroSlug) {
      loadHeroData();
    } else {
      // Si pas de heroName fourni, utiliser heroSlug comme fallback
      setHeroFullName(heroSlug);
    }
  }, [heroName, heroSlug]);

  // Fonction pour obtenir le chemin de l'image UW
  const getUWImagePath = () => {
    // Utiliser le nom complet du héros (avec espaces) si disponible
    const nameToUse = heroFullName || heroName || heroSlug || 'unknown';
    
    // IMPORTANT: Utiliser encodeURIComponent pour les espaces
    const encodedName = encodeURIComponent(nameToUse);
    
    // Chemin par défaut
    return `/kingsraid-data/assets/heroes/${encodedName}/uw.png`;
  };

  // Fonction pour obtenir le chemin des images d'advancement
  const getAdvancementImagePath = (fileName) => {
    return `/kingsraid-data/assets/advancements/${fileName}`;
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedOption === "empty") {
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
      updateAdvancement(teamSlotIndex, "none");
    } else {
      // Créer l'objet UW pour la sauvegarde
      const uwObject = {
        uwPath: getUWImagePath(),
        heroSlug: heroSlug || heroName?.toLowerCase().replace(/\s+/g, '-'),
        heroName: heroName,
        stars: selectedStars
      };
      
      updateSubSlot(teamSlotIndex, subSlotIndex, uwObject, selectedStars);
      updateAdvancement(teamSlotIndex, selectedAdvancement);
    }
    onClose();
  };

  // Obtenir les données UW
  const getUWData = () => {
    if (!heroData) return null;
    
    // Essayer plusieurs structures possibles
    if (heroData.uw) {
      return heroData.uw;
    }
    
    // Structure dans rawData
    if (heroData.rawData?.uw) {
      return heroData.rawData.uw;
    }
    
    return null;
  };

  // Gérer le hover sur l'UW
  const handleUWHover = (e) => {
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

  // Gérer les erreurs de chargement d'image UW
  const handleUWImageError = (e) => {
    console.warn(`UW image failed to load: ${e.target.src}`);
    e.target.style.display = "none";
    const fallback = e.target.nextElementSibling;
    if (fallback) {
      fallback.style.display = "flex";
    }
  };

  const renderAdvancementOptions = () => {
    const advancements = [
      {
        id: "none",
        label: "None",
        image: getAdvancementImagePath("none.png"),
      },
      {
        id: "blue",
        label: "Blue",
        image: getAdvancementImagePath("blue.png"),
      },
      {
        id: "purple",
        label: "Purple",
        image: getAdvancementImagePath("purple.png"),
      },
      {
        id: "red",
        label: "Red",
        image: getAdvancementImagePath("red.png"),
      },
    ];

    return (
      <div className="advancement-options">
        {advancements.map((adv) => (
          <div
            key={adv.id}
            className={`advancement-option ${
              selectedAdvancement === adv.id ? "selected" : ""
            }`}
            onClick={() => setSelectedAdvancement(adv.id)}
            onMouseEnter={() => setHoveredAdvancement(adv.id)}
            onMouseLeave={() => setHoveredAdvancement(null)}
          >
            <div className="advancement-image-container">
              <img
                src={adv.image}
                className="advancement-image"
                onError={(e) => {
                  console.error(`Advancement image failed to load: ${adv.image}`);
                  e.target.style.display = "none";
                }}
              />
              <div
                className="advancement-border"
                style={{
                  opacity: hoveredAdvancement === adv.id ? 1 : 0,
                }}
              >
                <img
                  src={getAdvancementImagePath("border-hover.png")}
                  alt="hover border"
                  onError={(e) => e.target.style.display = "none"}
                />
              </div>
              <div
                className="advancement-border"
                style={{
                  opacity: selectedAdvancement === adv.id ? 1 : 0,
                }}
              >
                <img
                  src={getAdvancementImagePath("border-selected.png")}
                  alt="selected border"
                  onError={(e) => e.target.style.display = "none"}
                />
              </div>
            </div>

          </div>
        ))}
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
          onClick={() => setSelectedOption("empty")}
        >
          <div className="empty-slot-label">Empty</div>
        </div>

        <div
          ref={uwItemRef}
          className={`uw-option ${selectedOption === "uw" ? "selected" : ""}`}
          onClick={() => setSelectedOption("uw")}
          onMouseEnter={handleUWHover}
          onMouseLeave={hideOverlay}
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
            onChange={setSelectedStars}
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
        <button onClick={handleConfirm} className="btn-modal-confirm">
          Confirm
        </button>
        <button onClick={onClose} className="btn-modal-cancel">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default UWModal;