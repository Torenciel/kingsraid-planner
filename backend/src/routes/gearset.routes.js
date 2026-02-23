const express = require('express');
const router = express.Router();
const GearsetService = require('../services/gearsetService');

const gearsetService = new GearsetService();

// GET all gear sets
router.get('/', async (req, res) => {
  try {
    const gearsets = await gearsetService.getAllGearsets();
    
    const formattedGearsets = gearsets.map(gearset => ({
      id: gearset._id.toString(),
      slug: gearset.slug,
      name: gearset.name,
      thumbnail: gearset.thumbnail,
      bonus2P: gearset.bonus2P,
      bonus4P: gearset.bonus4P,
      sortOrder: gearset.sortOrder || 999
    }));
    
    res.json({
      success: true,
      count: formattedGearsets.length,
      gearsets: formattedGearsets
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch gearsets',
      message: error.message 
    });
  }
});

// GET gear set by slug
router.get('/:slug', async (req, res) => {
  try {
    const gearset = await gearsetService.getGearsetBySlug(req.params.slug);
    
    if (!gearset) {
      return res.status(404).json({ 
        success: false,
        error: 'Gearset not found',
        message: `No gearset found with slug: ${req.params.slug}`
      });
    }
    
    const formattedGearset = {
      id: gearset._id.toString(),
      slug: gearset.slug,
      name: gearset.name,
      thumbnail: gearset.thumbnail,
      bonus2P: gearset.bonus2P,
      bonus4P: gearset.bonus4P,
      sortOrder: gearset.sortOrder || 999
    };
    
    res.json({
      success: true,
      gearset: formattedGearset
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch gearset',
      details: error.message 
    });
  }
});

// Optional: search route
router.get('/search/:term', async (req, res) => {
  try {
    const gearsets = await gearsetService.searchGearsets(req.params.term);
    
    const formattedGearsets = gearsets.map(gearset => ({
      id: gearset._id.toString(),
      slug: gearset.slug,
      name: gearset.name,
      thumbnail: gearset.thumbnail,
      bonus2P: gearset.bonus2P.substring(0, 50) + '...',
      bonus4P: gearset.bonus4P.substring(0, 50) + '...',
      sortOrder: gearset.sortOrder || 999
    }));
    
    res.json({
      success: true,
      count: formattedGearsets.length,
      gearsets: formattedGearsets
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to search gearsets',
      details: error.message 
    });
  }
});

module.exports = router;
