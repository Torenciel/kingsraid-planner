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

  const testBackendDirectly = async () => {
    console.log('=== 🧪 TEST BACKEND DIRECT ===');
    
    const testPayload = {
      teamData: {
        teamTitle: "Test Direct",
        teamSize: 4,
        team: [
          {
            id: "kasel",
            slug: "kasel",
            name: "Kasel",
            class: "Warrior",
            thumbnail: "/kingsraid-data/assets/heroes/Kasel/ico.png"
          },
          null, null, null
        ],
        subSlots: [
          [
            null,
            null,
            {
              artifactSlug: "madames_bronze_mirrors",
              artifactInfo: {
                name: "Madame's Bronze Mirrors",
                thumbnail: "/kingsraid-data/assets/artifacts/Madame's Bronze Mirrors.png",
                description: "Increase ATK by 10%"
              }
            },
            {
              gearSetSlug: "beast_of_chaos",
              gearSetInfo: {
                name: "Beast of Chaos",
                thumbnail: "/kingsraid-data/assets/gearsets/beast_of_chaos.png",
                bonus2P: "ATK +500",
                bonus4P: "Skill damage +15%"
              },
              pieces: 4,
              sets: ["beast_of_chaos"]
            }
          ],
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null]
        ],
        subStars: [
          [0, 0, 3, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0]
        ],
        perks: [
          { t3: { s1: "light", s2: null, s3: null, s4: null }, t5: null },
          null,
          null,
          null
        ],
        advancements: [null, null, null, null]
      },
      createdBy: "debug-test"
    };

    console.log('📤 Envoi test:', JSON.stringify(testPayload, null, 2));

    try {
      const response = await fetch('http://localhost:3002/api/v2/teams', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });
      
      const data = await response.json();
      console.log('📥 Réponse backend:', data);
      
      if (data.success) {
        alert(`✅ Test réussi! ID: ${data.teamId}`);
      } else {
        alert(`❌ Échec: ${data.error || 'Erreur inconnue'}`);
        console.error('Détails erreur:', data.details);
      }
    } catch (error) {
      console.error('💥 Erreur réseau:', error);
      alert(`❌ Erreur réseau: ${error.message}`);
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

          <button
            onClick={testBackendDirectly}
            className="test-backend-button"
          >
            🔧 Test Backend
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
                
                {team.filter(h => h).length > 0 && (
                  <div className="heroes-list">
                    <div className="heroes-title">Héros dans l'équipe:</div>
                    <div className="heroes-container">
                      {team.map((hero, idx) => (
                        hero && (
                          <div key={idx} className="hero-card">
                            <div className="hero-name">
                              {hero.name} <span className="hero-class">({hero.class})</span>
                            </div>
                            <div className="hero-equipment">
                              {subSlots[idx]?.[2] && (
                                <span className="equipment-badge artifact">
                                  🎯 {subSlots[idx][2].artifactInfo?.name}
                                </span>
                              )}
                              {subSlots[idx]?.[3] && (
                                <span className="equipment-badge gearset">
                                  ⚙️ {subSlots[idx][3].gearSetInfo?.name}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSaveMessage('');
                }}
                className="modal-button cancel"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveTeam}
                disabled={isSaving || !teamName || !teamName.trim()}
                className={`modal-button save ${(!teamName || !teamName.trim() || isSaving) ? 'disabled' : ''}`}
              >
                {isSaving ? (
                  <>
                    <span className="button-icon">⏳</span>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <span className="button-icon">💾</span>
                    Sauvegarder
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