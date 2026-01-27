// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

// Importer toutes les routes
const heroRoutes = require('./hero.routes');
const artifactRoutes = require('./artifact.routes');
const gearsetRoutes = require('./gearset.routes');
const perkRoutes = require('./perk.routes');
const teamRoutes = require('./team.routes');
const authRoutes = require('./auth.routes');

// Monter toutes les routes avec un préfixe API
router.use('/api/v2/heroes', heroRoutes);
router.use('/api/v2/artifacts', artifactRoutes);
router.use('/api/v2/gearsets', gearsetRoutes);
router.use('/api/v2/perks', perkRoutes);
router.use('/api/v2/teams', teamRoutes);
router.use("/api/v2/auth", authRoutes);

// Routes de santé et informations
router.get('/api/v2/health', (req, res) => {
  res.json({
    success: true,
    message: 'King\'s Raid API v2 is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    endpoints: {
      heroes: '/api/v2/heroes',
      artifacts: '/api/v2/artifacts',
      gearsets: '/api/v2/gearsets',
      perks: '/api/v2/perks',
      teams: '/api/v2/teams',
      auth: '/api/v2/auth'
    }
  });
});

// Documentation API basique
router.get('/api/v2', (req, res) => {
  res.json({
    success: true,
    api: 'King\'s Raid API',
    version: '2.0.0',
    description: 'API pour la gestion des héros, artefacts, équipements et équipes de King\'s Raid',
    documentation: {
      endpoints: [
        {
          path: '/api/v2/heroes',
          methods: ['GET'],
          description: 'Gestion des héros'
        },
        {
          path: '/api/v2/artifacts',
          methods: ['GET'],
          description: 'Gestion des artefacts'
        },
        {
          path: '/api/v2/gearsets',
          methods: ['GET'],
          description: 'Gestion des sets d\'équipement'
        },
        {
          path: '/api/v2/perks',
          methods: ['GET'],
          description: 'Gestion des perks'
        },
        {
          path: '/api/v2/teams',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          description: 'Gestion des équipes sauvegardées'
        }
      ]
    }
  });
});

// Redirection de la racine vers l'API
router.get('/', (req, res) => {
  res.redirect('/api/v2');
});

module.exports = router;