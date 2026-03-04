// backend/scripts/importHeroes.js - OPTIMIZED VERSION
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Hero = require('../src/models/Hero');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Shared function (same as other scripts)
function createSlug(name) {
  if (!name) return 'unknown';
  
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/'/g, '')
    .replace(/--+/g, '-')
    .trim();
}

async function importHeroes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kingsraid', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    await Hero.deleteMany({});
    
    const basePath = path.join(
      __dirname,
      '..',
      '..',
      'frontend',
      'public',
      'kingsraid-data'
    );
    
    const heroesDataPath = path.join(basePath, 'table-data', 'heroes');
    const releaseOrderPath = path.join(basePath, 'hero_release_order.json');
    
    if (!fs.existsSync(heroesDataPath)) {
      console.error(`Directory not found: ${heroesDataPath}`);
      process.exit(1);
    }
    
    let releaseOrder = {};
    if (fs.existsSync(releaseOrderPath)) {
      releaseOrder = JSON.parse(fs.readFileSync(releaseOrderPath, 'utf8'));
    }
    
    const files = fs.readdirSync(heroesDataPath).filter(f => f.endsWith('.json'));
    
    let importedCount = 0;
    let errorCount = 0;
    const warnings = [];
    const slugs = new Set();
    
    for (const fileName of files) {
      try {
        const filePath = path.join(heroesDataPath, fileName);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const heroData = JSON.parse(fileContent);
        
        const heroName = heroData.infos?.name || fileName.replace('.json', '');
        if (!heroName) {
          warnings.push({ file: fileName, warning: 'Missing name' });
          continue;
        }
        
        const baseSlug = createSlug(heroName);
        let slug = baseSlug;
        
        let counter = 1;
        while (slugs.has(slug)) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        slugs.add(slug);
        
        heroData.slug = slug;
        heroData.sourceFile = fileName;
        heroData.releaseOrder = releaseOrder[heroName] || 999;
        
        const hero = new Hero(heroData);
        await hero.save();
        
        importedCount++;
        
      } catch (error) {
        errorCount++;
        console.error(`Error with ${fileName}:`, error.message);
      }
    }
    
    const totalInDB = await Hero.countDocuments();
    console.log(`Import completed. ${totalInDB} heroes imported, ${errorCount} errors.`);
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  importHeroes();
}

module.exports = { importHeroes, createSlug };