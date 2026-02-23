const express = require('express');
const router = express.Router();
const HeroService = require('../services/heroService');

const heroService = new HeroService();

// GET all heroes
router.get('/', async (req, res) => {
  try {
    const filters = {};
    
    // Optional filters
    if (req.query.class) filters.class = req.query.class;
    if (req.query.name) filters.name = req.query.name;
    if (req.query.position) filters.position = req.query.position;
    
    const heroes = await heroService.getAllHeroes(filters);
    
    const formattedHeroes = heroes.map(hero => ({
      id: hero._id.toString(),
      slug: hero.slug,
      name: hero.infos?.name || '',
      title: hero.infos?.title || '',
      class: hero.infos?.class || 'Unknown',
      position: hero.infos?.position || 'Unknown',
      thumbnail: hero.infos?.thumbnail || '',
      releaseOrder: hero.releaseOrder || 999
    }));
    
    res.json({
      success: true,
      count: formattedHeroes.length,
      heroes: formattedHeroes
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch heroes',
      message: error.message 
    });
  }
});

// GET available classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await heroService.getHeroClasses();
    
    res.json({
      success: true,
      count: classes.length,
      classes: classes
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch hero classes',
      message: error.message 
    });
  }
});

// GET available positions
router.get('/positions', async (req, res) => {
  try {
    const positions = await heroService.getHeroPositions();
    
    res.json({
      success: true,
      count: positions.length,
      positions: positions
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch hero positions',
      message: error.message 
    });
  }
});

// GET hero by slug
router.get('/:slug', async (req, res) => {
  try {
    const hero = await heroService.getHeroBySlug(req.params.slug);
    
    if (!hero) {
      return res.status(404).json({ 
        success: false,
        error: 'Hero not found',
        message: `No hero found with slug: ${req.params.slug}`
      });
    }
    
    const formattedHero = {
      id: hero._id.toString(),
      slug: hero.slug,
      infos: hero.infos || {},
      skills: hero.skills,
      books: hero.books,
      perks: hero.perks,
      uw: hero.uw,
      uts: hero.uts,
      sw: hero.sw,
      splashart: hero.splashart,
      costumes: hero.costumes,
      visual: hero.visual,
      aliases: hero.aliases || [],
      releaseOrder: hero.releaseOrder || 999,
      hasImage: hero.hasImage || true
    };
    
    res.json({
      success: true,
      hero: formattedHero
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch hero',
      details: error.message 
    });
  }
});

// GET heroes by class
router.get('/class/:className', async (req, res) => {
  try {
    const heroes = await heroService.getHeroesByClass(req.params.className);
    
    const formattedHeroes = heroes.map(hero => ({
      id: hero._id.toString(),
      slug: hero.slug,
      name: hero.infos?.name || '',
      class: hero.infos?.class || 'Unknown',
      position: hero.infos?.position || 'Unknown',
      thumbnail: hero.infos?.thumbnail || '',
      releaseOrder: hero.releaseOrder || 999
    }));
    
    res.json({
      success: true,
      count: formattedHeroes.length,
      class: req.params.className,
      heroes: formattedHeroes
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch heroes by class',
      details: error.message 
    });
  }
});

// GET hero search
router.get('/search/:term', async (req, res) => {
  try {
    const heroes = await heroService.searchHeroes(req.params.term);
    
    const formattedHeroes = heroes.map(hero => ({
      id: hero._id.toString(),
      slug: hero.slug,
      name: hero.infos?.name || '',
      class: hero.infos?.class || 'Unknown',
      position: hero.infos?.position || 'Unknown',
      thumbnail: hero.infos?.thumbnail || '',
      title: hero.infos?.title || '',
      releaseOrder: hero.releaseOrder || 999
    }));
    
    res.json({
      success: true,
      count: formattedHeroes.length,
      heroes: formattedHeroes
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to search heroes',
      details: error.message 
    });
  }
});

module.exports = router;
