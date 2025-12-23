// backend/src/routes/artifact.routes.js
const express = require('express');
const router = express.Router();
const ArtifactService = require('../services/artifactService');

const artifactService = new ArtifactService();

// GET tous les artefacts
router.get('/', async (req, res) => {
  try {
    const artifacts = await artifactService.getAllArtifacts();
    
    const formattedArtifacts = artifacts.map(artifact => ({
      id: artifact._id.toString(),    // ObjectId vers string
      slug: artifact.slug,            // Slug URL-friendly
      name: artifact.name,            // Nom d'affichage
      description: artifact.description,
      thumbnail: artifact.thumbnail,
      values: artifact.value,
      releaseOrder: artifact.releaseOrder || 999
    }));
    
    res.json({
      success: true,
      count: formattedArtifacts.length,
      artifacts: formattedArtifacts
    });
    
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch artifacts',
      message: error.message 
    });
  }
});

// GET un artefact par slug
router.get('/:slug', async (req, res) => {
  try {
    const artifact = await artifactService.getArtifactBySlug(req.params.slug);
    
    if (!artifact) {
      return res.status(404).json({ 
        success: false,
        error: 'Artifact not found',
        message: `No artifact found with slug: ${req.params.slug}`
      });
    }
    
    const formattedArtifact = {
      id: artifact._id.toString(),
      slug: artifact.slug,
      name: artifact.name,
      description: artifact.description,
      thumbnail: artifact.thumbnail,
      values: artifact.value,
      story: artifact.story || '',
      aliases: artifact.aliases || [],
      releaseOrder: artifact.releaseOrder || 999
    };
    
    res.json({
      success: true,
      artifact: formattedArtifact
    });
    
  } catch (error) {
    console.error(`Error fetching artifact ${req.params.slug}:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch artifact',
      details: error.message 
    });
  }
});

// GET recherche d'artefacts
router.get('/search/:term', async (req, res) => {
  try {
    const artifacts = await artifactService.searchArtifacts(req.params.term);
    
    const formattedArtifacts = artifacts.map(artifact => ({
      id: artifact._id.toString(),
      slug: artifact.slug,
      name: artifact.name,
      description: artifact.description.substring(0, 100) + '...',
      thumbnail: artifact.thumbnail,
      releaseOrder: artifact.releaseOrder || 999
    }));
    
    res.json({
      success: true,
      count: formattedArtifacts.length,
      artifacts: formattedArtifacts
    });
    
  } catch (error) {
    console.error(`Error searching artifacts for ${req.params.term}:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to search artifacts',
      details: error.message 
    });
  }
});

module.exports = router;