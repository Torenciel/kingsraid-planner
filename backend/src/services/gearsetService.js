// backend/src/services/gearsetService.js
const Gearset = require('../models/Gearset');

class GearsetService {
  async getAllGearsets() {
    return await Gearset.find().select('-__v').lean();
  }
  
  async getGearsetsByType(type) {
    return await Gearset.find({ type }).lean();
  }
  
  async getGearsetById(id) {
    return await Gearset.findById(id).lean();
  }
  
  async getGearsetBySlug(slug) {
    return await Gearset.findOne({ slug }).lean();
  }
}

module.exports = GearsetService;