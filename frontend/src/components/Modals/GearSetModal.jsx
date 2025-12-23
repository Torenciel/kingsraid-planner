// frontend/src/components/Modals/GearSetModal.jsx
import { useEffect, useState } from "react";
import { useTeam } from "../../contexts/TeamContext";
import { useOverlay } from "../../contexts/OverlayContext";
import "./GearSetModal.css";

const GearSetModal = ({ data, onClose }) => {
  const { teamSlotIndex, subSlotIndex, currentItem } = data;
  const { updateSubSlot } = useTeam();
  const { showOverlay, hideOverlay } = useOverlay();

  // Format pour le nouveau système
  const getInitialSelection = () => {
    if (!currentItem) return [];
    
    // Si c'est un objet (nouveau format)
    if (typeof currentItem === 'object') {
      if (currentItem.gearSetSlug) {
        return [currentItem.gearSetSlug];
      }
      return [];
    }
    
    // Si c'est un JSON string (ancien format)
    if (typeof currentItem === 'string') {
      try {
        return JSON.parse(currentItem);
      } catch (e) {
        return [];
      }
    }
    
    return [];
  };

  const [selectedSets, setSelectedSets] = useState(getInitialSelection());
  const [gearSets, setGearSets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les données depuis MongoDB
  useEffect(() => {
    const loadGearSetsData = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
        const response = await fetch(`${API_BASE_URL}/api/v2/gearsets`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.gearsets) {
          // Transformer les données pour le frontend
          const transformedSets = result.gearsets.map(set => ({
            id: set._id?.toString() || set.id,
            slug: set.slug,
            name: set.name,
            thumbnail: set.thumbnail,
            bonus2P: set.bonus2P,
            bonus4P: set.bonus4P,
            sortOrder: set.sortOrder || 999
          }));
          
          setGearSets(transformedSets);
          console.log(`✅ Loaded ${transformedSets.length} gear sets from MongoDB`);
        } else {
          throw new Error("No gear sets data found");
        }
      } catch (error) {
        console.error("Error loading gear sets from MongoDB:", error);
        
        // Fallback vers l'ancien système
        try {
          const fallbackResponse = await fetch(
            "/kingsraid-data/table-data/gearsets.json"
          );
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            
            // Transformer les données fallback
            const transformedFallback = fallbackData.map(set => ({
              id: set._id?.toString() || set.id,
              slug: set.slug || set.name?.toLowerCase().replace(/\s+/g, '-'),
              name: set.name,
              thumbnail: set.thumbnail || `/kingsraid-data/assets/gearsets/${set.name?.toLowerCase().replace(/\s+/g, '_')}.png`,
              bonus2P: set.bonus2P,
              bonus4P: set.bonus4P,
              sortOrder: set.sortOrder || 999
            }));
            
            setGearSets(transformedFallback);
            console.log(`✅ Loaded ${transformedFallback.length} gear sets from fallback`);
          }
        } catch (fallbackError) {
          console.error("Error loading fallback gear sets:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadGearSetsData();
  }, []);

  // Fonction pour obtenir le chemin d'image
  const getGearSetImagePath = (gearSet) => {
    if (!gearSet) return '';
    
    // Si on a un thumbnail valide
    if (gearSet.thumbnail) {
      // Si c'est un chemin relatif, ajouter le base path
      if (!gearSet.thumbnail.startsWith('http') && !gearSet.thumbnail.startsWith('/')) {
        return `/kingsraid-data/assets/${gearSet.thumbnail}`;
      }
      return gearSet.thumbnail;
    }
    
    // Fallback: construire depuis le slug
    const slug = gearSet.slug || gearSet.name?.toLowerCase().replace(/\s+/g, '_');
    if (slug) {
      return `/kingsraid-data/assets/gearsets/${slug}.png`;
    }
    
    return '';
  };

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
      // Aucun gear set sélectionné
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
    } else {
      // Créer l'objet pour la sauvegarde (nouveau format)
      const selectedSet = gearSets.find(set => set.slug === selectedSets[0]);
      
      if (selectedSet) {
        const gearSetData = {
          gearSetSlug: selectedSet.slug,
          gearSetInfo: {
            name: selectedSet.name,
            thumbnail: getGearSetImagePath(selectedSet),
            bonus2P: selectedSet.bonus2P,
            bonus4P: selectedSet.bonus4P
          },
          pieces: selectedSets.length === 1 ? 4 : 2 // 4 pieces si 1 set, 2 pieces si 2 sets
        };
        
        updateSubSlot(teamSlotIndex, subSlotIndex, gearSetData, 0);
      }
    }
    onClose();
  };

  // Gérer le hover sur un gear set
  const handleGearSetHover = (gearSet, e) => {
    if (!gearSet) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      left: rect.left + rect.width / 2,
      top: rect.top,
      transform: "translateX(-50%) translateY(-100%)",
    };

    const isSelected = selectedSets.includes(gearSet.slug);
    const wouldHave4Pieces = selectedSets.length === 0 || (selectedSets.length === 1 && !isSelected);
    const pieces = wouldHave4Pieces ? 4 : 2;

    const overlayContent = (
      <div className="gearset-overlay">
        <h4 className="item-overlay-title">{gearSet.name}</h4>
        

          <div className="gearset-bonus-row">
            <span className="item-overlay-description bold">2P:</span>
            <span className="item-overlay-description ">{gearSet.bonus2P}</span>
          </div>
          
          <div className="gearset-bonus-row">
            <span className="item-overlay-description bold">4P:</span>
            <span className={`item-overlay-description ${pieces >= 4 ? "active" : "inactive"}`}>
              {gearSet.bonus4P}
            </span>
          </div>
        </div>

    );

    showOverlay(overlayContent, position);
  };

  const getSelectedSet = (setSlug) => {
    return gearSets.find((set) => set.slug === setSlug);
  };

  // Trier les gear sets par ordre
  const sortedGearSets = [...gearSets].sort((a, b) => 
    (a.sortOrder || 999) - (b.sortOrder || 999)
  );

  // Combiner l'option Empty avec les autres sets
  const allOptions = [
    {
      id: "empty",
      slug: "empty",
      name: "Empty",
      isEmpty: true,
    },
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

      {/* SECTION HAUTE : Set Bonuses Actifs */}
      <div className="gearset-bonus-section">
        {selectedSets.length === 0 ? (
          <div className="gearset-bonus-placeholder">Select 1 or 2 gear sets</div>
        ) : (
          <div className="gearset-bonus-list">
            {selectedSets.map((setSlug, index) => {
              const set = getSelectedSet(setSlug);
              if (!set) return null;

              const pieces = selectedSets.length === 1 ? 4 : 2;

              return (
                <div key={setSlug} className="gearset-bonus-item">
                  <div className="gearset-set-name">{set.name}</div>


                  {/* Bonus 2P - Toujours actif */}
                  <div className="gearset-bonus-row">
                    <span className="gearset-bonus-label">2P:</span>
                    <span className="gearset-bonus-2p">{set.bonus2P}</span>
                  </div>

                  {/* Bonus 4P - Actif seulement si 1 set sélectionné */}
                  <div className="gearset-bonus-row">
                    <span className="gearset-bonus-label">4P:</span>
                    <span
                      className={`gearset-bonus-4p ${
                        pieces >= 4 ? "active" : "inactive"
                      }`}
                    >
                      {set.bonus4P}
                      {pieces < 4 && <span className="bonus-note"> (requires 4 pieces)</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION BASSE : Grid des sets */}
      <div className="gearset-grid">
        {allOptions.map((set) => {
          const isSelected = set.isEmpty
            ? selectedSets.length === 0
            : selectedSets.includes(set.slug);
          const isDisabled =
            !set.isEmpty && selectedSets.length >= 2 && !isSelected;

          return (
            <div
              key={set.slug || set.id}
              className={`gearset-option ${isSelected ? "selected" : ""} ${
                isDisabled ? "disabled" : ""
              } ${set.isEmpty ? "empty-option" : ""}`}
              onClick={() => !isDisabled && handleSetClick(set.slug || "empty")}
              onMouseEnter={(e) => !set.isEmpty && handleGearSetHover(set, e)}
              onMouseLeave={hideOverlay}
            >
              {set.isEmpty ? (
                <div className="empty-slot-label">Empty</div>
              ) : (
                <>
                  <img
                    src={getGearSetImagePath(set)}
                    alt={set.name}
                    className="gearset-image"
                    onError={(e) => {
                      console.warn(`Gear set image failed to load: ${e.target.src}`);
                      e.target.style.display = "none";
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div className="gearset-fallback">
                    {set.name}
                  </div>
                  {isSelected && (
                    <div className="gearset-selected-indicator">✓</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Boutons */}
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

export default GearSetModal;