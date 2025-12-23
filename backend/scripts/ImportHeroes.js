// backend/scripts/importHeroes.js - VERSION OPTIMISÉE
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Hero = require('../src/models/Hero');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 🔥 FONCTION COMMUNE (comme les autres scripts)
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
    console.log('='.repeat(60));
    console.log('🚀 IMPORTATION HÉROS AVEC SLUGS');
    console.log('='.repeat(60));
    
    // Connexion MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kingsraid', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connecté');
    
    // Vider la collection
    console.log('\n🗑️  Suppression des héros existants...');
    const deleteResult = await Hero.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount} héros supprimés`);
    
    // 🔥 MÊME STRUCTURE QUE LES AUTRES
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
    
    console.log(`\n📂 Lecture depuis: ${heroesDataPath}`);
    
    if (!fs.existsSync(heroesDataPath)) {
      console.error(`❌ Dossier introuvable: ${heroesDataPath}`);
      process.exit(1);
    }
    
    // Lire l'ordre de release
    let releaseOrder = {};
    if (fs.existsSync(releaseOrderPath)) {
      releaseOrder = JSON.parse(fs.readFileSync(releaseOrderPath, 'utf8'));
      console.log(`📅 ${Object.keys(releaseOrder).length} héros dans l'ordre de release`);
    }
    
    // Lister les fichiers
    const files = fs.readdirSync(heroesDataPath).filter(f => f.endsWith('.json'));
    
    console.log(`\n📄 ${files.length} fichiers à importer`);
    
    let importedCount = 0;
    let errorCount = 0;
    const warnings = [];
    const slugs = new Set(); // 🔥 Pour suivre les slugs uniques
    
    // Importer chaque fichier
    for (const fileName of files) {
      try {
        const filePath = path.join(heroesDataPath, fileName);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const heroData = JSON.parse(fileContent);
        
        // Vérifier les données de base
        const heroName = heroData.infos?.name || fileName.replace('.json', '');
        if (!heroName) {
          warnings.push({ file: fileName, warning: 'Pas de nom' });
          continue;
        }
        
        // 🔥 Créer le slug
        const baseSlug = createSlug(heroName);
        let slug = baseSlug;
        
        // Vérifier l'unicité
        let counter = 1;
        while (slugs.has(slug)) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        slugs.add(slug);
        
        // Ajouter le slug aux données
        heroData.slug = slug;
        heroData.sourceFile = fileName;
        heroData.releaseOrder = releaseOrder[heroName] || 999;
        
        // Créer et sauvegarder
        const hero = new Hero(heroData);
        await hero.save();
        
        importedCount++;
        
        // 🔥 MÊME FORMAT DE LOG QUE LES AUTRES
        console.log(`✅ ${importedCount}. ${heroName}`);
        console.log(`   Slug: ${slug}, Classe: ${heroData.infos?.class || 'Unknown'}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Erreur avec ${fileName}:`, error.message);
      }
    }
    
    // 🔥 MÊME RÉSUMÉ QUE LES AUTRES
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ IMPORTATION HÉROS');
    console.log('='.repeat(60));
    
    const totalInDB = await Hero.countDocuments();
    console.log(`✅ ${totalInDB} héros importés avec succès`);
    console.log(`❌ ${errorCount} erreurs`);
    console.log(`⚠️  ${warnings.length} avertissements`);
    console.log(`🔤 Slugs uniques: ${slugs.size}`);
    
    // Statistiques
    console.log('\n📈 Statistiques:');
    const stats = await Hero.aggregate([
      { $group: { _id: '$infos.class', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    stats.forEach(stat => {
      console.log(`   • ${stat._id || 'Unknown'}: ${stat.count}`);
    });
    
    // Exemples
    console.log('\n🔍 Exemples de héros importés:');
    const samples = await Hero.find().limit(3).select('slug infos.name infos.class');
    samples.forEach(hero => {
      console.log(`   • ${hero.infos.name} (${hero.infos.class}) - slug: ${hero.slug}`);
    });
    
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB');
    console.log('🎉 IMPORTATION HÉROS TERMINÉE !');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  importHeroes();
}

module.exports = { importHeroes, createSlug };