// backend/src/routes/artifact.routes.js
const express = require('express');
const router = express.Router();
const ArtifactService = require('../services/artifactService');

const artifactService = new ArtifactService();

router.get('/', async (req, res) => {
  try {
    const artifacts = await artifactService.getAllArtifacts();
    res.json(artifacts);
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    res.status(500).json({ error: 'Failed to fetch artifacts' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const artifact = await artifactService.getArtifactBySlug(req.params.slug);
    
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    
    res.json(artifact);
  } catch (error) {
    console.error(`Error fetching artifact ${req.params.slug}:`, error);
    res.status(500).json({ error: 'Failed to fetch artifact' });
  }
});

router.get('/search/:term', async (req, res) => {
  try {
    const artifacts = await artifactService.searchArtifacts(req.params.term);
    res.json(artifacts);
  } catch (error) {
    console.error(`Error searching artifacts for ${req.params.term}:`, error);
    res.status(500).json({ error: 'Failed to search artifacts' });
  }
});

module.exports = router;