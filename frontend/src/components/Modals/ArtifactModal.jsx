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

  // Fonction pour extraire le nom de fichier de l'URL
  const getArtifactNameFromUrl = (url) => {
    if (!url) return null;
    
    // Si c'est un objet spécial
    if (typeof url === 'object' && url._stringValue) {
      const match = url._stringValue.match(/artifacts\/(.+)\.png$/);
      return match ? match[1] : null;
    }
    
    // Si c'est une string
    if (typeof url === 'string') {
      const match = url.match(/artifacts\/(.+)\.png$/);
      return match ? match[1] : null;
    }
    
    return null;
  };

  const currentArtifactName = currentItem ? getArtifactNameFromUrl(currentItem) : null;
  
  // Trouver l'artifact par nom de fichier
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
  const [selectedStars, setSelectedStars] = useState(currentStars || 0);
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

  // Fonction pour créer l'objet spécial
  const createSpecialArtifactObject = (artifact, stars) => {
    if (!artifact) return null;
    
    const fileName = getArtifactFileName(artifact);
    const artifactPath = `/kingsraid-data/assets/artifacts/${fileName}.png`;
    
    // Créer un objet qui peut être utilisé comme string par SubSlotOverlay
    const specialObject = {
      // Pour SubSlotOverlay (qui utilise .split() et autres méthodes de string)
      _stringValue: artifactPath,
      
      // Pour SaveTeamButton (qui a besoin de l'ID)
      _type: 'artifact',
      _id: artifact._id || artifact.id,
      _name: artifact.name,
      _thumbnail: artifactPath,
      _description: artifact.description || '',
      _values: artifact.rawData?.value || artifact.value || {},
      
      // Méthodes pour se comporter comme une string
      toString: function() { return this._stringValue; },
      valueOf: function() { return this._stringValue; },
      
      // Méthodes string que SubSlotOverlay pourrait utiliser
      split: function(separator, limit) {
        return this._stringValue.split(separator, limit);
      },
      includes: function(searchString, position) {
        return this._stringValue.includes(searchString, position);
      },
      toLowerCase: function() {
        return this._stringValue.toLowerCase();
      },
      match: function(regexp) {
        return this._stringValue.match(regexp);
      },
      replace: function(pattern, replacement) {
        return this._stringValue.replace(pattern, replacement);
      },
      indexOf: function(searchValue, fromIndex) {
        return this._stringValue.indexOf(searchValue, fromIndex);
      },
      slice: function(beginIndex, endIndex) {
        return this._stringValue.slice(beginIndex, endIndex);
      },
      substring: function(start, end) {
        return this._stringValue.substring(start, end);
      }
    };
    
    console.log('🔧 Objet spécial créé:', {
      stringValue: specialObject._stringValue,
      id: specialObject._id,
      name: specialObject._name,
      type: specialObject._type
    });
    
    return specialObject;
  };

  const handleConfirm = () => {
    console.log('🔧 ArtifactModal - Confirmation');
    console.log('Selected artifact:', selectedArtifact);
    console.log('Selected stars:', selectedStars);
    
    if (!selectedArtifact) {
      console.log('❌ Aucun artifact sélectionné');
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
    } else {
      // Créer l'objet spécial
      const specialObject = createSpecialArtifactObject(selectedArtifact, selectedStars);
      
      if (!specialObject) {
        console.error('❌ Impossible de créer l\'objet artifact');
        // Fallback: envoyer le chemin normal
        const artifactFileName = getArtifactFileName(selectedArtifact);
        const artifactPath = `/kingsraid-data/assets/artifacts/${artifactFileName}.png`;
        updateSubSlot(teamSlotIndex, subSlotIndex, artifactPath, selectedStars);
      } else {
        console.log('✅ Envoi objet spécial à updateSubSlot');
        updateSubSlot(teamSlotIndex, subSlotIndex, specialObject, selectedStars);
      }
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
      return selectedArtifact._id.toString() === artifact._id.toString();
    }
    if (selectedArtifact.id && artifact.id) {
      return selectedArtifact.id.toString() === artifact.id.toString();
    }
    if (selectedArtifact.name && artifact.name) {
      return selectedArtifact.name === artifact.name;
    }
    
    return false;
  };

  return (
    <div className="artifact-modal-container">
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
                console.log('🧹 Artifact vide sélectionné');
                setSelectedArtifact(null);
                setSelectedStars(0);
              }}
            >
              Empty
            </div>

            {displayArtifacts.map((artifact) => {
              const artifactFileName = getArtifactFileName(artifact);
              const isSelected = isArtifactSelected(artifact);
              const imageUrl = `/kingsraid-data/assets/artifacts/${artifactFileName}.png`;

              return (
                <div
                  key={artifact._id || artifact.id || artifact.name}
                  className={`artifact-option ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    console.log('🎯 Artifact sélectionné:', artifact.name);
                    setSelectedArtifact(artifact);
                  }}
                  onMouseEnter={(e) => handleArtifactHover(artifact, e)}
                  onMouseLeave={hideOverlay}
                >
                  <img
                    src={imageUrl}
                    alt={artifact.name}
                    className="artifact-image"
                    onError={(e) => {
                      console.warn(`❌ Image non chargée: ${imageUrl}`);
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
            onChange={(stars) => {
              console.log(`⭐ Stars changées: ${stars}`);
              setSelectedStars(stars);
            }}
            maxStars={5}
            showZeroOption={true}
          />
        </div>
      )}

      <div className="artifact-modal-buttons">
        <button 
          onClick={handleConfirm} 
          className="artifact-modal-confirm"
        >
          Confirm
        </button>
        <button 
          onClick={onClose} 
          className="artifact-modal-cancel"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ArtifactModal;