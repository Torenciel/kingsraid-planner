// backend/scripts/importGearSets.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load .env
require('dotenv').config({ 
  path: path.join(__dirname, '..', '.env') 
});

// Function to create a clean slug
function createSlug(name) {
  if (!name) return 'unknown';
  
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

// Function to clean image path
function cleanThumbnailPath(imagePath) {
  if (!imagePath) return 'gearsets/default.png';
  
  const filename = imagePath.split('/').pop();
  
  let cleanFilename = filename;
  if (!cleanFilename.endsWith('.png')) {
    cleanFilename = cleanFilename.split('.')[0] + '.png';
  }
  
  return `gearsets/${cleanFilename}`;
}

async function importGearSets() {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Force new model without cache
    if (mongoose.models.GearSet) {
      delete mongoose.models.GearSet;
    }
    
    // Define schema (same as GearSet.js)
    const GearSetSchema = new mongoose.Schema({
      slug: { 
        type: String, 
        required: true,
        unique: true,
        index: true 
      },
      name: { 
        type: String, 
        required: true,
        index: true 
      },
      thumbnail: { 
        type: String, 
        required: true 
      },
      bonus2P: { 
        type: String, 
        required: true 
      },
      bonus4P: { 
        type: String, 
        required: true 
      },
      sortOrder: { 
        type: Number, 
        default: 999 
      },
      createdAt: { 
        type: Date, 
        default: Date.now 
      },
      updatedAt: { 
        type: Date, 
        default: Date.now 
      }
    });
    
    // Text search index
    GearSetSchema.index({ name: 'text' });
    
    const GearSet = mongoose.model('GearSet', GearSetSchema);
    
    const basePath = path.join(
      __dirname,
      '..',
      '..',
      'frontend',
      'public',
      'kingsraid-data'
    );
    
    const gearSetsPath = path.join(basePath, 'table-data', 'gearsets.json');
    
    if (!fs.existsSync(gearSetsPath)) {
      console.error(`File not found: ${gearSetsPath}`);
      process.exit(1);
    }
    
    const gearSetsData = JSON.parse(fs.readFileSync(gearSetsPath, 'utf8'));
    
    const sortOrderMap = {
      'beast-of-chaos': 1,
      'dark-legion': 2,
      'lava-gear': 3,
      'black-dragon': 4,
      'fire-dragon': 5,
      'frost-dragon': 6,
      'poison-dragon': 7,
      'hero-suppression-gear': 8,
      'hero-protection-gear': 9
    };
    
    let importedCount = 0;
    const slugs = new Set();
    
    for (const gearSetData of gearSetsData) {
      const slug = createSlug(gearSetData.name);
      const thumbnail = cleanThumbnailPath(gearSetData.image);
      const sortOrder = sortOrderMap[slug] || 999;
      
      const gearSet = new GearSet({
        slug: slug,
        name: gearSetData.name,
        thumbnail: thumbnail,
        bonus2P: gearSetData.bonus2P,
        bonus4P: gearSetData.bonus4P,
        sortOrder: sortOrder
      });
      
      await gearSet.save();
      importedCount++;
    }
    
    const totalInDB = await GearSet.countDocuments();
    console.log(`Import completed. ${totalInDB} gear sets imported.`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 11000) {
      console.error('Duplicate key error. Try running: node backend/scripts/clearGearSets.js');
    }
    process.exit(1);
  }
}

if (require.main === module) {
  importGearSets();
}

module.exports = { importGearSets };