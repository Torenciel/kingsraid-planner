// backend/src/services/perkService.js
const Perk = require('../models/Perk');

class PerkService {
  async getAllPerks() {
    return await Perk.find({})
      .select('_id name tier class heroSlug thumbnail description displayOrder')
      .sort({ tier: 1, displayOrder: 1 })
      .lean();
  }
  
  async getPerksByTier(tier, filters = {}) {
    const query = { tier };
    
    if (filters.class) query.class = filters.class;
    if (filters.heroSlug) query.heroSlug = filters.heroSlug;
    
    return await Perk.find(query)
      .select('_id name tier class heroSlug thumbnail description displayOrder')
      .sort({ displayOrder: 1 })
      .lean();
  }
  
  async getHeroPerks(heroSlug) {
    return await Perk.find({ 
      heroSlug,
      tier: { $in: ['t3', 't5'] }
    })
    .select('_id name tier class heroSlug thumbnail description displayOrder')
    .sort({ tier: 1, displayOrder: 1 })
    .lean();
  }
  
  async getClassPerks(className) {
    return await Perk.find({
      tier: { $in: ['t1', 't2'] },
      $or: [
        { class: 'General' },
        { class: className }
      ]
    })
    .select('_id name tier class thumbnail description displayOrder')
    .sort({ tier: 1, displayOrder: 1 })
    .lean();
  }
  
  async searchPerks(searchTerm) {
    return await Perk.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('_id name tier class heroSlug thumbnail description displayOrder')
    .limit(20)
    .lean();
  }
}

module.exports = PerkService;