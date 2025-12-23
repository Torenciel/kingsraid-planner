// backend/scripts/importGearSets.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Charger le .env
require('dotenv').config({ 
  path: path.join(__dirname, '..', '.env') 
});

// Fonction pour créer un slug propre
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

// Fonction pour nettoyer le chemin de l'image
function cleanThumbnailPath(imagePath) {
  if (!imagePath) return 'gearsets/default.png';
  
  // Extraire juste le nom de fichier
  const filename = imagePath.split('/').pop();
  
  // S'assurer que c'est un .png
  let cleanFilename = filename;
  if (!cleanFilename.endsWith('.png')) {
    cleanFilename = cleanFilename.split('.')[0] + '.png';
  }
  
  return `gearsets/${cleanFilename}`;
}

async function importGearSets() {
  try {
    console.log('='.repeat(60));
    console.log('🚀 IMPORTATION GEAR SETS - VERSION FINALE');
    console.log('='.repeat(60));
    
    // Connexion MongoDB
    console.log('🔗 Connexion à MongoDB...');
    const mongoURI = process.env.MONGODB_URI;
    console.log(`URI: ${mongoURI}`);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connecté');
    
    // 🔥 FORCER UN NOUVEAU MODÈLE SANS CACHE
    if (mongoose.models.GearSet) {
      delete mongoose.models.GearSet;
    }
    
    // Définir le modèle (identique à votre GearSet.js)
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
    
    // Index pour recherche textuelle
    GearSetSchema.index({ name: 'text' });
    
    const GearSet = mongoose.model('GearSet', GearSetSchema);
    
    // Chemin du fichier JSON
    const basePath = path.join(
      __dirname,
      '..',
      '..',
      'frontend',
      'public',
      'kingsraid-data'
    );
    
    const gearSetsPath = path.join(basePath, 'table-data', 'gearsets.json');
    
    console.log(`\n📂 Lecture depuis: ${gearSetsPath}`);
    
    if (!fs.existsSync(gearSetsPath)) {
      console.error(`❌ Fichier non trouvé: ${gearSetsPath}`);
      process.exit(1);
    }
    
    // Lire les données
    const gearSetsData = JSON.parse(fs.readFileSync(gearSetsPath, 'utf8'));
    
    console.log(`\n📄 ${gearSetsData.length} gear sets à importer`);
    
    // Ordre de tri
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
    
    // Importer chaque gear set
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
      
      console.log(`✅ ${importedCount}. ${gearSetData.name}`);
      console.log(`   Slug: ${slug}`);
    }
    
    // Vérification finale
    const totalInDB = await GearSet.countDocuments();
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ IMPORTATION');
    console.log('='.repeat(60));
    console.log(`✅ ${totalInDB} gear sets importés avec succès`);
    
    // Afficher tous les gear sets
    console.log('\n🔍 Liste complète:');
    const allGearSets = await GearSet.find().sort('sortOrder').select('slug name');
    allGearSets.forEach(gs => {
      console.log(`   • ${gs.name} (${gs.slug})`);
    });
    
    await mongoose.disconnect();
    console.log('\n🎉 IMPORTATION TERMINÉE !');
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    if (error.code === 11000) {
      console.error('💡 Erreur de doublon - Essayez d\'abord:');
      console.error('   node backend/scripts/clearGearSets.js');
    }
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  importGearSets();
}

module.exports = { importGearSets };