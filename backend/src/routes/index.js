// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

// Import all route modules
const heroRoutes = require('./hero.routes');
const artifactRoutes = require('./artifact.routes');
const gearsetRoutes = require('./gearset.routes');
const perkRoutes = require('./perk.routes');
const teamRoutes = require('./team.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const supportRoutes = require('./support.routes');
const oauthRoutes = require('./oauth.routes');

// Mount all routes under API v2 prefix
router.use('/api/v2/heroes', heroRoutes);
router.use('/api/v2/artifacts', artifactRoutes);
router.use('/api/v2/gearsets', gearsetRoutes);
router.use('/api/v2/perks', perkRoutes);
router.use('/api/v2/teams', teamRoutes);
router.use('/api/v2/auth', authRoutes);
router.use('/api/v2/users', userRoutes);
router.use('/api/v2/support', supportRoutes);
router.use('/api/v2/oauth', oauthRoutes);

// Health and status route
router.get('/api/v2/health', (req, res) => {
  res.json({
    success: true,
    message: "King's Raid API v2 is running",
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    endpoints: {
      heroes: '/api/v2/heroes',
      artifacts: '/api/v2/artifacts',
      gearsets: '/api/v2/gearsets',
      perks: '/api/v2/perks',
      teams: '/api/v2/teams',
      auth: '/api/v2/auth',
      users: '/api/v2/users'
    }
  });
});

// Basic API documentation endpoint
router.get('/api/v2', (req, res) => {
  res.json({
    success: true,
    api: "King's Raid API",
    version: '2.0.0',
    description:
      "API for managing heroes, artifacts, gear sets, perks, users and saved teams.",
    documentation: {
      endpoints: [
        {
          path: '/api/v2/heroes',
          methods: ['GET'],
          description: 'Heroes management'
        },
        {
          path: '/api/v2/artifacts',
          methods: ['GET'],
          description: 'Artifacts management'
        },
        {
          path: '/api/v2/gearsets',
          methods: ['GET'],
          description: 'Gear sets management'
        },
        {
          path: '/api/v2/perks',
          methods: ['GET'],
          description: 'Perks management'
        },
        {
          path: '/api/v2/teams',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          description: 'Saved teams management'
        },
        {
          path: '/api/v2/auth',
          methods: ['POST'],
          description: 'Authentication'
        },
        {
          path: '/api/v2/users',
          methods: ['GET', 'PUT'],
          description: 'User profile management'
        }
      ]
    }
  });
});

// Redirect root to API documentation
router.get('/', (req, res) => {
  res.redirect('/api/v2');
});

module.exports = router;
