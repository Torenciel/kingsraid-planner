const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middlewares/auth.middleware');

let Team, teamConverter;
try {
  Team = require('../../src/models/Team');
  teamConverter = require('../../src/utils/teamConverter');
} catch (error) {
  console.error('Modules not loaded:', error.message);
}

// Create team (authenticated)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { teamData } = req.body;

    if (!teamData) {
      return res.status(400).json({
        success: false,
        error: 'teamData is required'
      });
    }

    const dbTeamData = teamConverter.convertTeamContextToDB(
      teamData,
      teamData.teamTitle || 'My Team',
      req.user.displayName
    );

    dbTeamData.author = req.user.id;
    dbTeamData.createdBy = req.user.displayName;

    const team = new Team(dbTeamData);

    await team.validate();
    const savedTeam = await team.save();

    res.status(201).json({
      success: true,
      message: 'Team saved successfully',
      teamId: savedTeam._id,
      team: savedTeam.toAPIFormat()
    });

  } catch (error) {

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get team by ID
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    res.json({
      success: true,
      team: team.toAPIFormat()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List latest public teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find({ isPublic: true })
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
        heroesCount: t.heroes?.length || 0
      }))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test connection
router.get('/test/connection', async (req, res) => {
  try {
    const count = await Team.countDocuments();
    const latestTeam = await Team.findOne().sort({ createdAt: -1 });

    res.json({
      success: true,
      teamsCount: count,
      latestTeam: latestTeam
        ? {
            name: latestTeam.name,
            id: latestTeam._id,
            createdAt: latestTeam.createdAt
          }
        : null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test SW simple (authenticated because author required)
router.post('/test/sw-simple', requireAuth, async (req, res) => {
  try {
    const testTeam = {
      name: 'Test SW Simple',
      teamSize: 4,
      heroes: [{
        heroSlug: 'test-hero',
        slotPosition: 0,
        uw: { stars: 0 },
        ut: { choice: 0, stars: 0 },
        sw: { advancement: 1 },
        artifact: { artifactSlug: null, stars: 0 },
        gearSet: { gearSetSlug: null, pieces: 0, isMultiSet: false, sets: [] },
        perks: { t3: { s1: null, s2: null, s3: null, s4: null }, t5: null },
        updatedAt: new Date()
      }],
      isPublic: false,
      createdBy: req.user.displayName,
      author: req.user.id,
      formatVersion: 3
    };

    const team = new Team(testTeam);
    await team.validate();
    const savedTeam = await team.save();

    res.json({
      success: true,
      teamId: savedTeam._id,
      swAdvancement: savedTeam.heroes[0].sw.advancement
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      validation: error.errors
    });
  }
});

module.exports = router;
