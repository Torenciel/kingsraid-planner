// backend/src/services/heroService.js
const Hero = require('../models/Hero');

class HeroService {
  async getAllHeroes(filters = {}) {
    const query = {};
    
    // Appliquer les filtres
    if (filters.class) query['infos.class'] = filters.class;
    if (filters.name) query['infos.name'] = { $regex: filters.name, $options: 'i' };
    if (filters.position) query['infos.position'] = filters.position;
    
    return await Hero.find(query)
      .select('_id slug infos releaseOrder')
      .sort('releaseOrder')
      .lean();
  }
  
  async getHeroBySlug(slug) {
    const hero = await Hero.findOne({ slug })
      .select('-__v')
      .lean();
    
    if (!hero) return null;
    
    // Convertir les Maps en objets pour la réponse JSON
    return this.formatHeroData(hero);
  }
  
  async getHeroesByClass(className) {
    return await Hero.find({ 'infos.class': className })
      .select('_id slug infos.name infos.class infos.position infos.thumbnail releaseOrder')
      .sort('releaseOrder')
      .lean();
  }
  
  async searchHeroes(searchTerm) {
    return await Hero.find({
      $or: [
        { 'infos.name': { $regex: searchTerm, $options: 'i' } },
        { slug: { $regex: searchTerm.replace(/\s+/g, '-'), $options: 'i' } },
        { 'infos.title': { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('_id slug infos.name infos.class infos.position infos.thumbnail infos.title releaseOrder')
    .limit(20)
    .sort('releaseOrder')
    .lean();
  }
  
  async getHeroClasses() {
    const classes = await Hero.aggregate([
      {
        $group: {
          _id: '$infos.class',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { name: 1 } }
    ]);
    
    // Gérer les valeurs null/undefined
    return classes.map(c => ({
      name: c.name || 'Unknown',
      count: c.count
    }));
  }
  
  async getHeroPositions() {
    const positions = await Hero.aggregate([
      {
        $group: {
          _id: '$infos.position',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { name: 1 } }
    ]);
    
    // Gérer les valeurs null/undefined
    return positions.map(p => ({
      name: p.name || 'Unknown',
      count: p.count
    }));
  }
  
  // Méthode pour formater les données du héros
  formatHeroData(hero) {
    if (!hero) return null;
    
    const formatted = { ...hero };
    
    // Convertir les Maps en objets
    if (hero.skills instanceof Map || (hero.skills && typeof hero.skills === 'object' && hero.skills.constructor.name === 'Map')) {
      formatted.skills = Object.fromEntries(hero.skills);
    }
    
    if (hero.books instanceof Map || (hero.books && typeof hero.books === 'object' && hero.books.constructor.name === 'Map')) {
      formatted.books = Object.fromEntries(hero.books);
    }
    
    if (hero.perks && hero.perks.t3 instanceof Map) {
      formatted.perks = {
        ...hero.perks,
        t3: Object.fromEntries(hero.perks.t3)
      };
    }
    
    if (hero.uts instanceof Map || (hero.uts && typeof hero.uts === 'object' && hero.uts.constructor.name === 'Map')) {
      formatted.uts = Object.fromEntries(hero.uts);
    }
    
    // Convertir UW value Map si nécessaire
    if (hero.uw && hero.uw.value instanceof Map) {
      formatted.uw = {
        ...hero.uw,
        value: Object.fromEntries(hero.uw.value)
      };
    }
    
    return formatted;
  }
}

module.exports = HeroService;