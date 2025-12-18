const express = require('express');
const router = express.Router();
const Perk = require('../models/Perk');

// Récupérer toutes les perks d'un certain tier
router.get('/tier/:tier', async (req, res) => {
  try {
    const { tier } = req.params;
    const { class: heroClass, heroSlug } = req.query;
    
    const query = { tier };
    
    if (heroClass && heroClass !== 'General') {
      query.class = heroClass;
    }
    
    if (heroSlug && (tier === 't3' || tier === 't5')) {
      query.heroSlug = heroSlug;
    }
    
    const perks = await Perk.find(query).sort({ displayOrder: 1 });
    
    res.json({
      success: true,
      perks: perks,
      count: perks.length
    });
  } catch (error) {
    console.error('Error getting perks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Récupérer les perks T1 (générales)
router.get('/t1', async (req, res) => {
  try {
    const perks = await Perk.find({ tier: 't1' }).sort({ displayOrder: 1 });
    res.json({ success: true, perks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Récupérer les perks T2 par classe
router.get('/t2/:class', async (req, res) => {
  try {
    const { class: heroClass } = req.params;
    const perks = await Perk.find({ 
      tier: 't2', 
      class: heroClass 
    }).sort({ displayOrder: 1 });
    
    res.json({ success: true, perks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Récupérer les perks T3/T5 d'un héros
router.get('/hero/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { tier } = req.query; // 't3', 't5', ou les deux
    
    const query = { heroSlug: slug };
    if (tier) {
      query.tier = tier;
    }
    
    const perks = await Perk.find(query).sort({ 
      tier: 1, 
      skillIndex: 1,
      type: 1 
    });
    
    // Grouper par tier et skill pour le frontend
    const grouped = {
      t3: {
        1: { light: null, dark: null },
        2: { light: null, dark: null },
        3: { light: null, dark: null },
        4: { light: null, dark: null }
      },
      t5: { light: null, dark: null }
    };
    
    perks.forEach(perk => {
      if (perk.tier === 't3' && perk.skillIndex) {
        grouped.t3[perk.skillIndex][perk.type] = perk;
      } else if (perk.tier === 't5') {
        grouped.t5[perk.type] = perk;
      }
    });
    
    res.json({
      success: true,
      perks: perks,
      grouped: grouped,
      count: perks.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Recherche de perks
router.get('/search', async (req, res) => {
  try {
    const { q, tier, class: heroClass } = req.query;
    
    const query = {};
    
    if (q) {
      query.$text = { $search: q };
    }
    
    if (tier) {
      query.tier = tier;
    }
    
    if (heroClass) {
      query.class = heroClass;
    }
    
    const perks = await Perk.find(query)
      .limit(20)
      .sort({ tier: 1, class: 1, displayOrder: 1 });
    
    res.json({ success: true, perks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;