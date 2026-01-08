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
      setSaveMessage('❌ Le nom de l\'équipe est requis');
      return;
    }
    
    setIsSaving(true);
    setSaveMessage('⏳ Sauvegarde en cours...');
    
    console.log('=== 🚀 DÉBUT SAUVEGARDE ===');
    
    const teamData = {
      teamTitle: teamName.trim(),
      teamSize: teamSize,
      team: team,
      subSlots: subSlots,
      subStars: subStars,
      perks: perks,
      advancements: advancements
    };
    
    // Log détaillé
    console.log('📤 Données à envoyer:');
    console.log('- Nom équipe:', teamData.teamTitle);
    console.log('- Taille:', teamData.teamSize);
    console.log('- Nombre héros:', team.filter(h => h).length);
    
    team.forEach((hero, idx) => {
      if (hero) {
        const artifact = subSlots[idx]?.[2];
        const gearSet = subSlots[idx]?.[3];
        
        console.log(`\n👤 Héros ${idx} (${hero.name}):`);
        console.log('  - ID:', hero.id);
        console.log('  - Slug:', hero.slug);
        
        if (artifact) {
          console.log('  🎯 Artifact trouvé:');
          console.log('    - artifactSlug:', artifact.artifactSlug);
          console.log('    - has artifactInfo:', !!artifact.artifactInfo);
          console.log('    - Stars:', subStars[idx]?.[2] || 0);
        }
        
        if (gearSet) {
          console.log('  ⚙️ Gear Set trouvé:');
          console.log('    - gearSetSlug:', gearSet.gearSetSlug);
          console.log('    - has gearSetInfo:', !!gearSet.gearSetInfo);
          console.log('    - Pieces:', gearSet.pieces);
        }
      }
    });
    
    try {
      const result = await saveTeam(teamName.trim());
      
      console.log('📥 Réponse backend:', result);
      
      if (result.success) {
        setSaveMessage(`✅ Équipe "${teamName}" sauvegardée avec succès!`);
        setTimeout(() => {
          setShowModal(false);
          setSaveMessage('');
        }, 2000);
      } else {
        setSaveMessage(`❌ Erreur: ${result.error || 'Échec de sauvegarde'}`);
      }
    } catch (error) {
      console.error('💥 Erreur lors de la sauvegarde:', error);
      setSaveMessage(`❌ Erreur: ${error.message}`);
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
                <span className="button-icon">⏳</span>
                Sauvegarde...
              </>
            ) : (
              <>
                <span className="button-icon">💾</span>
                Sauvegarder l'équipe
              </>
            )}
          </button>
        </div>
        
        {saveMessage && (
          <div className={`save-message ${saveMessage.includes('✅') ? 'success' : saveMessage.includes('⏳') ? 'warning' : 'error'}`}>
            {saveMessage}
          </div>
        )}
        
        <div className="team-stats">
          <div className="stats-row">
            <div className="stat-item">
              <div className={`stat-indicator ${team.filter(h => h).length > 0 ? 'active' : 'inactive'}`}></div>
              <span className="stat-label">Héros:</span>
              <span className="stat-value">{team.filter(h => h).length}/{teamSize}</span>
            </div>
            
            <div className="stat-item">
              <div className={`stat-indicator ${subSlots.flat().filter(item => item).length > 0 ? 'active' : 'inactive'}`}></div>
              <span className="stat-label">Équipements:</span>
              <span className="stat-value">{subSlots.flat().filter(item => item).length}</span>
            </div>
          </div>
          
          <div className="equipment-details">
            <span className="equipment-item">Artifacts: {getArtifactCount()}</span>
            <span className="equipment-item">Gear Sets: {getGearSetCount()}</span>
            <span className="equipment-item">UW: {getUWCount()}</span>
            <span className="equipment-item">UT: {getUTCount()}</span>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              <span className="modal-icon">💾</span>
              Sauvegarder l'équipe
            </h3>
            
            <div className="modal-body">
              <label className="modal-label">
                Nom de l'équipe *
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Ex: Mon équipe PVP"
                className={`modal-input ${teamName && teamName.trim() ? 'valid' : 'invalid'}`}
                autoFocus
              />
              
              {(!teamName || !teamName.trim()) && (
                <div className="validation-error">
                  <span className="error-icon">⚠️</span>
                  Le nom de l'équipe est requis
                </div>
              )}
              
              <div className="team-preview">
                <div className="preview-title">📊 Aperçu de l'équipe:</div>
                
                <div className="preview-grid">
                  <div className="preview-item">
                    <span className="preview-label">Héros:</span>
                    <span className="preview-value">
                      {team.filter(h => h).length}/{teamSize}
                    </span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Équipements:</span>
                    <span className="preview-value">
                      {subSlots.flat().filter(item => item).length}
                    </span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Artifacts:</span>
                    <span className="preview-value">
                      {getArtifactCount()}
                    </span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Gear Sets:</span>
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
                    <span className="button-icon">⏳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="button-icon">💾</span>
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