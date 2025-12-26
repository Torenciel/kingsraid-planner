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

// Route principale de sauvegarde
router.post('/', async (req, res) => {
  try {
    console.log('=== 🎯 BACKEND REÇOIT SAUVEGARDE ===');
    
    const { teamData, createdBy = 'anonymous' } = req.body;
    
    if (!teamData) {
      console.log('❌ teamData manquant');
      return res.status(400).json({
        success: false,
        error: 'teamData est requis'
      });
    }
    
    console.log('📊 teamData.advancements:', teamData.advancements);
    console.log('Type advancements[0]:', teamData.advancements && teamData.advancements[0] !== undefined ? typeof teamData.advancements[0] : 'N/A');
    
    // Utiliser le converter
    console.log('🔄 Conversion avec teamConverter...');
    const dbTeamData = teamConverter.convertTeamContextToDB(
      teamData,
      teamData.teamTitle || 'Test Team',
      createdBy
    );
    
    console.log('✅ Conversion OK');
    console.log('SW advancement après conversion:', dbTeamData.heroes[0]?.sw?.advancement);
    
    // Sauvegarde
    const team = new Team(dbTeamData);
    
    // Valider avant sauvegarde
    console.log('🔍 Validation avant sauvegarde...');
    await team.validate();
    console.log('✅ Validation réussie');
    
    const savedTeam = await team.save();
    
    console.log('🎉 Équipe sauvegardée! ID:', savedTeam._id);
    console.log('SW advancement sauvegardé:', savedTeam.heroes[0]?.sw?.advancement);
    
    res.status(201).json({
      success: true,
      message: 'Team saved successfully',
      teamId: savedTeam._id,
      team: savedTeam.toAPIFormat()
    });
    
  } catch (error) {
    console.error('❌ ERREUR BACKEND SAUVEGARDE:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      console.error('🔍 Erreurs de validation détaillées:');
      Object.keys(error.errors || {}).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
        console.error(`    Valeur: ${JSON.stringify(error.errors[key].value)}`);
        console.error(`    Type: ${typeof error.errors[key].value}`);
      });
      
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error: ' + error.message
    });
  }
});

// Récupérer une équipe par ID
router.get('/:id', async (req, res) => {
  try {
    const teamId = req.params.id;
    console.log('=== 🔍 BACKEND REÇOIT GET TEAM ===', teamId);
    
    const team = await Team.findById(teamId);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    console.log('✅ Équipe trouvée:', team.name);
    console.log('SW advancement dans team:', team.heroes[0]?.sw?.advancement);
    
    res.json({
      success: true,
      team: team.toAPIFormat()
    });
    
  } catch (error) {
    console.error('❌ ERREUR GET TEAM:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route GET pour lister les équipes
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    res.json({
      success: true,
      count: teams.length,
      teams: teams.map(t => ({
        id: t._id,
        name: t.name,
        teamSize: t.teamSize,
        createdAt: t.createdAt,
        heroesCount: t.heroes?.length || 0,
        // 🔥 Ajouter SW info pour debug
        firstHeroSW: t.heroes?.[0]?.sw?.advancement
      }))
    });
  } catch (error) {
    console.error('Erreur GET /teams:', error);
    res.json({ 
      success: false, 
      error: error.message,
      teams: [] 
    });
  }
});

// Test GET pour vérifier la connexion
router.get('/test/connection', async (req, res) => {
  try {
    console.log('=== TEST CONNEXION ===');
    
    const count = await Team.countDocuments();
    const latestTeam = await Team.findOne().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      message: 'Backend fonctionnel',
      mongoDB: 'Connecté',
      teamsCount: count,
      latestTeam: latestTeam ? {
        name: latestTeam.name,
        id: latestTeam._id,
        createdAt: latestTeam.createdAt
      } : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test connexion échoué:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      mongoDB: 'Non connecté'
    });
  }
});

// Test SW simple
router.post('/test/sw-simple', async (req, res) => {
  try {
    console.log('=== TEST SW SIMPLE ===');
    
    const testTeam = {
      name: 'Test SW Simple',
      teamSize: 4,
      heroes: [{
        heroSlug: 'test-hero',
        slotPosition: 0,
        heroInfo: {
          name: 'Test Hero',
          class: 'Warrior',
          position: 'Front',
          thumbnail: '/assets/heroes/default.png',
          slug: 'test-hero'
        },
        uw: { stars: 0 },
        ut: { choice: 0, stars: 0 },
        sw: { advancement: 1 }, // 🔥 Test avec valeur 1 (purple)
        artifact: { 
          artifactSlug: null, 
          artifactInfo: null, 
          stars: 0 
        },
        gearSet: { 
          gearSetSlug: null, 
          gearSetInfo: null, 
          pieces: 0 
        },
        perks: { 
          t3: { s1: null, s2: null, s3: null, s4: null }, 
          t5: null 
        },
        transcendence: 0,
        notes: "",
        updatedAt: new Date()
      }],
      isPublic: false,
      createdBy: 'test',
      formatVersion: 3
    };
    
    console.log('Trying to save test team...');
    console.log('SW advancement value:', testTeam.heroes[0].sw.advancement);
    console.log('Type:', typeof testTeam.heroes[0].sw.advancement);
    
    const team = new Team(testTeam);
    
    await team.validate();
    console.log('✅ Validation réussie');
    
    const savedTeam = await team.save();
    
    console.log('✅ Test SW simple réussi! ID:', savedTeam._id);
    console.log('Saved SW advancement:', savedTeam.heroes[0].sw.advancement);
    
    res.json({
      success: true,
      message: 'Test SW simple réussi',
      teamId: savedTeam._id,
      swAdvancement: savedTeam.heroes[0].sw.advancement
    });
    
  } catch (error) {
    console.error('❌ Test SW simple échoué:', error.message);
    
    if (error.name === 'ValidationError') {
      console.error('🔍 Erreurs de validation:');
      Object.keys(error.errors || {}).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
        console.error(`    Valeur: ${JSON.stringify(error.errors[key].value)}`);
      });
    }
    
    res.status(400).json({
      success: false,
      error: error.message,
      validation: error.errors
    });
  }
});

// Exporter le router
module.exports = router;