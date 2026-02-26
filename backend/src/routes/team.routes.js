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
console.log("dbTeamData.isPublic AFTER CONVERT:", dbTeamData.isPublic);

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

// Get team by id or slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    let team;

    // If it looks like Mongo ObjectId → search by id
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      team = await Team.findById(identifier);
    } else {
      // Otherwise treat as slug
      team = await Team.findOne({ slug: identifier });
    }

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Increment views only when accessed publicly
    team.views += 1;
    await team.save();

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
    slug: t.slug,
    teamSize: t.teamSize,
    heroes: t.heroes || [],
    tags: t.tags || [],
    upvotes: t.upvotes || 0,
    bookmarks: t.bookmarks || 0,
    createdBy: t.createdBy,
    createdAt: t.createdAt
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

module.exports = router;
