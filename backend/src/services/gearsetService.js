// backend/src/services/gearsetService.js
const GearSet = require('../models/GearSet'); // Vérifiez le nom exact

class GearsetService {
  async getAllGearsets() {
    return await GearSet.find()
      .select('_id slug name thumbnail bonus2P bonus4P sortOrder')
      .sort('sortOrder')
      .lean();
  }
  
  async getGearsetById(id) {
    return await GearSet.findById(id)
      .select('_id slug name thumbnail bonus2P bonus4P sortOrder')
      .lean();
  }
  
  async getGearsetBySlug(slug) {
    return await GearSet.findOne({ slug: slug })
      .select('_id slug name thumbnail bonus2P bonus4P sortOrder')
      .lean();
  }
  
  // Méthode optionnelle pour recherche
  async searchGearsets(searchTerm) {
    return await GearSet.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { slug: { $regex: searchTerm.replace(/\s+/g, '-'), $options: 'i' } },
        { bonus2P: { $regex: searchTerm, $options: 'i' } },
        { bonus4P: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('_id slug name thumbnail bonus2P bonus4P sortOrder')
    .sort('sortOrder')
    .limit(20)
    .lean();
  }
}

module.exports = GearsetService;