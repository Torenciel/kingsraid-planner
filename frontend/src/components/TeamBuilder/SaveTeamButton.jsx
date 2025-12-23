// src/components/TeamBuilder/SaveTeamButton.jsx
import React, { useState } from 'react';
import { useTeam } from '../../contexts/TeamContext';
import api from '../../services/api';

const SaveTeamButton = () => {
  const { 
    team, 
    teamTitle, 
    subSlots, 
    subStars, 
    perks, 
    advancements,
    teamSize 
  } = useTeam();
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [teamName, setTeamName] = useState(teamTitle);
  const [savedTeamId, setSavedTeamId] = useState(null);

  const handleSaveClick = () => {
    setTeamName(teamTitle);
    setShowModal(true);
  };

  // Fonction pour extraire les infos d'un item
  const extractItemInfo = (item, slotIndex, subIndex) => {
    if (!item) return null;
    
    console.log(`🔍 Extraction item: slot=${slotIndex}, sub=${subIndex}`, item);
    
    // NOUVEAU FORMAT: Objet spécial avec _type (de ArtifactModal)
    if (typeof item === 'object' && item._type) {
      console.log('📦 Objet spécial détecté:', item._type, item);
      
      switch (item._type) {
        case 'artifact':
          return {
            type: 'artifact',
            id: item._id, // ObjectId MongoDB
            name: item._name || 'Artifact',
            thumbnail: item._thumbnail || item.toString(),
            description: item._description || '',
            value: item._values || {}
          };
          
        case 'uw':
          return {
            type: 'uw',
            name: item._name || 'Unique Weapon'
          };
          
        case 'ut':
          return {
            type: 'ut',
            id: item._id || 1,
            name: item._name || `UT${item._id || 1}`
          };
          
        case 'gearset':
          return {
            type: 'gearset',
            id: item._id,
            name: item._name || 'Gear Set',
            image: item._image || item.toString(),
            bonus2P: item._bonus2P || '',
            bonus4P: item._bonus4P || ''
          };
          
        default:
          console.warn('❌ Type d\'objet spécial inconnu:', item._type);
          return null;
      }
    }
    
    // ANCIEN FORMAT: String (chemin d'image)
    if (typeof item === 'string') {
      console.log('📄 String détectée:', item);
      
      // UW (slot 0)
      if (slotIndex === 0 && item.includes('unique_weapon')) {
        return {
          type: 'uw',
          name: 'Unique Weapon'
        };
      }
      
      // UT (slot 1)
      if (slotIndex === 1 && item.includes('ut')) {
        const utMatch = item.match(/ut(\d)/i);
        const utNumber = utMatch ? parseInt(utMatch[1]) : 1;
        
        return {
          type: 'ut',
          id: utNumber,
          name: `UT${utNumber}`
        };
      }
      
      // Artifact (slot 2)
      if (slotIndex === 2 && item.includes('artifact')) {
        const artifactName = item.split('/artifacts/')[1]?.replace('.png', '');
        
        return {
          type: 'artifact',
          name: artifactName ? artifactName.replace(/_/g, ' ') : 'Artifact',
          thumbnail: item,
          description: ''
        };
      }
      
      // GearSet (slot 3) - Peut être une string JSON ou un chemin
      if (slotIndex === 3) {
        // Essayer de parser comme JSON d'abord
        try {
          const gearSets = JSON.parse(item);
          if (Array.isArray(gearSets) && gearSets.length > 0) {
            // Si c'est un tableau de noms de gearsets
            if (gearSets.length === 1) {
              return {
                type: 'gearset',
                name: gearSets[0].replace(/_/g, ' '),
                id: gearSets[0]
              };
            } else {
              return {
                type: 'gearset_combo',
                sets: gearSets,
                name: 'Mixed Gear Sets'
              };
            }
          }
        } catch (e) {
          // Ce n'est pas du JSON, c'est probablement un chemin d'image
          if (item.includes('gearset')) {
            const gearsetName = item.split('/gearsets/')[1]?.replace('.png', '');
            return {
              type: 'gearset',
              name: gearsetName ? gearsetName.replace(/_/g, ' ') : 'Gear Set',
              image: item,
              id: gearsetName
            };
          }
        }
      }
    }
    
    // SI c'est déjà un objet normal (format intermédiaire)
    if (typeof item === 'object' && item.type) {
      console.log('📊 Objet normal détecté:', item.type);
      return item;
    }
    
    console.warn('❌ Format d\'item non reconnu:', typeof item, item);
    return null;
  };

  const handleSaveTeam = async () => {
    // Vérification basique
    const heroCount = team.filter(h => h !== null).length;
    if (heroCount === 0) {
      setMessage('❌ Ajoutez au moins un héros avant de sauvegarder !');
      setShowModal(false);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setIsSaving(true);
    setMessage('💾 Sauvegarde en cours...');

    try {
      // Préparer les données pour l'API
      const teamData = {
        teamSize,
        teamTitle: teamName || teamTitle,
        team: team.map(hero => {
          if (!hero) return null;
          
          return {
            id: hero.slug || hero.id, // IMPORTANT: slug pour la recherche
            slug: hero.slug || hero.id,
            name: hero.name,
            class: hero.class,
            position: hero.position,
            thumbnail: hero.thumbnail
            // Note: Si vos héros ont d'autres infos (transcendence, etc.), ajoutez-les ici
          };
        }),
        subSlots: subSlots.map((slot, slotIndex) => 
          slot.map((item, subIndex) => {
            return extractItemInfo(item, slotIndex, subIndex);
          })
        ),
        subStars,
        perks,
        advancements
      };

      console.log('📤 Données prêtes à envoyer:', teamData);
      
      // Afficher un résumé détaillé
      console.log('📊 === RÉSUMÉ DE L\'ÉQUIPE ===');
      console.log(`Nom: ${teamData.teamTitle}`);
      console.log(`Taille: ${teamData.teamSize} slots`);
      console.log(`Héros: ${teamData.team.filter(h => h).length}`);
      
      console.log('\n🎮 Héros:');
      teamData.team.forEach((hero, i) => {
        if (hero) {
          console.log(`  ${i}. ${hero.name} (${hero.class}) - Slug: ${hero.slug}`);
        }
      });
      
      console.log('\n🎯 Items équipés:');
      teamData.subSlots.forEach((slot, i) => {
        const items = slot.filter(item => item !== null);
        if (items.length > 0) {
          console.log(`Slot ${i} (${['UW', 'UT', 'Artifact', 'GearSet'][i]}):`);
          items.forEach((item, j) => {
            if (item) {
              console.log(`  → ${item.type}: ${item.name}${item.id ? ` (ID: ${item.id})` : ''}`);
              if (item.stars) console.log(`    ⭐ ${item.stars} étoiles`);
            }
          });
        }
      });

      // Envoyer à l'API
      const response = await api.saveTeam(teamData);
      
      console.log('📥 Réponse du serveur:', response);

      if (response.success) {
        setMessage(`✅ Équipe "${response.team.teamTitle}" sauvegardée !`);
        setSavedTeamId(response.teamId);
        
        // Stocker l'ID pour référence
        if (response.teamId) {
          localStorage.setItem('lastSavedTeamId', response.teamId);
          console.log(`🆔 Team ID sauvegardé: ${response.teamId}`);
          
          // Copier l'ID dans le clipboard
          try {
            await navigator.clipboard.writeText(response.teamId);
            console.log('📋 ID copié dans le clipboard');
            setMessage(prev => prev + ' (ID copié)');
          } catch (err) {
            console.warn('⚠️ Impossible de copier l\'ID:', err);
          }
        }
      } else {
        setMessage(`❌ Erreur: ${response.error || 'Sauvegarde échouée'}`);
      }
    } catch (error) {
      console.error('🔥 Erreur de sauvegarde:', error);
      setMessage(`❌ Erreur: ${error.message || 'Connexion au serveur échouée'}`);
    } finally {
      setIsSaving(false);
      setShowModal(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <>
      {/* Bouton principal */}
      <div style={{ margin: '20px 0', textAlign: 'center' }}>
        <button
          onClick={handleSaveClick}
          disabled={isSaving}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: isSaving ? 0.7 : 1,
            transition: 'all 0.3s',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
        >
          {isSaving ? (
            <>
              <span style={{ marginRight: '8px' }}>⏳</span>
              Sauvegarde...
            </>
          ) : (
            <>
              <span style={{ marginRight: '8px' }}>💾</span>
              Sauvegarder l'équipe
            </>
          )}
        </button>
        
        {/* Message de statut */}
        {message && (
          <div style={{
            marginTop: '15px',
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
            color: message.includes('✅') ? '#155724' : '#721c24',
            border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            {message}
            {savedTeamId && (
              <div style={{ marginTop: '8px', fontSize: '0.9em' }}>
                <strong>ID de l'équipe:</strong> 
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  marginTop: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.85em',
                  wordBreak: 'break-all'
                }}>
                  {savedTeamId}
                </div>
                <small style={{ color: '#6c757d', display: 'block', marginTop: '4px' }}>
                  Cet ID a été copié dans votre presse-papiers
                </small>
              </div>
            )}
          </div>
        )}
        
        {/* Petit indicateur d'état */}
        <div style={{ 
          marginTop: '10px', 
          fontSize: '0.9em', 
          color: '#6c757d',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: team.filter(h => h).length > 0 ? '#28a745' : '#dc3545',
              marginRight: '6px'
            }}></div>
            Héros: {team.filter(h => h).length}/{teamSize}
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: subSlots.flat().filter(item => item).length > 0 ? '#28a745' : '#6c757d',
              marginRight: '6px'
            }}></div>
            Items: {subSlots.flat().filter(item => item).length}
          </div>
        </div>
      </div>

      {/* Modal pour le nom de l'équipe */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            minWidth: '400px',
            maxWidth: '500px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>💾 Sauvegarder l'équipe</h3>
            
            <div style={{ margin: '20px 0' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Nom de l'équipe:
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Ex: Mon équipe PVP"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  marginBottom: '15px'
                }}
                autoFocus
              />
              
              {/* Aperçu de l'équipe */}
              <div style={{ 
                background: '#f8f9fa', 
                color: `#0a0a0a`,
                padding: '15px', 
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#495057' }}>
                  📊 Aperçu de l'équipe:
                </div>
                <div style={{ fontSize: '0.9em' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Héros:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {team.filter(h => h !== null).length}/{teamSize}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Items équipés:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {subSlots.flat().filter(item => item !== null).length}/{(team.filter(h => h).length * 4)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Perks configurés:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {perks.filter(p => p !== null).length}
                    </span>
                  </div>
                </div>
                
                {/* Liste des héros */}
                {team.filter(h => h).length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ fontSize: '0.85em', color: '#6c757d', marginBottom: '5px' }}>
                      Héros dans l'équipe:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {team.map((hero, idx) => (
                        hero && (
                          <span key={idx} style={{
                            background: '#e3f2fd',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.8em',
                            color: '#1976d2',
                            border: '1px solid #bbdefb'
                          }}>
                            {hero.name}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px'
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveTeam}
                disabled={isSaving || !teamName.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: teamName.trim() ? (isSaving ? '#6c757d' : '#28a745') : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: teamName.trim() && !isSaving ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (teamName.trim() && !isSaving) {
                    e.target.style.backgroundColor = '#218838';
                  }
                }}
                onMouseLeave={(e) => {
                  if (teamName.trim() && !isSaving) {
                    e.target.style.backgroundColor = '#28a745';
                  }
                }}
              >
                {isSaving ? (
                  <>
                    <span style={{ marginRight: '8px' }}>⏳</span>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <span style={{ marginRight: '8px' }}>💾</span>
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