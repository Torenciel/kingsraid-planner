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
    currentItem,
    currentStars,
    currentAdvancement,
  } = data;
  const { updateSubSlot, updateAdvancement } = useTeam();
  const { showOverlay, hideOverlay } = useOverlay();

  const [selectedOption, setSelectedOption] = useState(
    currentItem ? "uw" : "empty"
  );
  const [selectedStars, setSelectedStars] = useState(currentStars);
  const [selectedAdvancement, setSelectedAdvancement] =
    useState(currentAdvancement);
  const [hoveredAdvancement, setHoveredAdvancement] = useState(null);
  const [heroData, setHeroData] = useState(null);
  const uwItemRef = useRef(null);

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

  // Dans UWModal.jsx, UTModal.jsx, etc.
  const handleConfirm = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedOption === "empty") {
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
      updateAdvancement(teamSlotIndex, "none");
    } else {
      const uwPath = `/kingsraid-data/assets/heroes/${heroName}/uw.png`;
      updateSubSlot(teamSlotIndex, subSlotIndex, uwPath, selectedStars);
      updateAdvancement(teamSlotIndex, selectedAdvancement);
    }
    onClose();
  };

  // Gérer le hover sur l'UW
  const handleUWHover = (e) => {
    if (!heroData?.uw) return;

    const rect = e.currentTarget.getBoundingClientRect();

    // Position au-dessus de l'item
    const position = {
      left: rect.left + rect.width / 2,
      top: rect.top,
      transform: "translateX(-50%) translateY(-100%)",
    };

    showOverlay(
      <ItemOverlay
        title={heroData.uw.name}
        stars={selectedStars}
        description={heroData.uw.description}
        values={heroData.uw.value}
        itemType="uw"
      />,
      position
    );
  };

  const renderAdvancementOptions = () => {
    const advancements = [
      {
        id: "none",
        label: "None",
        image: "/kingsraid-data/assets/advancements/none.png",
      },
      {
        id: "blue",
        label: "Blue",
        image: "/kingsraid-data/assets/advancements/blue.png",
      },
      {
        id: "purple",
        label: "Purple",
        image: "/kingsraid-data/assets/advancements/purple.png",
      },
      {
        id: "red",
        label: "Red",
        image: "/kingsraid-data/assets/advancements/red.png",
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
                alt={adv.label}
                className="advancement-image"
              />
              <div
                className="advancement-border"
                style={{
                  opacity: hoveredAdvancement === adv.id ? 1 : 0,
                }}
              >
                <img
                  src="/kingsraid-data/assets/advancements/border-hover.png"
                  alt="hover border"
                />
              </div>
              <div
                className="advancement-border"
                style={{
                  opacity: selectedAdvancement === adv.id ? 1 : 0,
                }}
              >
                <img
                  src="/kingsraid-data/assets/advancements/border-selected.png"
                  alt="selected border"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Titre */}
      <h3 className="uw-modal-title">Unique Weapon - {heroName}</h3>

      {/* Options UW */}
      <div className="uw-options-container">
        {/* Option Empty */}
        <div
          className={`uw-option empty ${
            selectedOption === "empty" ? "selected" : ""
          }`}
          onClick={() => setSelectedOption("empty")}
        >
          Empty
        </div>

        {/* Option UW */}
        <div
          ref={uwItemRef}
          className={`uw-option ${selectedOption === "uw" ? "selected" : ""}`}
          onClick={() => setSelectedOption("uw")}
          onMouseEnter={handleUWHover}
          onMouseLeave={hideOverlay}
        >
          <img
            src={`/kingsraid-data/assets/heroes/${heroName}/uw.png`}
            alt="UW"
            className="w-full h-full object-cover rounded"
            onError={(e) => {
              e.target.style.display = "none";
              const fallback = e.target.nextElementSibling;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div className="hidden w-full h-full items-center justify-center text-neutral-400 text-xs bg-neutral-800 rounded">
            UW
          </div>
        </div>
      </div>

      {/* Stars */}
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

      {/* Advancement */}
      {selectedOption === "uw" && (
        <div className="uw-advancement-section">
          <h4 className="uw-modal-subtitle">Soul Weapon Advancement</h4>
          {renderAdvancementOptions()}
        </div>
      )}

      {/* Boutons */}
      <div className="uw-modal-buttons">
        <button onClick={handleConfirm} className="uw-modal-confirm">
          Confirm
        </button>
        <button onClick={onClose} className="uw-modal-cancel">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default UWModal;
