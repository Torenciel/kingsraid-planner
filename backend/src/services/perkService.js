// backend/src/services/perkService.js
const Perk = require('../models/Perk');

class PerkService {
  // NOUVELLE MÉTHODE: Récupérer toutes les perks
  async getAllPerks() {
    return await Perk.find({}).sort({ tier: 1, displayOrder: 1 }).lean();
  }
  
  // Récupérer toutes les perks d'un tier
  async getPerksByTier(tier, filters = {}) {
    const query = { tier };
    
    if (filters.class) query.class = filters.class;
    if (filters.heroSlug) query.heroSlug = filters.heroSlug;
    
    return await Perk.find(query).sort({ displayOrder: 1 }).lean();
  }
  
  // Récupérer les perks d'un héros spécifique
  async getHeroPerks(heroSlug) {
    return await Perk.find({ 
      heroSlug,
      tier: { $in: ['t3', 't5'] }
    }).sort({ tier: 1, displayOrder: 1 }).lean();
  }
  
  // Récupérer les perks T1/T2 par classe
  async getClassPerks(className) {
    return await Perk.find({
      tier: { $in: ['t1', 't2'] },
      $or: [
        { class: 'General' },
        { class: className }
      ]
    }).sort({ tier: 1, displayOrder: 1 }).lean();
  }
  
  // Rechercher des perks
  async searchPerks(searchTerm) {
    return await Perk.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } }
      ]
    }).lean();
  }
}

module.exports = PerkService;