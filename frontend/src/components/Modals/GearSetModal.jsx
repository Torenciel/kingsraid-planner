import { useEffect, useState } from "react";
import { useTeam } from "../../contexts/TeamContext";
import { useOverlay } from "../../contexts/OverlayContext";
import { useGearSets } from "../../contexts/GearSetContext";
import "./GearSetModal.css";

const GearSetModal = ({ data, onClose }) => {
  const { teamSlotIndex, subSlotIndex, currentItem } = data;
  const { updateSubSlot } = useTeam();
  const { showOverlay, hideOverlay } = useOverlay();
  const { 
    allGearSets: gearSets, 
    loading, 
    getGearSetBySlug,
    getGearSetImageUrl
  } = useGearSets();

  // Direct format for saving
  const createSimpleGearSetObject = (selectedSlugs) => {
    if (selectedSlugs.length === 0) return null;
    
    if (selectedSlugs.length === 1) {
      const gearSet = getGearSetBySlug(selectedSlugs[0]);
      if (!gearSet) return null;
      
      return {
        gearSetSlug: gearSet.slug,
        gearSetInfo: {
          name: gearSet.name,
          thumbnail: getGearSetImageUrl(gearSet),
          bonus2P: gearSet.bonus2P,
          bonus4P: gearSet.bonus4P
        },
        pieces: 4,
        sets: [gearSet.slug]
      };
    }
    
    if (selectedSlugs.length === 2) {
      const gearSet1 = getGearSetBySlug(selectedSlugs[0]);
      const gearSet2 = getGearSetBySlug(selectedSlugs[1]);
      if (!gearSet1 || !gearSet2) return null;
      
      return {
        isMultiSet: true,
        sets: [gearSet1.slug, gearSet2.slug],
        gearSetSlug: gearSet1.slug,
        gearSetInfo: {
          name: `${gearSet1.name} + ${gearSet2.name}`,
          thumbnail: getGearSetImageUrl(gearSet1),
          bonus2P: "Multiple sets selected",
          bonus4P: "Not applicable for multiple sets"
        },
        pieces: 2,
        set1Info: {
          name: gearSet1.name,
          slug: gearSet1.slug,
          bonus2P: gearSet1.bonus2P
        },
        set2Info: {
          name: gearSet2.name,
          slug: gearSet2.slug,
          bonus2P: gearSet2.bonus2P
        }
      };
    }
    
    return null;
  };

  const getInitialSelection = () => {
    if (!currentItem) return [];
    
    if (typeof currentItem === 'object') {
      if (currentItem.isMultiSet && currentItem.sets) {
        return currentItem.sets;
      }
      
      if (currentItem.gearSetSlug) {
        return [currentItem.gearSetSlug];
      }
      
      if (currentItem.sets && Array.isArray(currentItem.sets)) {
        return currentItem.sets;
      }
    }
    
    return [];
  };

  const [selectedSets, setSelectedSets] = useState(getInitialSelection());

  const handleSetClick = (setSlug) => {
    if (setSlug === "empty") {
      setSelectedSets([]);
    } else {
      if (selectedSets.includes(setSlug)) {
        setSelectedSets(selectedSets.filter((slug) => slug !== setSlug));
      } else {
        if (selectedSets.length < 2) {
          setSelectedSets([...selectedSets, setSlug]);
        }
      }
    }
  };

  const handleConfirm = () => {
    if (selectedSets.length === 0) {
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
    } else {
      const gearSetData = createSimpleGearSetObject(selectedSets);
      if (gearSetData) {
        updateSubSlot(teamSlotIndex, subSlotIndex, gearSetData, 0);
      }
    }
    
    onClose();
  };

  const handleGearSetHover = (gearSet, e) => {
    if (!gearSet) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      left: rect.left + rect.width / 2,
      top: rect.top,
      transform: "translateX(-50%) translateY(-100%)",
    };

    const isSelected = selectedSets.includes(gearSet.slug);
    
    let pieces = 0;
    if (selectedSets.length === 0) {
      pieces = 4;
    } else if (selectedSets.length === 1 && !isSelected) {
      pieces = 4;
    } else {
      pieces = 2;
    }

    const overlayContent = (
      <div className="gearset-hover-overlay">
        <h4 className="hover-title">{gearSet.name}</h4>       
        <div className="hover-bonus-row">
          <span className="hover-bonus-label">2P : </span>
          <span className="hover-bonus-text">{gearSet.bonus2P}</span>
        </div>
        
        <div className="hover-bonus-row">
          <span className="hover-bonus-label">4P : </span>
          <span className={`hover-bonus-text ${pieces >= 4 ? "active" : "inactive"}`}>
            {gearSet.bonus4P}
          </span>
        </div>
      </div>
    );

    showOverlay(overlayContent, position);
  };

  const getSelectedSet = (setSlug) => {
    return getGearSetBySlug(setSlug);
  };

  const sortedGearSets = [...gearSets].sort(
    (a, b) => (a.sortOrder || 999) - (b.sortOrder || 999)
  );

  const allOptions = [
    { id: "empty", slug: "empty", name: "Empty", isEmpty: true },
    ...sortedGearSets,
  ];

  if (loading) {
    return (
      <div className="gearset-modal-container">
        <h3 className="gearset-modal-title">Gear Set</h3>
        <div className="gearset-loading">Loading gear sets...</div>
      </div>
    );
  }

  return (
    <div className="gearset-modal-container">
      <h3 className="gearset-modal-title">Gear Set</h3>

      <div className="gearset-bonus-section">
        {selectedSets.length === 0 ? (
          <div className="gearset-bonus-placeholder">
            Select 1 or 2 gear sets
          </div>
        ) : (
          <div className="gearset-bonus-list">
            {selectedSets.map((setSlug) => {
              const set = getSelectedSet(setSlug);
              if (!set) return null;

              return (
                <div key={setSlug} className="gearset-bonus-item">
                  <div className="gearset-set-header">
                    <div className="gearset-set-name">{set.name}</div>
                  </div>

                  <div className="gearset-bonus-content">
                    <div className="gearset-bonus-row">
                      <span className="gearset-bonus-label">2P :</span>
                      <span className="gearset-bonus-text">{set.bonus2P}</span>
                    </div>

                    {selectedSets.length === 1 && (
                      <div className="gearset-bonus-row">
                        <span className="gearset-bonus-label">4P :</span>
                        <span className="gearset-bonus-text active">
                          {set.bonus4P}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="gearset-grid-section">        
        <div className="gearset-grid">
          {allOptions.map((set) => {
            const isSelected = set.isEmpty
              ? selectedSets.length === 0
              : selectedSets.includes(set.slug);
            const isDisabled =
              !set.isEmpty && selectedSets.length >= 2 && !isSelected;
            
            const selectionIndex = isSelected
              ? selectedSets.indexOf(set.slug) + 1
              : 0;

            return (
              <div
                key={set.slug || set.id}
                className={`gearset-option ${isSelected ? "selected" : ""} ${
                  isDisabled ? "disabled" : ""
                } ${set.isEmpty ? "empty-option" : ""}`}
                onClick={() =>
                  !isDisabled && handleSetClick(set.slug || "empty")
                }
                onMouseEnter={(e) =>
                  !set.isEmpty && handleGearSetHover(set, e)
                }
                onMouseLeave={hideOverlay}
              >
                {set.isEmpty ? (
                  <div className="empty-slot-content">
                    <div className="empty-label">Empty</div>
                  </div>
                ) : (
                  <>
                    <img
                      src={getGearSetImageUrl(set)}
                      alt={set.name}
                      className="gearset-image"
                      onError={(e) => {
                        e.target.style.display = "none";
                        const fallback = e.target.nextElementSibling;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div className="gearset-fallback">
                      {set.name.length > 12
                        ? set.name.substring(0, 10) + '...'
                        : set.name}
                    </div>
                    
                    {isSelected && (
                      <div className="gearset-selected-indicator">
                        {selectedSets.length === 1 ? "✓" : selectionIndex}
                      </div>
                    )}
                    
                    {isDisabled && (
                      <div className="gearset-disabled-overlay">
                        <div className="gearset-disabled-icon">×</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

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

export default GearSetModal;
