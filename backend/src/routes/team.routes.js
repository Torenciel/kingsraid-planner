// backend/routes/v2/team.routes.js - VERSION SIMPLIFIÉE POUR TEST
const express = require('express');
const router = express.Router();

// Charger les modèles
let Team, teamConverter;
try {
  Team = require('../../src/models/Team');
  teamConverter = require('../../src/utils/teamConverter');
} catch (error) {
  console.log('⚠️  Modules non chargés:', error.message);
}

// @route   POST /api/v2/teams
router.post('/', async (req, res) => {
  try {
    console.log('📨 POST /teams - Données reçues');
    
    const { teamData, createdBy = 'anonymous' } = req.body;
    
    if (!teamData) {
      return res.status(400).json({
        success: false,
        error: 'teamData est requis',
        received: req.body
      });
    }
    
    // Log détaillé
    console.log('📝 TeamData:');
    console.log('- Titre:', teamData.teamTitle);
    console.log('- Taille:', teamData.teamSize);
    console.log('- Héros:', teamData.team?.filter(h => h).length || 0);
    
    if (teamData.team) {
      teamData.team.forEach((hero, idx) => {
        if (hero) {
          console.log(`  Slot ${idx}: ${hero.name} (ID: ${hero.id}, Slug: ${hero.slug})`);
        }
      });
    }
    
    // Conversion
    const dbTeamData = teamConverter.convertTeamContextToDB(
      teamData,
      teamData.teamTitle || 'Test Team',
      createdBy
    );
    
    console.log('✅ Conversion OK');
    console.log('- Nom DB:', dbTeamData.name);
    console.log('- Héros DB:', dbTeamData.heroes.length);
    
    // Validation manuelle avant sauvegarde
    for (const hero of dbTeamData.heroes) {
      console.log(`  Héros: ${hero.heroInfo.name}`);
      console.log(`    Slug: ${hero.heroSlug}`);
      console.log(`    Classe: ${hero.heroInfo.class}`);
      console.log(`    Position: ${hero.heroInfo.position}`);
      console.log(`    Thumbnail: ${hero.heroInfo.thumbnail}`);
    }
    
    // Sauvegarde
    const team = new Team(dbTeamData);
    const savedTeam = await team.save();
    
    console.log(`🎉 Équipe sauvegardée: ${savedTeam._id}`);
    
    // Conversion inverse pour réponse
    const teamContextData = teamConverter.convertDBToTeamContext(savedTeam.toObject());
    
    res.status(201).json({
      success: true,
      message: 'Team saved successfully',
      teamId: savedTeam._id,
      team: teamContextData
    });
    
  } catch (error) {
    console.error('❌ Erreur POST /teams:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      console.error('🔍 Erreurs de validation détaillées:');
      for (const field in error.errors) {
        const err = error.errors[field];
        console.error(`  - ${field}: ${err.message} (valeur: ${err.value})`);
      }
      
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: Object.keys(error.errors),
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to save team: ' + error.message
    });
  }
});

// Routes simples pour tester
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find({}).limit(10).lean();
    res.json({
      success: true,
      count: teams.length,
      teams: teams.map(t => ({
        id: t._id,
        name: t.name,
        teamSize: t.teamSize,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    res.json({ success: true, count: 0, teams: [] });
  }
});

module.exports = router;