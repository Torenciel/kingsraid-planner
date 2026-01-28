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
  const { allArtifacts, loading } = useArtifacts();
  const { showOverlay, hideOverlay } = useOverlay();

// Fonction pour obtenir le chemin d'image
const getArtifactImageUrl = (artifact) => {
  if (!artifact) return '';
  
  if (artifact.thumbnail) {
    // Si c'est déjà une URL complète
    if (artifact.thumbnail.startsWith('http')) {
      return artifact.thumbnail;
    }
    // Si c'est un chemin avec artifacts/ (format MongoDB)
    else if (artifact.thumbnail.includes('artifacts/')) {
      const filename = artifact.thumbnail.split('/').pop(); // "Madame's Bronze Mirrors.png"
      // Encoder seulement les espaces, garder les apostrophes
      const encodedFilename = filename.replace(/\s/g, '%20');
      return `/kingsraid-data/assets/artifacts/${encodedFilename}`;
    }
    // Sinon, encoder directement
    else {
      const encodedFilename = artifact.thumbnail.replace(/\s/g, '%20');
      return `/kingsraid-data/assets/artifacts/${encodedFilename}`;
    }
  }
  
  // Fallback très basique si vraiment pas de thumbnail
  return `/kingsraid-data/assets/artifacts/unknown.png`;
};

  // Fonction pour obtenir le nom de fichier pour la sauvegarde
  const getArtifactFilename = (artifact) => {
    if (!artifact) return '';
    
    if (artifact.thumbnail) {
      // Extraire juste le nom du fichier
      if (artifact.thumbnail.includes('artifacts/')) {
        return artifact.thumbnail.split('/').pop();
      }
      return artifact.thumbnail;
    }
    
    // Fallback
    return `${artifact.name || artifact.slug || ''}.png`;
  };

  // Initialiser l'état
  const [selectedArtifact, setSelectedArtifact] = useState(() => {
    // Si pas d'item, retourner null
    if (!currentItem) return null;
    
    // Attendre que les artefacts soient chargés
    if (!allArtifacts || allArtifacts.length === 0) {
      return null;
    }
    
    // Si currentItem a artifactSlug (format de sauvegarde)
    if (currentItem.artifactSlug) {
      const found = allArtifacts.find(a => a.slug === currentItem.artifactSlug);
      if (found) return found;
    }
    
    // Si currentItem est déjà un objet artefact MongoDB
    if (currentItem.slug) {
      const found = allArtifacts.find(a => a.slug === currentItem.slug);
      if (found) return found;
    }
    
    return null;
  });
  
  const [selectedStars, setSelectedStars] = useState(currentStars || 0);
  const [searchTerm, setSearchTerm] = useState("");

  // Effet pour réessayer de trouver l'artefact quand les données sont chargées
  useEffect(() => {
    if (allArtifacts.length > 0 && currentItem && !selectedArtifact) {
      let foundArtifact = null;
      
      // Essayer par artifactSlug
      if (currentItem.artifactSlug) {
        foundArtifact = allArtifacts.find(a => a.slug === currentItem.artifactSlug);
      }
      
      // Essayer par slug
      if (!foundArtifact && currentItem.slug) {
        foundArtifact = allArtifacts.find(a => a.slug === currentItem.slug);
      }
      
      // Essayer par _id
      if (!foundArtifact && currentItem._id) {
        foundArtifact = allArtifacts.find(a => a._id?.toString() === currentItem._id.toString());
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
        return name.toLowerCase().includes(searchLower) || 
               slug.toLowerCase().includes(searchLower);
      });
    }
    return allArtifacts;
  }, [searchTerm, allArtifacts]);

  // Fonction pour obtenir les données d'un artifact
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

  // Créer l'objet pour la sauvegarde
  const createArtifactObjectForSave = (artifact, stars) => {
    if (!artifact) return null;
    
    const artifactFilename = getArtifactFilename(artifact);
    
    return {
    artifactSlug: artifact.slug || artifact._id?.toString(),
    artifactInfo: {
      name: artifact.name,
      thumbnail: artifact.thumbnail || getArtifactImageUrl(artifact),
      description: artifact.description || ""
    },
    stars: stars
    };
  };

  const handleConfirm = () => {
    if (!selectedArtifact) {
      updateSubSlot(teamSlotIndex, subSlotIndex, null, 0);
    } else {
      const artifactData = createArtifactObjectForSave(selectedArtifact, selectedStars);
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
        values={artifactData.values || artifactData.value}
        itemType="artifact"
      />,
      position
    );
  };

  const isArtifactSelected = (artifact) => {
    if (!selectedArtifact || !artifact) return false;
    
    // Comparer par slug
    if (selectedArtifact.slug && artifact.slug) {
      return selectedArtifact.slug === artifact.slug;
    }
    
    // Comparer par _id
    if (selectedArtifact._id && artifact._id) {
      return selectedArtifact._id.toString() === artifact._id.toString();
    }
    
    return false;
  };

  // Fonction pour gérer les erreurs de chargement d'image
  const handleImageError = (e, artifact) => {
    // Essayer plusieurs alternatives
    const name = artifact.name || artifact.slug || '';
    
    if (name) {
      
      // 1. Essayer avec encodage
      const encodedName = encodeURIComponent(`${name}.png`);
      const encodedPath = `/kingsraid-data/assets/artifacts/${encodedName}`;
      if (encodedPath !== e.target.src) {
        e.target.src = encodedPath;
        return;
      }
      
      // 2. Essayer sans apostrophe
      const noApostropheName = name.replace(/'/g, '');
      const noApostrophePath = `/kingsraid-data/assets/artifacts/${encodeURIComponent(noApostropheName)}.png`;
      if (noApostrophePath !== e.target.src) {
        e.target.src = noApostrophePath;
        return;
      }
      
      // 3. Essayer avec underscore
      const underscoreName = name.replace(/'/g, '').replace(/\s+/g, '_');
      const underscorePath = `/kingsraid-data/assets/artifacts/${underscoreName}.png`;
      if (underscorePath !== e.target.src) {
        e.target.src = underscorePath;
        return;
      }
    }
    
    // Si tout échoue, afficher le fallback
    e.target.style.display = "none";
    const fallback = e.target.nextElementSibling;
    if (fallback) {
      fallback.style.display = "flex";
    }
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
            <div
              className={`artifact-option empty ${
                !selectedArtifact ? "selected" : ""
              }`}
              onClick={() => {
                setSelectedArtifact(null);
                setSelectedStars(0);
              }}
            >
              <div className="empty-slot-label">Empty</div>
            </div>

            {displayArtifacts.map((artifact) => {
              const isSelected = isArtifactSelected(artifact);
              const imageUrl = getArtifactImageUrl(artifact);
              const displayName = artifact.name || artifact.slug || 'Unknown';

              return (
                <div
                  key={artifact.slug || artifact._id || artifact.id}
                  className={`artifact-option ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedArtifact(artifact)}
                  onMouseEnter={(e) => handleArtifactHover(artifact, e)}
                  onMouseLeave={hideOverlay}
                >
                  <img
                    src={imageUrl}
                    alt={displayName}
                    className="artifact-image"
                    onError={(e) => handleImageError(e, artifact)}
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
          {/* <div className="artifact-stars-label">
            <span className="artifact-stars-name">
              {selectedArtifact.name || selectedArtifact.slug}
            </span>
          </div> */}
          <StarRating
            value={selectedStars}
            onChange={setSelectedStars}
            maxStars={5}
            showZeroOption={true}
          />
        </div>
      )}

      <div className="btn-modal">
        <button 
          onClick={onClose} 
          className="btn-modal-cancel"
        >
          Cancel
        </button>
        <button 
          onClick={handleConfirm} 
          className="btn-modal-confirm"
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default ArtifactModal;