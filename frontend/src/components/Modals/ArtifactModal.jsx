import { useEffect, useMemo, useState } from "react";
import { useArtifacts } from "../../contexts/ArtifactContext";
import { useOverlay } from "../../contexts/OverlayContext";
import { useTeam } from "../../contexts/TeamContext";
import { FaSearch } from "react-icons/fa";
import "./ArtifactModal.css";
import ItemOverlay from "./ItemOverlay";
import StarRating from "./StarRating";

const ArtifactModal = ({ data, onClose }) => {
  const { teamSlotIndex, subSlotIndex, currentItem, currentStars } = data;
  const { updateSubSlot } = useTeam();
  const { allArtifacts, loading, getArtifactPublicUrl } = useArtifacts();
  const { showOverlay, hideOverlay } = useOverlay();

  // Get filename for saving
  const getArtifactFilename = (artifact) => {
    if (!artifact) return '';
    
    if (artifact.thumbnail) {
      if (artifact.thumbnail.includes('artifacts/')) {
        return artifact.thumbnail.split('/').pop();
      }
      return artifact.thumbnail;
    }
    
    return `${artifact.name || artifact.slug || ''}.png`;
  };

  // Initialize state
  const [selectedArtifact, setSelectedArtifact] = useState(() => {
    if (!currentItem) return null;
    if (!allArtifacts || allArtifacts.length === 0) return null;

    if (currentItem.artifactSlug) {
      const found = allArtifacts.find(a => a.slug === currentItem.artifactSlug);
      if (found) return found;
    }

    if (currentItem.slug) {
      const found = allArtifacts.find(a => a.slug === currentItem.slug);
      if (found) return found;
    }

    return null;
  });
  
  const [selectedStars, setSelectedStars] = useState(currentStars || 0);
  const [searchTerm, setSearchTerm] = useState("");

  // Retry finding artifact when data loads
  useEffect(() => {
    if (allArtifacts.length > 0 && currentItem && !selectedArtifact) {
      let foundArtifact = null;
      
      if (currentItem.artifactSlug) {
        foundArtifact = allArtifacts.find(a => a.slug === currentItem.artifactSlug);
      }

      if (!foundArtifact && currentItem.slug) {
        foundArtifact = allArtifacts.find(a => a.slug === currentItem.slug);
      }

      if (!foundArtifact && currentItem._id) {
        foundArtifact = allArtifacts.find(
          a => a._id?.toString() === currentItem._id.toString()
        );
      }
      
      if (foundArtifact) {
        setSelectedArtifact(foundArtifact);
      }
    }
  }, [allArtifacts, currentItem, selectedArtifact]);

  const showLoading = loading && allArtifacts.length === 0;

  const displayArtifacts = useMemo(() => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return allArtifacts.filter((artifact) => {
        const name = artifact.name || '';
        const slug = artifact.slug || '';
        return (
          name.toLowerCase().includes(searchLower) ||
          slug.toLowerCase().includes(searchLower)
        );
      });
    }
    return allArtifacts;
  }, [searchTerm, allArtifacts]);

  // Prepare artifact data for overlay
  const getArtifactData = (artifact) => {
    if (!artifact) return null;
    
    return {
      _type: 'artifact',
      name: artifact.name,
      slug: artifact.slug,
      description: artifact.description || "",
      values: artifact.values || artifact.value || {},
      id: artifact._id || artifact.id
    };
  };

  // Create object for saving
  const createArtifactObjectForSave = (artifact, stars) => {
    if (!artifact) return null;
    
    return {
      artifactSlug: artifact.slug || artifact._id?.toString(),
      artifactInfo: {
        name: artifact.name,
        thumbnail: artifact.thumbnail,
        description: artifact.description || ""
      },
      stars: stars
    };
  };

  const handleRemove = () => {
    updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
    onClose();
  };

  const handleConfirm = () => {
    if (!selectedArtifact) {
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
    } else {
      const artifactData = createArtifactObjectForSave(
        selectedArtifact,
        selectedStars
      );
      updateSubSlot(teamSlotIndex, subSlotIndex, artifactData, selectedStars);
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
        values={artifactData.values}
        itemType="artifact"
      />,
      position
    );
  };

  const isArtifactSelected = (artifact) => {
    if (!selectedArtifact || !artifact) return false;

    if (selectedArtifact.slug && artifact.slug) {
      return selectedArtifact.slug === artifact.slug;
    }

    if (selectedArtifact._id && artifact._id) {
      return (
        selectedArtifact._id.toString() === artifact._id.toString()
      );
    }

    return false;
  };

  return (
    <div className="artifact-modal-container">
      <h3 className="artifact-modal-title">Artifact</h3>

      <div className="artifact-search-container">
        <FaSearch className="artifact-search-icon" />
        <input
          type="text"
          placeholder="Search artifacts"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="artifact-search-input"
        />
      </div>

      {showLoading ? (
        <div className="artifact-loading">Loading artifacts</div>
      ) : (
        <>
          <div className="artifact-grid">
            {displayArtifacts.map((artifact) => {
              const isSelected = isArtifactSelected(artifact);
              const imageUrl = getArtifactPublicUrl(artifact);
              const displayName =
                artifact.name || artifact.slug || 'Unknown';

              return (
                <div
                  key={artifact.slug || artifact._id || artifact.id}
                  className={`artifact-option ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => setSelectedArtifact(artifact)}
                  onMouseEnter={(e) =>
                    handleArtifactHover(artifact, e)
                  }
                  onMouseLeave={hideOverlay}
                >
                  <img
                    src={imageUrl}
                    alt={displayName}
                    className="artifact-image"
                  />
                  <div className="artifact-fallback">
                    {displayName.length > 10
                      ? displayName.substring(0, 8) + "..."
                      : displayName}
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
          <StarRating
            value={selectedStars}
            onChange={setSelectedStars}
            maxStars={5}
            showZeroOption={true}
          />
        </div>
      )}

      <div className="btn-modal">
        {currentItem && (
          <button onClick={handleRemove} className="btn-modal-remove">Remove</button>
        )}
        <button onClick={onClose} className="btn-modal-cancel">Cancel</button>
        <button onClick={handleConfirm} className="btn-modal-confirm">Confirm</button>
      </div>
    </div>
  );
};

export default ArtifactModal;
