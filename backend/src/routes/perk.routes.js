// backend/src/routes/perk.routes.js
const express = require('express');
const router = express.Router();
const PerkService = require('../services/perkService');

const perkService = new PerkService();

// GET /api/perks - Toutes les perks (pour le frontend)
router.get('/', async (req, res) => {
  try {
    const perks = await perkService.getAllPerks();
    res.json(perks);
  } catch (error) {
    console.error('Error fetching all perks:', error);
    res.status(500).json({ error: 'Failed to fetch perks' });
  }
});

// GET /api/perks/tier/:tier - Perks par tier
router.get('/tier/:tier', async (req, res) => {
  try {
    const filters = {};
    if (req.query.class) filters.class = req.query.class;
    if (req.query.heroSlug) filters.heroSlug = req.query.heroSlug;
    
    const perks = await perkService.getPerksByTier(req.params.tier, filters);
    res.json(perks);
  } catch (error) {
    console.error(`Error fetching tier ${req.params.tier} perks:`, error);
    res.status(500).json({ error: 'Failed to fetch perks' });
  }
});

// GET /api/perks/hero/:heroSlug - Perks d'un héros (T3/T5)
router.get('/hero/:heroSlug', async (req, res) => {
  try {
    const perks = await perkService.getHeroPerks(req.params.heroSlug);
    res.json(perks);
  } catch (error) {
    console.error(`Error fetching perks for hero ${req.params.heroSlug}:`, error);
    res.status(500).json({ error: 'Failed to fetch hero perks' });
  }
});

// GET /api/perks/class/:className - Perks T1/T2 par classe
router.get('/class/:className', async (req, res) => {
  try {
    const perks = await perkService.getClassPerks(req.params.className);
    res.json(perks);
  } catch (error) {
    console.error(`Error fetching class perks for ${req.params.className}:`, error);
    res.status(500).json({ error: 'Failed to fetch class perks' });
  }
});

// GET /api/perks/search/:term - Recherche de perks
router.get('/search/:term', async (req, res) => {
  try {
    const perks = await perkService.searchPerks(req.params.term);
    res.json(perks);
  } catch (error) {
    console.error(`Error searching perks for ${req.params.term}:`, error);
    res.status(500).json({ error: 'Failed to search perks' });
  }
});

module.exports = router;