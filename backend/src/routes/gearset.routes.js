// backend/src/routes/gearset.routes.js
const express = require('express');
const router = express.Router();
const GearsetService = require('../services/gearsetService');

const gearsetService = new GearsetService();

// GET /api/gearsets - Tous les gear sets
router.get('/', async (req, res) => {
  try {
    const gearsets = await gearsetService.getAllGearsets();
    res.json(gearsets);
  } catch (error) {
    console.error('Error fetching gearsets:', error);
    res.status(500).json({ error: 'Failed to fetch gearsets' });
  }
});

// GET /api/gearsets/type/:type - Gear sets par type
router.get('/type/:type', async (req, res) => {
  try {
    const gearsets = await gearsetService.getGearsetsByType(req.params.type);
    res.json(gearsets);
  } catch (error) {
    console.error(`Error fetching gearsets for type ${req.params.type}:`, error);
    res.status(500).json({ error: 'Failed to fetch gearsets by type' });
  }
});

// GET /api/gearsets/:id - Un gear set spécifique
router.get('/:id', async (req, res) => {
  try {
    // Si vous avez un champ slug ou ID unique
    const gearset = await Gearset.findById(req.params.id).lean();
    
    if (!gearset) {
      return res.status(404).json({ error: 'Gearset not found' });
    }
    
    res.json(gearset);
  } catch (error) {
    console.error(`Error fetching gearset ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch gearset' });
  }
});

module.exports = router;