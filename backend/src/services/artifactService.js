// backend/src/services/artifactService.js
const Artifact = require('../models/Artifact');

class ArtifactService {
  async getAllArtifacts() {
    return await Artifact.find()
      .select('_id slug name description thumbnail value releaseOrder')
      .sort('releaseOrder')
      .lean();
  }
  
  async getArtifactBySlug(slug) {
    return await Artifact.findOne({ slug })
      .select('_id slug name description thumbnail value story aliases releaseOrder')
      .lean();
  }
  
  async searchArtifacts(searchTerm) {
    return await Artifact.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { slug: { $regex: searchTerm.replace(/\s+/g, '-'), $options: 'i' } }
      ]
    })
    .select('_id slug name description thumbnail releaseOrder')
    .limit(20)
    .sort('releaseOrder')
    .lean();
  }
}

module.exports = ArtifactService;