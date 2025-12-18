import { useEffect, useMemo, useState } from "react";
import { useArtifacts } from "../../contexts/ArtifactContext";
import { useOverlay } from "../../contexts/OverlayContext";
import { useTeam } from "../../contexts/TeamContext";
import "./ArtifactModal.css";
import ItemOverlay from "./ItemOverlay";
import StarRating from "./StarRating";

const ArtifactModal = ({ data, onClose }) => {
  const { teamSlotIndex, subSlotIndex, currentItem, currentStars } = data;
  const { updateSubSlot } = useTeam();
  const { allArtifacts, loading } = useArtifacts();
  const { showOverlay, hideOverlay } = useOverlay();

  const [selectedArtifact, setSelectedArtifact] = useState(
    currentItem
      ? currentItem.split("/artifacts/")[1]?.replace(".png", "")
      : null
  );
  const [selectedStars, setSelectedStars] = useState(currentStars);
  const [searchTerm, setSearchTerm] = useState("");

  const [artifactsData, setArtifactsData] = useState([]);

  useEffect(() => {
    const loadArtifactsData = async () => {
      try {
        const response = await fetch(
          "/kingsraid-data/table-data/artifacts.json"
        );
        const data = await response.json();
        setArtifactsData(data);
      } catch (error) {
        console.error("Error loading artifacts data:", error);
      }
    };

    loadArtifactsData();
  }, []);

  const showLoading = loading && allArtifacts.length === 0;

  const displayArtifacts = useMemo(() => {
    if (searchTerm) {
      return allArtifacts.filter((artifact) => {
        const artifactInfo = artifactsData.find(
          (a) => a.thumbnail === `artifacts/${artifact}.png`
        );
        const name = artifactInfo?.name || artifact;
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    return allArtifacts;
  }, [searchTerm, allArtifacts, artifactsData]);

  const getArtifactData = (artifactName) => {
    if (!artifactName || artifactsData.length === 0) return null;

    const artifactInfo = artifactsData.find(
      (a) => a.thumbnail === `artifacts/${artifactName}.png`
    );

    if (!artifactInfo) {
      const formattedName = artifactName.replace(/_/g, " ");
      return artifactsData.find(
        (a) => a.name.toLowerCase() === formattedName.toLowerCase()
      );
    }

    return artifactInfo;
  };

  const handleConfirm = () => {
    if (selectedArtifact === null) {
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
    } else {
      const artifactPath = `/kingsraid-data/assets/artifacts/${selectedArtifact}.png`;
      updateSubSlot(teamSlotIndex, subSlotIndex, artifactPath, selectedStars);
    }
    onClose();
  };

  // Gérer le hover sur un artefact
  const handleArtifactHover = (artifactName, e) => {
    const artifactInfo = getArtifactData(artifactName);
    if (!artifactInfo) return;

    const rect = e.currentTarget.getBoundingClientRect();

    // Position au-dessus de l'item
    const position = {
      left: rect.left + rect.width / 2,
      top: rect.top,
      transform: "translateX(-50%) translateY(-100%)",
    };

    showOverlay(
      <ItemOverlay
        title={artifactInfo.name}
        stars={selectedStars}
        description={artifactInfo.description}
        values={artifactInfo.value}
        itemType="artifact"
      />,
      position
    );
  };

  return (
    <div>
      <h3 className="artifact-modal-title">Artifact</h3>

      <input
        type="text"
        placeholder="Search artifacts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="artifact-search-input"
      />

      {showLoading ? (
        <div className="artifact-loading">Loading artifacts...</div>
      ) : (
        <>
          <div className="artifact-grid">
            {/* Option "Empty" */}
            <div
              className={`artifact-option empty ${
                selectedArtifact === null ? "selected" : ""
              }`}
              onClick={() => {
                setSelectedArtifact(null);
                setSelectedStars(0);
              }}
            >
              Empty
            </div>

            {/* Liste des artefacts */}
            {displayArtifacts.map((artifactName) => {
              const artifactInfo = getArtifactData(artifactName);
              const isSelected = selectedArtifact === artifactName;

              return (
                <div
                  key={artifactName}
                  className={`artifact-option ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedArtifact(artifactName)}
                  onMouseEnter={(e) => handleArtifactHover(artifactName, e)}
                  onMouseLeave={hideOverlay}
                >
                  <img
                    src={`/kingsraid-data/assets/artifacts/${artifactName}.png`}
                    alt={artifactName}
                    onError={(e) => {
                      e.target.style.display = "none";
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div className="hidden w-full h-full items-center justify-center text-neutral-400 text-xs bg-neutral-800 rounded p-1 text-center overflow-hidden">
                    {artifactName.length > 10
                      ? artifactName.substring(0, 8) + "..."
                      : artifactName}
                  </div>
                </div>
              );
            })}
          </div>

          {searchTerm && displayArtifacts.length === 0 && (
            <div className="artifact-no-results">
              No artifacts found for <span>"{searchTerm}"</span>
            </div>
          )}
        </>
      )}

      {selectedArtifact && (
        <div className="artifact-stars-section">
          <div className="artifact-stars-label">
            Select star level for{" "}
            <span className="artifact-stars-name">
              {getArtifactData(selectedArtifact)?.name ||
                selectedArtifact.replace(/_/g, " ")}
            </span>
          </div>
          <StarRating
            value={selectedStars}
            onChange={setSelectedStars}
            maxStars={5}
            showZeroOption={true}
          />
        </div>
      )}

      <div className="artifact-modal-buttons">
        <button onClick={handleConfirm} className="artifact-modal-confirm">
          Confirm
        </button>
        <button onClick={onClose} className="artifact-modal-cancel">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ArtifactModal;
