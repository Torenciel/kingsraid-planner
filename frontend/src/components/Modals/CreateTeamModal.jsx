// frontend/src/components/Modals/CreateTeamModal.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../../contexts/TeamContext';
import './CreateTeamModal.css';

const CreateTeamModal = ({ onTeamCreated, onClose }) => {
  const { createTeamWithModal } = useTeam();
  const navigate = useNavigate();
  
  const [teamName, setTeamName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  
  const handleCreateTeam = async () => {
    if (!teamName || !teamName.trim()) {
      setError('Please provide a team name');
      return;
    }
    
    setIsCreating(true);
    setError('');
    
    try {
      const result = await createTeamWithModal(teamName.trim(), isPublic);
      
      if (result.success) {
        navigate(result.fullUrl);
        
        if (onTeamCreated) {
          onTeamCreated(result);
        }
      } else {
        setError(result.error || 'Error while creating team');
      }
    } catch {
      setError('Connection error');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && teamName.trim()) {
      handleCreateTeam();
    }
  };
  
  const generateSlug = (name) => {
    if (!name.trim()) return 'team-name';
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
          <h2>Create a New Team</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        
        <div className="create-modal-body">
          <div className="form-group">
            <label htmlFor="teamName">Team Name *</label>
            <input
              id="teamName"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Example: My PVP Arena Team"
              className="team-name-input"
              autoFocus
              maxLength={50}
            />
            <div className="char-count">
              {teamName.length}/50 characters
            </div>
          </div>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span>Make this team public</span>
              <small>Visible to everyone in the gallery</small>
            </label>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="url-preview">
            <span className="preview-label">Your URL will be:</span>
            <div className="url-display">
              <span className="url-base">{window.location.origin}/team/</span>
              <span className="url-id">[id]/</span>
              <span className="url-slug">
                {generateSlug(teamName)}
              </span>
            </div>
            <p className="url-info">
              <small>
                This URL will be unique and shareable.
                Changes will be saved automatically.
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
            Cancel
          </button>
          <button
            onClick={handleCreateTeam}
            disabled={isCreating || !teamName.trim()}
            className={`create-button ${!teamName.trim() ? 'disabled' : ''}`}
          >
            {isCreating ? (
              <>
                <span className="spinner"></span>
                Creating...
              </>
            ) : (
              "Create Team"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTeamModal;
