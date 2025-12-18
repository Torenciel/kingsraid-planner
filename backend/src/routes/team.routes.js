const express = require('express');
const router = express.Router();

// Route temporaire
router.get('/public', (req, res) => {
  res.json({ 
    message: 'Public teams endpoint',
    teams: [],
    note: 'À implémenter avec MongoDB'
  });
});

router.post('/', (req, res) => {
  res.json({ 
    message: 'Team created (temporaire)',
    teamId: 'temp-' + Date.now(),
    data: req.body
  });
});

router.get('/:id', (req, res) => {
  res.json({ 
    message: 'Team details endpoint',
    teamId: req.params.id,
    note: 'À implémenter avec MongoDB'
  });
});

module.exports = router;