// backend/src/routes/hero.routes.js
const express = require('express');
const router = express.Router();
const HeroService = require('../services/heroService');

const heroService = new HeroService();

// GET /api/v2/heroes - Tous les héros avec filtres optionnels
router.get('/', async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.class) filters.class = req.query.class;
    if (req.query.name) filters.name = req.query.name;
    
    const heroes = await heroService.getAllHeroes(filters);
    res.json(heroes);
  } catch (error) {
    console.error('Error fetching heroes:', error);
    res.status(500).json({ error: 'Failed to fetch heroes' });
  }
});

// GET /api/v2/heroes/classes - Classes disponibles
router.get('/classes', async (req, res) => {
  try {
    // Utiliser la méthode existante
    const heroes = await heroService.getAllHeroes();
    const classes = [...new Set(heroes.map(h => h.infos?.class).filter(c => c))];
    res.json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// GET /api/v2/heroes/positions - Positions disponibles
router.get('/positions', async (req, res) => {
  try {
    const heroes = await heroService.getAllHeroes();
    const positions = [...new Set(heroes.map(h => h.infos?.position).filter(p => p))];
    res.json({ positions });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// GET /api/v2/heroes/:slug - Un héros spécifique
router.get('/:slug', async (req, res) => {
  try {
    const hero = await heroService.getHeroBySlug(req.params.slug);
    
    if (!hero) {
      return res.status(404).json({ error: 'Hero not found' });
    }
    
    res.json(hero);
  } catch (error) {
    console.error(`Error fetching hero ${req.params.slug}:`, error);
    res.status(500).json({ error: 'Failed to fetch hero' });
  }
});

// GET /api/v2/heroes/class/:className - Héros par classe
router.get('/class/:className', async (req, res) => {
  try {
    const heroes = await heroService.getHeroesByClass(req.params.className);
    res.json(heroes);
  } catch (error) {
    console.error(`Error fetching heroes by class ${req.params.className}:`, error);
    res.status(500).json({ error: 'Failed to fetch heroes by class' });
  }
});

// GET /api/v2/heroes/search/:term - Recherche de héros
router.get('/search/:term', async (req, res) => {
  try {
    const heroes = await heroService.searchHeroes(req.params.term);
    res.json(heroes);
  } catch (error) {
    console.error(`Error searching heroes for ${req.params.term}:`, error);
    res.status(500).json({ error: 'Failed to search heroes' });
  }
});

module.exports = router;