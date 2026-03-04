const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Perk = require('../src/models/Perk');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Function to create a clean slug
function createSlug(name) {
  if (!name) return 'unknown';
  
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

// Available classes
const CLASSES = [
  'General', 'Knight', 'Warrior', 'Assassin',
  'Archer', 'Wizard', 'Priest', 'Mechanic'
];

async function importPerks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kingsraid', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    await Perk.deleteMany({
      tier: { $in: ['t1', 't2'] }
    });
    
    const basePath = path.join(
      __dirname,
      '..',
      '..',
      'frontend',
      'public',
      'kingsraid-data'
    );
    
    const classesPath = path.join(basePath, 'table-data', 'classes');
    
    if (!fs.existsSync(classesPath)) {
      console.error(`Directory not found: ${classesPath}`);
      process.exit(1);
    }
    
    let importedCount = 0;
    let errorCount = 0;
    const warnings = [];
    const slugs = new Set();
    
    for (const className of CLASSES) {
      const fileName = `${className}.json`;
      const filePath = path.join(classesPath, fileName);
      
      if (!fs.existsSync(filePath)) {
        warnings.push({ class: className, warning: 'File not found' });
        continue;
      }
      
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const classData = JSON.parse(fileContent);
        
        let classImported = 0;
        
        if (className === 'General' && classData.perks?.t1) {
          classImported += await importT1Perks(classData.perks.t1, slugs);
        }
        
        if (className !== 'General' && classData.perks?.t2) {
          classImported += await importT2Perks(className, classData.perks.t2, slugs);
        }
        
        importedCount += classImported;
        
      } catch (error) {
        errorCount++;
        console.error(`Error with ${className}:`, error.message);
      }
    }
    
    const totalInDB = await Perk.countDocuments({ tier: { $in: ['t1', 't2'] } });
    console.log(`Import completed. ${totalInDB} perks imported, ${errorCount} errors.`);
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Function to import T1 perks
async function importT1Perks(t1Perks, slugs) {
  const perks = [];
  
  for (const [name, description] of Object.entries(t1Perks)) {
    const baseSlug = createSlug(name);
    let slug = baseSlug;
    
    let counter = 1;
    while (slugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    slugs.add(slug);
    
    const thumbnail = `${name}.png`;
    const displayOrder = getT1DisplayOrder(name);
    
    const perk = new Perk({
      slug: slug,
      name: name,
      description: description,
      thumbnail: thumbnail,
      tier: 't1',
      class: 'General',
      displayOrder: displayOrder
    });
    
    perks.push(perk.save());
  }
  
  await Promise.all(perks);
  return perks.length;
}

// Function to import T2 perks
async function importT2Perks(className, t2Perks, slugs) {
  const perks = [];
  
  for (const [name, description] of Object.entries(t2Perks)) {
    const baseSlug = createSlug(`${className}-${name}`);
    let slug = baseSlug;
    
    let counter = 1;
    while (slugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    slugs.add(slug);
    
    const thumbnail = `${name}.png`;
    const displayOrder = getT2DisplayOrder(className, name);
    
    const perk = new Perk({
      slug: slug,
      name: name,
      description: description,
      thumbnail: thumbnail,
      tier: 't2',
      class: className,
      displayOrder: displayOrder
    });
    
    perks.push(perk.save());
  }
  
  await Promise.all(perks);
  return perks.length;
}

// Simple T1 order
function getT1DisplayOrder(name) {
  const orderMap = {
    'ATK Up': 1,
    'HP Up': 2,
    'DEF Up': 3,
    'Crit Resist Up': 4,
    'Monster Hunting': 5
  };
  return orderMap[name] || 0;
}

// Simple T2 order
function getT2DisplayOrder(className, name) {
  const orderMaps = {
    'Knight': {
      'Experienced Fighter': 1, 'Excellent Strategy': 2, 'Battle Cry': 3,
      'Shield of Protection': 4, 'Swift Move': 5
    },
    'Warrior': {
      'Opportune Strike': 1, 'Warlike': 2, 'Offensive Guard': 3,
      'Tactical Foresight': 4, 'Blood Wrath': 5
    }
  };
  
  return (orderMaps[className] && orderMaps[className][name]) || 0;
}

if (require.main === module) {
  importPerks();
}

module.exports = { importPerks, createSlug };