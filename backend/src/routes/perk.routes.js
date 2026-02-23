const express = require('express');
const router = express.Router();
const PerkService = require('../services/perkService');

const perkService = new PerkService();

// GET all perks
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
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch perks',
      message: error.message 
    });
  }
});

// GET perks by tier
router.get('/tier/:tier', async (req, res) => {
  try {
    const filters = {};
    
    // Optional filters
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
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch perks',
      details: error.message 
    });
  }
});

// GET hero perks (T3/T5)
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
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch hero perks',
      details: error.message 
    });
  }
});

// GET T1/T2 perks by class
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
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch class perks',
      details: error.message 
    });
  }
});

// GET perk search
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
    res.status(500).json({ 
      success: false,
      error: 'Failed to search perks',
      details: error.message 
    });
  }
});

module.exports = router;
