// backend/src/services/artifactService.js
const Artifact = require('../models/Artifact');

class ArtifactService {
  async getAllArtifacts() {
    return await Artifact.find().select('-__v').lean();
  }
  
  async getArtifactBySlug(slug) {
    return await Artifact.findOne({ slug }).lean();
  }
  
  async searchArtifacts(searchTerm) {
    return await Artifact.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    }).lean();
  }
}

// backend/src/services/gearsetService.js
const Gearset = require('../models/Gearset');

class GearsetService {
  async getAllGearsets() {
    return await Gearset.find().select('-__v').lean();
  }
  
  async getGearsetsByType(type) {
    return await Gearset.find({ type }).lean();
  }
}

module.exports = ArtifactService;