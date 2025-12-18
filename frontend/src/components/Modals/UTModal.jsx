import { useEffect, useRef, useState } from "react";
import { useOverlay } from "../../contexts/OverlayContext";
import { useTeam } from "../../contexts/TeamContext";
import ItemOverlay from "./ItemOverlay";
import StarRating from "./StarRating";
import "./UTModal.css";

const UTModal = ({ data, onClose }) => {
  const { teamSlotIndex, subSlotIndex, heroName, currentItem, currentStars } =
    data;
  const { updateSubSlot } = useTeam();
  const { showOverlay, hideOverlay } = useOverlay();

  const [selectedUT, setSelectedUT] = useState(
    currentItem ? parseInt(currentItem.split("/ut/")[1]?.split(".")[0]) || 1 : 0
  );
  const [selectedStars, setSelectedStars] = useState(currentStars);
  const [heroData, setHeroData] = useState(null);
  const itemRefs = useRef({});

  // Charger les données du héros
  useEffect(() => {
    const loadHeroData = async () => {
      try {
        const response = await fetch(
          `/kingsraid-data/table-data/heroes/${heroName}.json`
        );
        const data = await response.json();
        setHeroData(data);
      } catch (error) {
        console.error("Error loading hero data:", error);
      }
    };
    loadHeroData();
  }, [heroName]);

  const handleConfirm = () => {
    if (selectedUT === 0) {
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
    } else {
      const utPath = `/kingsraid-data/assets/heroes/${heroName}/ut/${selectedUT}.png`;
      updateSubSlot(teamSlotIndex, subSlotIndex, utPath, selectedStars);
    }
    onClose();
  };

  // Obtenir les données de l'UT sélectionné
  const getUTData = (utNumber) => {
    if (!heroData?.uts) return null;
    return heroData.uts[utNumber.toString()];
  };

  // Gérer le hover sur un UT
  const handleUTHover = (utNumber, e) => {
    const utData = getUTData(utNumber);
    if (!utData) return;

    const rect = e.currentTarget.getBoundingClientRect();

    // Position au-dessus de l'item
    const position = {
      left: rect.left + rect.width / 2,
      top: rect.top,
      transform: "translateX(-50%) translateY(-100%)",
    };

    showOverlay(
      <ItemOverlay
        title={utData.name}
        stars={selectedStars}
        description={utData.description}
        values={utData.value}
        itemType="ut"
      />,
      position
    );
  };

  return (
    <div>
      {/* Titre */}
      <h3 className="ut-modal-title">Unique Treasure - {heroName}</h3>

      {/* Options UT */}
      <div className="ut-grid">
        {[1, 2, 3, 4].map((utNumber) => {
          const utData = getUTData(utNumber);
          const isSelected = selectedUT === utNumber;

          return (
            <div
              key={utNumber}
              ref={(el) => (itemRefs.current[utNumber] = el)}
              className={`ut-option ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedUT(utNumber)}
              onMouseEnter={(e) => handleUTHover(utNumber, e)}
              onMouseLeave={hideOverlay}
            >
              <img
                src={`/kingsraid-data/assets/heroes/${heroName}/ut/${utNumber}.png`}
                alt={`UT${utNumber}`}
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  e.target.style.display = "none";
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div className="hidden w-full h-full items-center justify-center text-neutral-400 text-xs bg-neutral-800 rounded">
                UT{utNumber}
              </div>
            </div>
          );
        })}
      </div>

      {/* Option Empty */}
      <div className="ut-empty-container">
        <div
          className={`ut-option empty ${selectedUT === 0 ? "selected" : ""}`}
          onClick={() => setSelectedUT(0)}
        >
          Empty
        </div>
      </div>

      {/* Stars */}
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

      {/* Boutons */}
      <div className="ut-modal-buttons">
        <button onClick={handleConfirm} className="ut-modal-confirm">
          Confirm
        </button>
        <button onClick={onClose} className="ut-modal-cancel">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default UTModal;
