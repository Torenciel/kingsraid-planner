import { useEffect, useState } from "react";
import { useOverlay } from "../../contexts/OverlayContext";
import { useTeam } from "../../contexts/TeamContext";
import ItemOverlay from "./ItemOverlay";
import StarRating from "./StarRating";
import "./UTModal.css";

const UTModal = ({ data, onClose }) => {
  const {
    teamSlotIndex,
    subSlotIndex,
    heroName,
    heroSlug,
    currentItem,
    currentStars,
  } = data;

  const { updateSubSlot } = useTeam();
  const { showOverlay, hideOverlay } = useOverlay();

  const getSlug = () =>
    heroSlug ||
    heroName?.toLowerCase().replace(/\s+/g, "-") ||
    null;

  const getInitialSelectedUT = () => {
    if (!currentItem) return 0;

    if (typeof currentItem === "object") {
      return currentItem.choice || 0;
    }

    if (typeof currentItem === "string") {
      const match = currentItem.match(/ut\/(\d+)\.png$/);
      return match ? parseInt(match[1]) : 0;
    }

    return 0;
  };

  const [selectedUT, setSelectedUT] = useState(getInitialSelectedUT());
  const [selectedStars, setSelectedStars] = useState(currentStars || 0);
  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHeroData = async () => {
      const slug = getSlug();
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const API_BASE_URL =
          process.env.REACT_APP_API_URL || "http://localhost:3002";

        const response = await fetch(
          `${API_BASE_URL}/api/v2/heroes/${slug}`
        );

        if (!response.ok) throw new Error();

        const result = await response.json();

        if (result.success && result.hero) {
          setHeroData(result.hero);
        } else {
          throw new Error();
        }
      } catch {
        // Fallback JSON
        try {
          const fallbackResponse = await fetch(
            `/kingsraid-data/table-data/heroes/${heroName}.json`
          );

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setHeroData(fallbackData);
          }
        } catch {
          // silent fail
        }
      } finally {
        setLoading(false);
      }
    };

    loadHeroData();
  }, [heroName, heroSlug]);

  const getUTImagePath = (utNumber) => {
    return `/kingsraid-data/assets/heroes/${heroName}/ut/${utNumber}.png`;
  };

  const handleRemove = () => {
    updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
    onClose();
  };

  const handleConfirm = () => {
    const utObject =
      selectedUT === 0
        ? { choice: 0, stars: 0 }
        : { choice: selectedUT, stars: selectedStars };

    updateSubSlot(
      teamSlotIndex,
      subSlotIndex,
      utObject,
      selectedStars
    );

    onClose();
  };

  const getUTData = (utNumber) => {
    if (!heroData || !utNumber) return null;

    return (
      heroData.uts?.[utNumber] ||
      heroData.uts?.[utNumber.toString()] ||
      heroData.rawData?.uts?.[utNumber] ||
      heroData.rawData?.uts?.[utNumber.toString()] ||
      null
    );
  };

  const getAvailableUTs = () => {
    if (!heroData) return [1, 2, 3, 4];

    const count =
      heroData.utsCount ||
      Object.keys(heroData.uts || {}).length ||
      Object.keys(heroData.rawData?.uts || {}).length;

    if (count > 0 && count < 4) {
      return Array.from({ length: count }, (_, i) => i + 1);
    }

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

    showOverlay(
      <ItemOverlay
        title={utData.name || `UT${utNumber}`}
        stars={selectedStars}
        description={utData.description || ""}
        values={utData.value || {}}
      />,
      position
    );
  };

  const handleUTImageError = (e) => {
    e.target.style.display = "none";
    const fallback = e.target.nextElementSibling;
    if (fallback) fallback.style.display = "flex";
  };

  const availableUTs = getAvailableUTs();

  return (
    <div className="ut-modal-container">
      <h3 className="ut-modal-title">Unique Treasure</h3>

      {loading ? (
        <div className="ut-loading">Loading hero data...</div>
      ) : (
        <>
          <div className="ut-grid">
            {availableUTs.map((utNumber) => {
              const isSelected = selectedUT === utNumber;
              const utData = getUTData(utNumber);

              return (
                <div
                  key={utNumber}
                  className={`ut-option ${isSelected ? "selected" : ""} ${
                    !utData ? "unavailable" : ""
                  }`}
                  onClick={() => utData && setSelectedUT(utNumber)}
                  onMouseEnter={(e) =>
                    utData && handleUTHover(utNumber, e)
                  }
                  onMouseLeave={hideOverlay}
                >
                  <img
                    src={getUTImagePath(utNumber)}
                    alt={`UT${utNumber}`}
                    className="ut-image"
                    onError={handleUTImageError}
                  />
                  <div className="ut-fallback">UT{utNumber}</div>

                  {isSelected && (
                    <div className="ut-selected-indicator">✓</div>
                  )}

                  {!utData && (
                    <div className="ut-unavailable-overlay">
                      <div className="ut-unavailable-text">
                        N/A
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedUT > 0 && (
            <div className="ut-stars-section">
              <StarRating
                value={selectedStars}
                onChange={setSelectedStars}
                maxStars={5}
                showZeroOption
              />
            </div>
          )}

          <div className="btn-modal">
            {currentItem && currentItem.choice > 0 && (
              <button onClick={handleRemove} className="btn-modal-remove">Remove</button>
            )}
            <button onClick={onClose} className="btn-modal-cancel">Cancel</button>
            <button onClick={handleConfirm} className="btn-modal-confirm">Confirm</button>
          </div>
        </>
      )}
    </div>
  );
};

export default UTModal;
