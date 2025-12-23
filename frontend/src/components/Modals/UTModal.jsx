// frontend/src/components/Modals/UTModal.jsx
import { useEffect, useRef, useState } from "react";
import { useOverlay } from "../../contexts/OverlayContext";
import { useTeam } from "../../contexts/TeamContext";
import ItemOverlay from "./ItemOverlay";
import StarRating from "./StarRating";
import "./UTModal.css";

const UTModal = ({ data, onClose }) => {
  const { teamSlotIndex, subSlotIndex, heroName, heroSlug, currentItem, currentStars } =
    data;
  const { updateSubSlot } = useTeam();
  const { showOverlay, hideOverlay } = useOverlay();

  // Déterminer l'UT actuellement sélectionnée
  const getInitialSelectedUT = () => {
    if (!currentItem) return 0;
    
    // Si currentItem est un objet (nouveau format)
    if (typeof currentItem === 'object') {
      return currentItem.choice || 0;
    }
    
    // Si c'est un chemin (ancien format)
    if (typeof currentItem === 'string') {
      const match = currentItem.match(/ut\/(\d+)\.png$/);
      return match ? parseInt(match[1]) : 0;
    }
    
    return 0;
  };

  const [selectedUT, setSelectedUT] = useState(getInitialSelectedUT());
  const [selectedStars, setSelectedStars] = useState(currentStars || 0);
  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const itemRefs = useRef({});

  useEffect(() => {
    const loadHeroData = async () => {
      try {
        setLoading(true);
        
        // Utiliser le slug si fourni, sinon convertir le nom
        const slug = heroSlug || heroName?.toLowerCase().replace(/\s+/g, '-');
        
        if (!slug) {
          console.warn("No hero slug or name provided for UT modal");
          setLoading(false);
          return;
        }
        
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
        const response = await fetch(`${API_BASE_URL}/api/v2/heroes/${slug}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();

        if (result.success && result.hero) {
          console.log("UT data loaded from MongoDB for:", slug);
          setHeroData(result.hero);
        } else {
          throw new Error("No hero data found");
        }
      } catch (error) {
        console.error("Error loading hero data for UT modal:", error);
        
        // Fallback vers l'ancien système (fichiers JSON)
        try {
          const fallbackName = heroName || heroSlug;
          const fallbackResponse = await fetch(
            `/kingsraid-data/table-data/heroes/${fallbackName}.json`
          );
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setHeroData(fallbackData);
          }
        } catch (fallbackError) {
          console.error("Error loading fallback hero data:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (heroName || heroSlug) {
      loadHeroData();
    } else {
      setLoading(false);
    }
  }, [heroName, heroSlug]);

  // Fonction pour obtenir le chemin de l'image UT
  const getUTImagePath = (utNumber) => {
    const heroSlugOrName = heroSlug || heroName?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
    return `/kingsraid-data/assets/heroes/${heroName}/ut/${utNumber}.png`;
  };

  const handleConfirm = () => {
    if (selectedUT === 0) {
      // UT vide
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
    } else {
      // Créer l'objet UT pour la sauvegarde (compatible nouveau format)
      const utObject = {
        choice: selectedUT,
        utPath: getUTImagePath(selectedUT),
        heroSlug: heroSlug || heroName?.toLowerCase().replace(/\s+/g, '-'),
        heroName: heroName,
        stars: selectedStars
      };
      
      updateSubSlot(teamSlotIndex, subSlotIndex, utObject, selectedStars);
    }
    onClose();
  };

  const getUTData = (utNumber) => {
    if (!heroData || !utNumber) return null;
    
    // Essayer plusieurs structures possibles
    if (heroData.uts) {
      // Support pour Map/object avec clés string
      return heroData.uts[utNumber.toString()] || heroData.uts[utNumber];
    }
    
    // Structure dans rawData
    if (heroData.rawData?.uts) {
      return heroData.rawData.uts[utNumber.toString()] || heroData.rawData.uts[utNumber];
    }
    
    return null;
  };

  // Obtenir le nombre d'UTs disponibles pour ce héros
  const getAvailableUTs = () => {
    if (!heroData) return [1, 2, 3, 4]; // Par défaut, afficher tous
    
    // Compter les UTs disponibles dans les données
    const utsCount = heroData.utsCount || 
                    (heroData.uts ? Object.keys(heroData.uts).length : 0) ||
                    (heroData.rawData?.uts ? Object.keys(heroData.rawData.uts).length : 0);
    
    // Si on connaît le nombre, limiter l'affichage
    if (utsCount > 0 && utsCount < 4) {
      return Array.from({ length: utsCount }, (_, i) => i + 1);
    }
    
    // Par défaut, afficher jusqu'à 4 UTs
    return [1, 2, 3, 4];
  };

  const handleUTHover = (utNumber, e) => {
    const utData = getUTData(utNumber);
    if (!utData) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      left: rect.left + rect.width / 2,
      top: rect.top,
      transform: "translateX(-50%) translateY(-100%)",
    };

    const values = utData.value || {};
    
    showOverlay(
      <ItemOverlay
        title={utData.name || `UT${utNumber}`}
        stars={selectedStars}
        description={utData.description || ""}
        values={values}
        itemType="ut"
      />,
      position
    );
  };

  // Gérer les erreurs de chargement d'image UT
  const handleUTImageError = (e, utNumber) => {
    console.warn(`UT${utNumber} image failed to load: ${e.target.src}`);
    e.target.style.display = "none";
    const fallback = e.target.nextElementSibling;
    if (fallback) {
      fallback.style.display = "flex";
    }
  };

  const availableUTs = getAvailableUTs();

  return (
    <div className="ut-modal-container">
      <h3 className="ut-modal-title">
        Unique Treasure - {heroName || heroSlug}
      </h3>

      {loading ? (
        <div className="ut-loading">Loading hero data...</div>
      ) : (
        <>
          <div className="ut-grid">
            {availableUTs.map((utNumber) => {
              const isSelected = selectedUT === utNumber;
              const utData = getUTData(utNumber);
              const utName = utData?.name || `UT${utNumber}`;

              return (
                <div
                  key={utNumber}
                  ref={(el) => (itemRefs.current[utNumber] = el)}
                  className={`ut-option ${isSelected ? "selected" : ""} ${
                    !utData ? "unavailable" : ""
                  }`}
                  onClick={() => utData && setSelectedUT(utNumber)}
                  onMouseEnter={(e) => utData && handleUTHover(utNumber, e)}
                  onMouseLeave={hideOverlay}
                  title={utName}
                >
                  <img
                    src={getUTImagePath(utNumber)}
                    alt="{`UT${utNumber}`}"
                    className="ut-image"
                    onError={(e) => handleUTImageError(e, utNumber)}
                  />
                  <div className="ut-fallback">
                    UT{utNumber}
                  </div>
                  {isSelected && (
                    <div className="ut-selected-indicator">✓</div>
                  )}
                  {!utData && (
                    <div className="ut-unavailable-overlay">
                      <div className="ut-unavailable-text">N/A</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="ut-empty-container">
            <div
              className={`ut-option empty ${selectedUT === 0 ? "selected" : ""}`}
              onClick={() => setSelectedUT(0)}
            >
              <div className="empty-slot-label">Empty</div>
            </div>
          </div>

          {selectedUT > 0 && (
            <div className="ut-stars-section">
              <StarRating
                value={selectedStars}
                onChange={setSelectedStars}
                maxStars={5}
                showZeroOption={true}
              />
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
        </>
      )}
    </div>
  );
};

export default UTModal;