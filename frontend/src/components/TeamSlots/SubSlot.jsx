import { useRef, useState } from "react";
import "./SubSlot.css";
import SubSlotOverlay from "./SubSlotOverlay";

const SubSlot = ({
  teamSlotIndex,
  subSlotIndex,
  item,
  stars,
  advancement,
  onClick,
  hasHero,
  artifactsData,
  heroesData,
  heroName,
  gearSetsData,
}) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const slotRef = useRef(null);
  const subSlotNames = ["UW", "UT", "Artifact", "GearSet"];

  if (!hasHero) {
    return (
      <div className="sub-slot empty">
        <span className="sub-slot-plus">+</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div
        className="sub-slot empty"
        onClick={() => onClick(teamSlotIndex, subSlotIndex)}
      >
        <span className="sub-slot-plus">+</span>
      </div>
    );
  }

  const getBorderClass = () => {
    if (subSlotIndex === 0 && advancement !== "none") {
      return `uw-advancement-${advancement}`;
    }
    return "";
  };

  const renderGearSet = (item, stars) => {
    if (!item) return null;

    try {
      const gearSets = JSON.parse(item);

      if (gearSets.length === 1) {
        return (
          <div className="relative w-full h-full">
            <img
              src={`/kingsraid-data/assets/gearsets/${gearSets[0]}.png`}
              alt="Gear Set"
              className="sub-slot-image"
              onError={(e) => {
                e.target.style.display = "none";
                const fallback = e.target.nextElementSibling;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <div className="sub-slot-fallback">Gear</div>
            <div className="sub-slot-stars">4P</div>
          </div>
        );
      } else if (gearSets.length === 2) {
        return (
          <div className="relative w-full h-full flex">
            <div className="w-1/2 h-full overflow-hidden">
              <img
                src={`/kingsraid-data/assets/gearsets/${gearSets[0]}.png`}
                alt="Gear Set 1"
                className="w-full h-full object-cover"
                style={{ objectPosition: "left center" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div className="sub-slot-fallback">Gear</div>
            </div>
            <div className="w-1/2 h-full overflow-hidden">
              <img
                src={`/kingsraid-data/assets/gearsets/${gearSets[1]}.png`}
                alt="Gear Set 2"
                className="w-full h-full object-cover"
                style={{ objectPosition: "right center" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div className="sub-slot-fallback">Gear</div>
            </div>
            <div className="sub-slot-stars">2P/2P</div>
          </div>
        );
      }
    } catch (e) {
      console.error("Error parsing gear set data:", e);
    }

    return null;
  };

  return (
    <div
      ref={slotRef}
      className="relative"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      <div
        className={`sub-slot ${getBorderClass()}`}
        onClick={() => onClick(teamSlotIndex, subSlotIndex)}
      >
        {subSlotIndex === 3 ? (
          renderGearSet(item, stars)
        ) : (
          <>
            <img
              src={item}
              alt={subSlotNames[subSlotIndex]}
              className="sub-slot-image"
              onError={(e) => {
                e.target.style.display = "none";
                const fallback = e.target.nextElementSibling;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <div className="sub-slot-fallback">
              {subSlotNames[subSlotIndex]}
            </div>
            {stars > 0 && <div className="sub-slot-stars">{stars}★</div>}

            {subSlotIndex === 0 && advancement !== "none" && (
              <div className="advancement-corner-icon">
                <img
                  src={`/kingsraid-data/assets/advancements/${advancement}.png`}
                  alt={advancement}
                  onError={(e) => {
                    console.error(
                      `Failed to load advancement icon: ${advancement}`
                    );
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {showOverlay && (
        <SubSlotOverlay
          subSlotIndex={subSlotIndex}
          item={item}
          stars={stars}
          advancement={advancement}
          heroName={heroName}
          artifactsData={artifactsData}
          heroesData={heroesData}
          gearSetsData={gearSetsData}
          slotRef={slotRef} // Passe la référence du slot
        />
      )}
    </div>
  );
};

export default SubSlot;
