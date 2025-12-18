import { useEffect, useState } from "react";
import { useTeam } from "../../contexts/TeamContext";
import "./GearSetModal.css";

const GearSetModal = ({ data, onClose }) => {
  const { teamSlotIndex, subSlotIndex, currentItem } = data;
  const { updateSubSlot } = useTeam();

  const [selectedSets, setSelectedSets] = useState(
    currentItem ? JSON.parse(currentItem) : []
  );
  const [gearSets, setGearSets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les données depuis le fichier JSON
  useEffect(() => {
    const loadGearSetsData = async () => {
      try {
        const response = await fetch(
          "/kingsraid-data/table-data/gearsets.json"
        );
        const data = await response.json();
        setGearSets(data);
      } catch (error) {
        console.error("Erreur lors du chargement des gearsets:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGearSetsData();
  }, []);

  const handleSetClick = (setId) => {
    if (setId === "empty") {
      setSelectedSets([]);
    } else {
      if (selectedSets.includes(setId)) {
        setSelectedSets(selectedSets.filter((id) => id !== setId));
      } else {
        if (selectedSets.length < 2) {
          setSelectedSets([...selectedSets, setId]);
        }
      }
    }
  };

  const handleConfirm = () => {
    if (selectedSets.length === 0) {
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
    } else {
      const gearSetData = JSON.stringify(selectedSets);
      updateSubSlot(teamSlotIndex, subSlotIndex, gearSetData, 0);
    }
    onClose();
  };

  const getSelectedSet = (setId) => {
    return gearSets.find((set) => set.id === setId);
  };

  // Combiner l'option Empty avec les autres sets
  const allOptions = [
    {
      id: "empty",
      name: "Empty",
      image: null,
      isEmpty: true,
    },
    ...gearSets,
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
          <div className="gearset-bonus-placeholder">Select 1 or 2 sets</div>
        ) : (
          <div className="gearset-bonus-list">
            {selectedSets.map((setId, index) => {
              const set = getSelectedSet(setId);
              if (!set) return null;

              return (
                <div key={setId} className="gearset-bonus-item">
                  <div className="gearset-set-name">{set.name}</div>

                  {/* Bonus 2P - Toujours actif */}
                  <div className="gearset-bonus-row">
                    <span className="gearset-bonus-label">2P :</span>
                    <span className="gearset-bonus-2p">{set.bonus2P}</span>
                  </div>

                  {/* Bonus 4P - Actif seulement si 1 set sélectionné */}
                  <div className="gearset-bonus-row">
                    <span className="gearset-bonus-label">4P :</span>
                    <span
                      className={`gearset-bonus-4p ${
                        selectedSets.length === 1 ? "active" : "inactive"
                      }`}
                    >
                      {set.bonus4P}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION BASSE : Grid des sets avec Empty en premier */}
      <div className="gearset-grid">
        {allOptions.map((set) => {
          const isSelected = set.isEmpty
            ? selectedSets.length === 0
            : selectedSets.includes(set.id);
          const isDisabled =
            !set.isEmpty && selectedSets.length >= 2 && !isSelected;

          return (
            <div
              key={set.id}
              className={`gearset-option ${isSelected ? "selected" : ""} ${
                isDisabled ? "disabled" : ""
              } ${set.isEmpty ? "empty-option" : ""}`}
              onClick={() => !isDisabled && handleSetClick(set.id)}
            >
              {set.isEmpty ? (
                <div>Empty</div>
              ) : (
                <>
                  <img
                    src={set.image}
                    alt={set.name}
                    onError={(e) => {
                      e.target.style.display = "none";
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div className="hidden w-full h-full items-center justify-center text-neutral-400 text-xs bg-neutral-800 rounded p-1 text-center">
                    {set.name}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Boutons */}
      <div className="gearset-modal-buttons">
        <button onClick={handleConfirm} className="gearset-modal-confirm">
          Confirm
        </button>
        <button onClick={onClose} className="gearset-modal-cancel">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default GearSetModal;
