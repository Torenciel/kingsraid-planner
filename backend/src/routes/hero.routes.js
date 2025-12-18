const express = require('express');
const router = express.Router();

// Route temporaire pour que le serveur démarre
router.get('/', (req, res) => {
  res.json({ 
    message: 'Hero routes - À implémenter',
    endpoints: {
      getAll: 'GET /',
      getHero: 'GET /:id',
      getClasses: 'GET /classes',
      getPositions: 'GET /positions'
    }
  });
});

router.get('/classes', (req, res) => {
  res.json({ classes: ['Warrior', 'Knight', 'Assassin', 'Archer', 'Wizard', 'Priest', 'Mechanic'] });
});

router.get('/positions', (req, res) => {
  res.json({ positions: ['Front', 'Middle', 'Back'] });
});

router.get('/:id', (req, res) => {
  res.json({ 
    message: 'Hero details endpoint',
    heroId: req.params.id,
    note: 'À implémenter avec MongoDB'
  });
});

module.exports = router;