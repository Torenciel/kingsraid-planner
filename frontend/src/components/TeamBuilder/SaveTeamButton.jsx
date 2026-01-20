import React, { useState, useEffect } from 'react';
import { useTeam } from '../../contexts/TeamContext';
import './SaveTeamButton.css';

const SaveTeamButton = () => {
  const { 
    team, 
    teamName: currentTeamName,
    subSlots, 
    subStars, 
    perks, 
    advancements,
    teamSize,
    saveTeam
  } = useTeam();
  
  const [showModal, setShowModal] = useState(false);
  const [teamName, setTeamName] = useState(currentTeamName || 'New Team');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSaveClick = () => {
    setTeamName(currentTeamName || 'New Team');
    setShowModal(true);
  };

  const handleSaveTeam = async () => {
    if (!teamName || !teamName.trim()) {
      setSaveMessage('Team name is required');
      return;
    }
    
    setIsSaving(true);
    setSaveMessage('Saving...');
    
    console.log('Starting save process');
    
    const teamData = {
      teamTitle: teamName.trim(),
      teamSize: teamSize,
      team: team,
      subSlots: subSlots,
      subStars: subStars,
      perks: perks,
      advancements: advancements
    };
    
    // Detailed logging
    console.log('Data to be sent:');
    console.log('- Team name:', teamData.teamTitle);
    console.log('- Team size:', teamData.teamSize);
    console.log('- Number of heroes:', team.filter(h => h).length);
    
    team.forEach((hero, idx) => {
      if (hero) {
        const artifact = subSlots[idx]?.[2];
        const gearSet = subSlots[idx]?.[3];
        
        console.log(`Hero ${idx} (${hero.name}):`);
        console.log('  - ID:', hero.id);
        console.log('  - Slug:', hero.slug);
        
        if (artifact) {
          console.log('  Artifact found:');
          console.log('    - artifactSlug:', artifact.artifactSlug);
          console.log('    - has artifactInfo:', !!artifact.artifactInfo);
          console.log('    - Stars:', subStars[idx]?.[2] || 0);
        }
        
        if (gearSet) {
          console.log('  Gear Set found:');
          console.log('    - gearSetSlug:', gearSet.gearSetSlug);
          console.log('    - has gearSetInfo:', !!gearSet.gearSetInfo);
          console.log('    - Pieces:', gearSet.pieces);
        }
      }
    });
    
    try {
      const result = await saveTeam(teamName.trim());
      
      console.log('Backend response:', result);
      
      if (result.success) {
        setSaveMessage(`Team "${teamName}" saved successfully!`);
        setTimeout(() => {
          setShowModal(false);
          setSaveMessage('');
        }, 2000);
      } else {
        setSaveMessage(`Error: ${result.error || 'Save failed'}`);
      }
    } catch (error) {
      console.error('Error during save:', error);
      setSaveMessage(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => {
        setSaveMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  const canSaveTeam = () => {
    const hasHeroes = team.filter(h => h).length > 0;
    const validName = teamName && teamName.trim().length > 0;
    return hasHeroes && validName && !isSaving;
  };

  const getArtifactCount = () => subSlots.flat().filter(item => item && item.artifactSlug).length;
  const getGearSetCount = () => subSlots.flat().filter(item => item && item.gearSetSlug).length;
  const getUWCount = () => subSlots.flat().filter(item => item && item.uwPath).length;
  const getUTCount = () => subSlots.flat().filter(item => item && item.choice).length;

  return (
    <>
      <div className="save-team-container">
        <div className="save-team-buttons">
          <button
            onClick={handleSaveClick}
            disabled={!canSaveTeam()}
            className={`save-button-main ${!canSaveTeam() ? 'disabled' : ''}`}
          >
            {isSaving ? (
              <>
                <span className="button-icon"></span>
                Saving...
              </>
            ) : (
              <>
                <span className="button-icon"></span>
                Save Team
              </>
            )}
          </button>
        </div>
        
        {saveMessage && (
          <div className={`save-message ${saveMessage.includes('successfully') ? 'success' : saveMessage.includes('Saving') ? 'warning' : 'error'}`}>
            {saveMessage}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              Save Team
            </h3>
            
            <div className="modal-body">
              <label className="modal-label">
                Team Name *
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Ex: Solo content team"
                className={`modal-input ${teamName && teamName.trim() ? 'valid' : 'invalid'}`}
                autoFocus
              />
              
              {(!teamName || !teamName.trim()) && (
                <div className="validation-error">
                  <span className="error-icon"></span>
                  Team name required
                </div>
              )}
              
              <div className="team-preview">                
                <div className="preview-grid">
                  <div className="preview-item">
                    <span className="preview-label">Heroes: </span>
                    <span className="preview-value">
                      {team.filter(h => h).length}/{teamSize}
                    </span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Sub-slots: </span>
                    <span className="preview-value">
                      {subSlots.flat().filter(item => item).length}
                    </span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Artifacts: </span>
                    <span className="preview-value">
                      {getArtifactCount()}
                    </span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Gear Sets: </span>
                    <span className="preview-value">
                      {getGearSetCount()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="btn-modal">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSaveMessage('');
                }}
                className="btn-modal-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTeam}
                disabled={isSaving || !teamName || !teamName.trim()}
                className={`modal-button save ${(!teamName || !teamName.trim() || isSaving) ? 'disabled' : ''}`}
              >
                {isSaving ? (
                  <>
                    <span className="button-icon"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="button-icon"></span>
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SaveTeamButton;