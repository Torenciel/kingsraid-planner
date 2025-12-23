const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Perk = require('../src/models/Perk');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Fonction pour créer un slug propre
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

// Classes disponibles
const CLASSES = [
  'General', 'Knight', 'Warrior', 'Assassin',
  'Archer', 'Wizard', 'Priest', 'Mechanic'
];

async function importPerks() {
  try {
    console.log('='.repeat(60));
    console.log('🚀 IMPORTATION PERKS (T1 & T2) SANS TAGS');
    console.log('='.repeat(60));
    
    // Connexion MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kingsraid', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connecté');
    
    // Vider la collection existante (seulement T1 et T2)
    console.log('\n🗑️  Suppression des anciennes perks T1/T2...');
    const deleteResult = await Perk.deleteMany({
      tier: { $in: ['t1', 't2'] }
    });
    console.log(`✅ ${deleteResult.deletedCount} anciennes perks supprimées`);
    
    // Chemin des fichiers
    const basePath = path.join(
      __dirname,
      '..',
      '..',
      'frontend',
      'public',
      'kingsraid-data'
    );
    
    const classesPath = path.join(basePath, 'table-data', 'classes');
    
    console.log(`\n📂 Lecture des perks depuis: ${classesPath}`);
    
    if (!fs.existsSync(classesPath)) {
      console.error(`❌ Dossier non trouvé: ${classesPath}`);
      process.exit(1);
    }
    
    let importedCount = 0;
    let errorCount = 0;
    const warnings = [];
    const slugs = new Set();
    
    // Importer les perks pour chaque classe
    for (const className of CLASSES) {
      const fileName = `${className}.json`;
      const filePath = path.join(classesPath, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Fichier non trouvé: ${fileName}`);
        warnings.push({ class: className, warning: 'Fichier non trouvé' });
        continue;
      }
      
      try {
        console.log(`\n📄 ${className}...`);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const classData = JSON.parse(fileContent);
        
        let classImported = 0;
        
        // Importer les perks T1 (seulement pour General)
        if (className === 'General' && classData.perks?.t1) {
          classImported += await importT1Perks(classData.perks.t1, slugs);
        }
        
        // Importer les perks T2 (pour toutes les classes sauf General)
        if (className !== 'General' && classData.perks?.t2) {
          classImported += await importT2Perks(className, classData.perks.t2, slugs);
        }
        
        console.log(`   ✅ ${classImported} perks importées`);
        importedCount += classImported;
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Erreur avec ${className}:`, error.message);
      }
    }
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ IMPORTATION PERKS');
    console.log('='.repeat(60));
    
    const totalInDB = await Perk.countDocuments({ tier: { $in: ['t1', 't2'] } });
    console.log(`✅ ${totalInDB} perks importées avec succès`);
    console.log(`❌ ${errorCount} erreurs`);
    console.log(`⚠️  ${warnings.length} avertissements`);
    console.log(`🔤 Slugs uniques: ${slugs.size}`);
    
    // Statistiques
    console.log('\n📈 Statistiques:');
    
    const t1Count = await Perk.countDocuments({ tier: 't1' });
    const t2Count = await Perk.countDocuments({ tier: 't2' });
    
    console.log(`   • T1 perks: ${t1Count}`);
    console.log(`   • T2 perks: ${t2Count}`);
    
    // Exemples
    console.log('\n🔍 Exemples de perks importées:');
    const samples = await Perk.find({ tier: 't1' }).limit(3).select('slug name tier');
    samples.forEach(perk => {
      console.log(`   • [${perk.tier}] ${perk.name} (slug: ${perk.slug})`);
    });
    
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB');
    console.log('🎉 IMPORTATION PERKS TERMINÉE !');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Fonction pour importer les perks T1
async function importT1Perks(t1Perks, slugs) {
  const perks = [];
  
  for (const [name, description] of Object.entries(t1Perks)) {
    // Créer un slug pour la perk
    const baseSlug = createSlug(name);
    let slug = baseSlug;
    
    // Vérifier l'unicité
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
      // ❌ SUPPRIMÉ: tags
    });
    
    perks.push(perk.save());
  }
  
  await Promise.all(perks);
  return perks.length;
}

// Fonction pour importer les perks T2
async function importT2Perks(className, t2Perks, slugs) {
  const perks = [];
  
  for (const [name, description] of Object.entries(t2Perks)) {
    // Créer un slug pour la perk
    const baseSlug = createSlug(`${className}-${name}`);
    let slug = baseSlug;
    
    // Vérifier l'unicité
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
      // ❌ SUPPRIMÉ: tags
    });
    
    perks.push(perk.save());
  }
  
  await Promise.all(perks);
  return perks.length;
}

// Fonction simple pour l'ordre T1
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

// Fonction simple pour l'ordre T2
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
    // ... autres classes si nécessaire
  };
  
  return (orderMaps[className] && orderMaps[className][name]) || 0;
}

if (require.main === module) {
  importPerks();
}

module.exports = { importPerks, createSlug };