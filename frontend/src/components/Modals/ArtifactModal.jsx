import { useMemo, useState } from "react";
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

  const getArtifactNameFromUrl = (url) => {
    if (!url) return null;
    const match = url.match(/artifacts\/(.+)\.png$/);
    return match ? match[1] : null;
  };

  const currentArtifactName = currentItem ? getArtifactNameFromUrl(currentItem) : null;
  
  const findArtifactByFileName = (fileName) => {
    return allArtifacts.find(artifact => {
      if (!artifact) return false;
      const thumbName = artifact.thumbnail?.replace('artifacts/', '').replace('.png', '');
      const artifactId = artifact._id?.toString();
      const artifactNameId = artifact.id?.toString();
      
      return thumbName === fileName || 
             artifactId === fileName || 
             artifactNameId === fileName ||
             artifact.name?.toLowerCase().replace(/\s+/g, '_') === fileName;
    });
  };

  const [selectedArtifact, setSelectedArtifact] = useState(
    currentArtifactName ? findArtifactByFileName(currentArtifactName) : null
  );
  const [selectedStars, setSelectedStars] = useState(currentStars);
  const [searchTerm, setSearchTerm] = useState("");

  const showLoading = loading && allArtifacts.length === 0;

  const displayArtifacts = useMemo(() => {
    if (searchTerm) {
      return allArtifacts.filter((artifact) => {
        const name = artifact.name || '';
        const search = searchTerm.toLowerCase();
        return name.toLowerCase().includes(search);
      });
    }
    return allArtifacts;
  }, [searchTerm, allArtifacts]);

  const getArtifactFileName = (artifact) => {
    if (!artifact) return '';
    
    if (artifact.thumbnail) {
      return artifact.thumbnail.replace('artifacts/', '').replace('.png', '');
    }
    
    return artifact.name?.toLowerCase().replace(/\s+/g, '_') || '';
  };

  const getArtifactData = (artifact) => {
    if (!artifact) return null;
    
    const values = artifact.rawData?.value || artifact.value || {};
    
    return {
      name: artifact.name,
      description: artifact.description || artifact.rawData?.description || "",
      value: values,
      thumbnail: artifact.thumbnail
    };
  };

  const handleConfirm = () => {
    if (!selectedArtifact) {
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
    } else {
      const artifactFileName = getArtifactFileName(selectedArtifact);
      const artifactPath = `/kingsraid-data/assets/artifacts/${artifactFileName}.png`;
      updateSubSlot(teamSlotIndex, subSlotIndex, artifactPath, selectedStars);
    }
    onClose();
  };

  const handleArtifactHover = (artifact, e) => {
    if (!artifact) return;

    const artifactData = getArtifactData(artifact);
    if (!artifactData) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const position = {
      left: rect.left + rect.width / 2,
      top: rect.top,
      transform: "translateX(-50%) translateY(-100%)",
    };

    showOverlay(
      <ItemOverlay
        title={artifactData.name}
        stars={selectedStars}
        description={artifactData.description}
        values={artifactData.value}
        itemType="artifact"
      />,
      position
    );
  };

  const isArtifactSelected = (artifact) => {
    if (!selectedArtifact || !artifact) return false;
    
    if (selectedArtifact._id && artifact._id) {
      return selectedArtifact._id === artifact._id;
    }
    if (selectedArtifact.id && artifact.id) {
      return selectedArtifact.id === artifact.id;
    }
    if (selectedArtifact.name && artifact.name) {
      return selectedArtifact.name === artifact.name;
    }
    
    return false;
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
            <div
              className={`artifact-option empty ${
                !selectedArtifact ? "selected" : ""
              }`}
              onClick={() => {
                setSelectedArtifact(null);
                setSelectedStars(0);
              }}
            >
              Empty
            </div>

            {displayArtifacts.map((artifact) => {
              const artifactFileName = getArtifactFileName(artifact);
              const isSelected = isArtifactSelected(artifact);

              return (
                <div
                  key={artifact._id || artifact.id || artifact.name}
                  className={`artifact-option ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedArtifact(artifact)}
                  onMouseEnter={(e) => handleArtifactHover(artifact, e)}
                  onMouseLeave={hideOverlay}
                >
                  <img
                    src={`/kingsraid-data/assets/artifacts/${artifactFileName}.png`}
                    alt={artifact.name}
                    onError={(e) => {
                      e.target.style.display = "none";
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div className="artifact-fallback">
                    {artifactFileName.length > 10
                      ? artifactFileName.substring(0, 8) + "..."
                      : artifactFileName}
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
              {selectedArtifact.name ||
                getArtifactFileName(selectedArtifact).replace(/_/g, " ")}
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