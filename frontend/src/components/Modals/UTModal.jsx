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

  useEffect(() => {
    const loadHeroData = async () => {
      try {
        const response = await fetch(`/api/heroes/${heroName}`);
        const data = await response.json();
        setHeroData(data);
      } catch (error) {
        console.error("Error loading hero data from MongoDB:", error);
        try {
          const fallbackResponse = await fetch(
            `/kingsraid-data/table-data/heroes/${heroName}.json`
          );
          const fallbackData = await fallbackResponse.json();
          setHeroData(fallbackData);
        } catch (fallbackError) {
          console.error("Error loading fallback hero data:", fallbackError);
        }
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

  const getUTData = (utNumber) => {
    if (!heroData) return null;
    
    if (heroData.uts) {
      return heroData.uts[utNumber.toString()] || heroData.uts[utNumber];
    }
    
    return null;
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

  return (
    <div>
      <h3 className="ut-modal-title">Unique Treasure - {heroName}</h3>

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
                onError={(e) => {
                  e.target.style.display = "none";
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div className="ut-fallback">
                UT{utNumber}
              </div>
            </div>
          );
        })}
      </div>

      <div className="ut-empty-container">
        <div
          className={`ut-option empty ${selectedUT === 0 ? "selected" : ""}`}
          onClick={() => setSelectedUT(0)}
        >
          Empty
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