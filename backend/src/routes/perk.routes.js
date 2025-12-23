// backend/src/routes/perk.routes.js
const express = require('express');
const router = express.Router();
const PerkService = require('../services/perkService');

const perkService = new PerkService();

// GET toutes les perks
router.get('/', async (req, res) => {
  try {
    const perks = await perkService.getAllPerks();
    
    const formattedPerks = perks.map(perk => ({
      id: perk._id.toString(),
      name: perk.name,
      tier: perk.tier,
      class: perk.class || 'General',
      thumbnail: perk.thumbnail,
      description: perk.description,
      displayOrder: perk.displayOrder || 999
    }));
    
    res.json({
      success: true,
      count: formattedPerks.length,
      perks: formattedPerks
    });
    
  } catch (error) {
    console.error('Error fetching perks:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch perks',
      message: error.message 
    });
  }
});

// GET perks par tier
router.get('/tier/:tier', async (req, res) => {
  try {
    const filters = {};
    
    // Filtres optionnels
    if (req.query.class) filters.class = req.query.class;
    if (req.query.heroSlug) filters.heroSlug = req.query.heroSlug;
    
    const perks = await perkService.getPerksByTier(req.params.tier, filters);
    
    const formattedPerks = perks.map(perk => ({
      id: perk._id.toString(),
      name: perk.name,
      tier: perk.tier,
      class: perk.class || 'General',
      heroSlug: perk.heroSlug || null,
      thumbnail: perk.thumbnail,
      description: perk.description,
      displayOrder: perk.displayOrder || 999
    }));
    
    res.json({
      success: true,
      count: formattedPerks.length,
      tier: req.params.tier,
      perks: formattedPerks
    });
    
  } catch (error) {
    console.error(`Error fetching tier ${req.params.tier} perks:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch perks',
      details: error.message 
    });
  }
});

// GET perks d'un héros (T3/T5)
router.get('/hero/:heroSlug', async (req, res) => {
  try {
    const perks = await perkService.getHeroPerks(req.params.heroSlug);
    
    const formattedPerks = perks.map(perk => ({
      id: perk._id.toString(),
      name: perk.name,
      tier: perk.tier,
      class: perk.class || 'General',
      heroSlug: perk.heroSlug,
      thumbnail: perk.thumbnail,
      description: perk.description,
      displayOrder: perk.displayOrder || 999
    }));
    
    res.json({
      success: true,
      heroSlug: req.params.heroSlug,
      count: formattedPerks.length,
      perks: formattedPerks
    });
    
  } catch (error) {
    console.error(`Error fetching perks for hero ${req.params.heroSlug}:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch hero perks',
      details: error.message 
    });
  }
});

// GET perks T1/T2 par classe
router.get('/class/:className', async (req, res) => {
  try {
    const perks = await perkService.getClassPerks(req.params.className);
    
    const formattedPerks = perks.map(perk => ({
      id: perk._id.toString(),
      name: perk.name,
      tier: perk.tier,
      class: perk.class || 'General',
      thumbnail: perk.thumbnail,
      description: perk.description,
      displayOrder: perk.displayOrder || 999
    }));
    
    res.json({
      success: true,
      className: req.params.className,
      count: formattedPerks.length,
      perks: formattedPerks
    });
    
  } catch (error) {
    console.error(`Error fetching class perks for ${req.params.className}:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch class perks',
      details: error.message 
    });
  }
});

// GET recherche de perks
router.get('/search/:term', async (req, res) => {
  try {
    const perks = await perkService.searchPerks(req.params.term);
    
    const formattedPerks = perks.map(perk => ({
      id: perk._id.toString(),
      name: perk.name,
      tier: perk.tier,
      class: perk.class || 'General',
      heroSlug: perk.heroSlug || null,
      thumbnail: perk.thumbnail,
      description: perk.description,
      displayOrder: perk.displayOrder || 999
    }));
    
    res.json({
      success: true,
      count: formattedPerks.length,
      searchTerm: req.params.term,
      perks: formattedPerks
    });
    
  } catch (error) {
    console.error(`Error searching perks for ${req.params.term}:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to search perks',
      details: error.message 
    });
  }
});

module.exports = router;