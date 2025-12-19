// backend/src/services/heroService.js
const Hero = require('../models/Hero');

class HeroService {
  // Récupérer tous les héros
  async getAllHeroes(filters = {}) {
    const query = {};
    
    if (filters.class) query['infos.class'] = filters.class;
    if (filters.name) query['infos.name'] = { $regex: filters.name, $options: 'i' };
    
    return await Hero.find(query).select('-__v').lean();
  }
  
  // Récupérer un héros par slug
  async getHeroBySlug(slug) {
    return await Hero.findOne({ slug }).select('-__v').lean();
  }
  
  // Récupérer les héros par classe
  async getHeroesByClass(className) {
    return await Hero.find({ 'infos.class': className }).select('slug infos.name infos.class').lean();
  }
  
  // Rechercher des héros
  async searchHeroes(searchTerm) {
    return await Hero.find({
      $or: [
        { 'infos.name': { $regex: searchTerm, $options: 'i' } },
        { slug: { $regex: searchTerm, $options: 'i' } }
      ]
    }).select('slug infos.name infos.class').lean();
  }
}

module.exports = HeroService;