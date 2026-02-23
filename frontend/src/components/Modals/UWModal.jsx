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

  const [selectedAdvancement, setSelectedAdvancement] = useState(() => {
    const value = currentAdvancement;

    if (value === null || value === "null") return "null";
    if (value === 0 || value === "0") return "0";
    if (value === 1 || value === "1") return "1";
    if (value === 2 || value === "2") return "2";

    if (value === "none") return "null";
    if (value === "blue") return "0";
    if (value === "purple") return "1";
    if (value === "red") return "2";

    return "null";
  });

  const [hoveredAdvancement, setHoveredAdvancement] = useState(null);
  const [heroData, setHeroData] = useState(null);
  const [heroFullName, setHeroFullName] = useState(null);
  const uwItemRef = useRef(null);

  useEffect(() => {}, [selectedAdvancement]);

  useEffect(() => {
    const loadHeroData = async () => {
      try {
        const slug =
          heroSlug || heroName?.toLowerCase().replace(/\s+/g, "-");

        if (!slug) {
          return;
        }

        const API_BASE_URL =
          process.env.REACT_APP_API_URL || "http://localhost:3002";
        const response = await fetch(
          `${API_BASE_URL}/api/v2/heroes/${slug}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.hero) {
          setHeroData(result.hero);
          setHeroFullName(
            result.hero.name ||
              result.hero.infos?.name ||
              heroName
          );
        } else {
          throw new Error("No hero data found");
        }
      } catch (error) {
        try {
          const fallbackName = heroName || heroSlug;
          const fallbackResponse = await fetch(
            `/kingsraid-data/table-data/heroes/${fallbackName}.json`
          );

          if (fallbackResponse.ok) {
            const fallbackData =
              await fallbackResponse.json();
            setHeroData(fallbackData);
            setHeroFullName(
              fallbackData.name ||
                fallbackData.infos?.name ||
                heroName
            );
          }
        } catch (fallbackError) {
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
    const nameToUse =
      heroFullName || heroName || heroSlug || "unknown";
    const encodedName = encodeURIComponent(nameToUse);
    const path = `/kingsraid-data/assets/heroes/${encodedName}/uw.png`;
    return path;
  };

  const getAdvancementImagePath = (fileName) => {
    const path = `/kingsraid-data/assets/advancements/${fileName}`;
    return path;
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedOption === "empty") {
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
      updateAdvancement(teamSlotIndex, null);
    } else {
      const uwObject = {
        uwPath: getUWImagePath(),
        heroSlug:
          heroSlug ||
          heroName?.toLowerCase().replace(/\s+/g, "-"),
        heroName: heroName,
        stars: selectedStars,
      };

      updateSubSlot(
        teamSlotIndex,
        subSlotIndex,
        uwObject,
        selectedStars
      );

      let advancementValue = null;

      if (selectedAdvancement === "0") {
        advancementValue = 0;
      } else if (selectedAdvancement === "1") {
        advancementValue = 1;
      } else if (selectedAdvancement === "2") {
        advancementValue = 2;
      }

      updateAdvancement(teamSlotIndex, advancementValue);
    }

    onClose();
  };

  const getUWData = () => {
    if (!heroData) {
      return null;
    }

    if (heroData.uw) {
      return heroData.uw;
    }

    if (heroData.rawData?.uw) {
      return heroData.rawData.uw;
    }

    return null;
  };

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

  const handleUWImageError = (e) => {
    e.target.style.display = "none";
    const fallback = e.target.nextElementSibling;
    if (fallback) {
      fallback.style.display = "flex";
    }
  };

  const renderAdvancementOptions = () => {
    const advancements = [
      { id: "none", value: "null", label: "None", image: getAdvancementImagePath("none.png") },
      { id: "blue", value: "0", label: "Blue", image: getAdvancementImagePath("blue.png") },
      { id: "purple", value: "1", label: "Purple", image: getAdvancementImagePath("purple.png") },
      { id: "red", value: "2", label: "Red", image: getAdvancementImagePath("red.png") },
    ];

    return (
      <div className="advancement-options">
        {advancements.map((adv) => {
          const isSelected = selectedAdvancement === adv.value;

          return (
            <div
              key={adv.id}
              className={`advancement-option ${isSelected ? "selected" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedAdvancement(adv.value);
              }}
              onMouseEnter={() => setHoveredAdvancement(adv.value)}
              onMouseLeave={() => setHoveredAdvancement(null)}
            >
              <div className="advancement-image-container">
                <img
                  src={adv.image}
                  className="advancement-image"
                  alt={adv.label}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />

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
                      e.target.style.display = "none";
                    }}
                  />
                </div>

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
                      e.target.style.display = "none";
                    }}
                  />
                </div>

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
          className={`uw-option empty ${selectedOption === "empty" ? "selected" : ""}`}
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
          <div className="uw-fallback">UW</div>
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

export default UWModal;
