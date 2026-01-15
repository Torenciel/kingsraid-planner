// frontend/src/components/Modals/CreateTeamModal.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ IMPORT AJOUTÉ
import { useTeam } from '../../contexts/TeamContext';
import './CreateTeamModal.css';

const CreateTeamModal = ({ onTeamCreated, onClose }) => {
  const { createTeamWithModal } = useTeam();
  const navigate = useNavigate(); // ✅ VARIABLE AJOUTÉE
  
  const [teamName, setTeamName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  
  const handleCreateTeam = async () => {
    if (!teamName || !teamName.trim()) {
      setError('Veuillez donner un nom à votre équipe');
      return;
    }
    
    setIsCreating(true);
    setError('');
    
    try {
      const result = await createTeamWithModal(teamName.trim(), isPublic);
      
      console.log('📝 Résultat création:', result);
      
      if (result.success) {
        // ✅ NAVIGATE EST DÉFINI
        navigate(result.fullUrl);
        
        if (onTeamCreated) {
          onTeamCreated(result);
        }
      } else {
        setError(result.error || 'Erreur lors de la création');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && teamName.trim()) {
      handleCreateTeam();
    }
  };
  
  // Générer le slug prévisualisé
  const generateSlug = (name) => {
    if (!name.trim()) return 'nom-de-lequipe';
    return name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  };
  
  return (
    <div className="create-modal-overlay">
      <div className="create-modal-content">
        <div className="create-modal-header">
          <h2>🏗️ Créer une nouvelle équipe</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        
        <div className="create-modal-body">
          <div className="form-group">
            <label htmlFor="teamName">Nom de l'équipe *</label>
            <input
              id="teamName"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: Mon équipe PVP Arena"
              className="team-name-input"
              autoFocus
              maxLength={50}
            />
            <div className="char-count">
              {teamName.length}/50 caractères
            </div>
          </div>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span>Rendre cette équipe publique</span>
              <small>Visible par tout le monde dans la galerie</small>
            </label>
          </div>
          
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
          
          <div className="url-preview">
            <span className="preview-label">Votre URL sera :</span>
            <div className="url-display">
              <span className="url-base">{window.location.origin}/team/</span>
              <span className="url-id">[id]/</span>
              <span className="url-slug">
                {generateSlug(teamName)}
              </span>
            </div>
            <p className="url-info">
              <small>
                Cette URL sera unique et pourra être partagée.
                Les modifications seront sauvegardées automatiquement.
              </small>
            </p>
          </div>
        </div>
        
        <div className="create-modal-footer">
          <button
            onClick={onClose}
            className="cancel-button"
            disabled={isCreating}
          >
            Annuler
          </button>
          <button
            onClick={handleCreateTeam}
            disabled={isCreating || !teamName.trim()}
            className={`create-button ${!teamName.trim() ? 'disabled' : ''}`}
          >
            {isCreating ? (
              <>
                <span className="spinner"></span>
                Création...
              </>
            ) : (
              'Créer l\'équipe'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTeamModal;