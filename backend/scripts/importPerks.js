const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Perk = require('../src/models/Perk');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Classes disponibles
const CLASSES = [
  'General', 'Knight', 'Warrior', 'Assassin',
  'Archer', 'Wizard', 'Priest', 'Mechanic'
];

// Mapping des noms de fichiers aux classes
const CLASS_FILE_MAP = {
  'General': 'General.json',
  'Knight': 'Knight.json',
  'Warrior': 'Warrior.json',
  'Assassin': 'Assassin.json',
  'Archer': 'Archer.json',
  'Wizard': 'Wizard.json',
  'Priest': 'Priest.json',
  'Mechanic': 'Mechanic.json'
};

// Ordre d'affichage pour T1 perks
const T1_DISPLAY_ORDER = {
  'ATK Up': 1,
  'HP Up': 2,
  'DEF Up': 3,
  'Crit Resist Up': 4,
  'Monster Hunting': 5
};

// Ordre d'affichage pour T2 perks (par classe)
const T2_DISPLAY_ORDER = {
  'Knight': {
    'Experienced Fighter': 1,
    'Excellent Strategy': 2,
    'Battle Cry': 3,
    'Shield of Protection': 4,
    'Swift Move': 5
  },
  'Warrior': {
    'Opportune Strike': 1,
    'Warlike': 2,
    'Offensive Guard': 3,
    'Tactical Foresight': 4,
    'Blood Wrath': 5
  },
  'Assassin': {
    'Target Weakness': 1,
    'Swift and Nimble': 2,
    'Tactical Foresight': 3,
    'Opportune Strike': 4,
    'Vital Detection': 5
  },
  'Archer': {
    'Precision Shot': 1,
    'Eagle Eye': 2,
    'Mortal Wound': 3,
    'Opportune Strike': 4,
    'Concentration': 5
  },
  'Wizard': {
    'Deception': 1,
    'Moral Rise': 2,
    'Blessing of Mana': 3,
    'Circuit Burst': 4,
    'Destruction': 5
  },
  'Priest': {
    'Vengeful Curse': 1,
    'Goddess Blessing': 2,
    'Inner Peace': 3,
    'Blessing of Mana': 4,
    'Swiftness': 5
  },
  'Mechanic': {
    'Target Weakness': 1,
    'Ready Cannons': 2,
    'Pressure Point': 3,
    'Special Bullet': 4,
    'Amplified Gunpowder': 5
  }
};

async function importPerks() {
  try {
    console.log('='.repeat(60));
    console.log('🚀 IMPORTATION PERKS (T1 & T2)');
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
    const classesPath = path.join(
      __dirname,
      '..',
      '..',
      'frontend',
      'public',
      'kingsraid-data',
      'table-data',
      'classes'
    );
    
    console.log(`\n📂 Lecture des perks depuis: ${classesPath}`);
    
    if (!fs.existsSync(classesPath)) {
      console.error(`❌ Dossier non trouvé: ${classesPath}`);
      process.exit(1);
    }
    
    let importedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Importer les perks pour chaque classe
    for (const className of CLASSES) {
      const fileName = CLASS_FILE_MAP[className];
      const filePath = path.join(classesPath, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Fichier non trouvé: ${fileName}`);
        continue;
      }
      
      try {
        console.log(`\n📄 ${className}...`);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const classData = JSON.parse(fileContent);
        
        // Importer les perks T1 (seulement pour General)
        if (className === 'General' && classData.perks?.t1) {
          await importT1Perks(classData.perks.t1);
          console.log(`   ✅ ${Object.keys(classData.perks.t1).length} perks T1 importées`);
        }
        
        // Importer les perks T2 (pour toutes les classes sauf General)
        if (className !== 'General' && classData.perks?.t2) {
          await importT2Perks(className, classData.perks.t2);
          console.log(`   ✅ ${Object.keys(classData.perks.t2).length} perks T2 importées`);
        }
        
        importedCount += Object.keys(classData.perks?.t1 || {}).length +
                         Object.keys(classData.perks?.t2 || {}).length;
                         
      } catch (error) {
        errorCount++;
        errors.push({ class: className, error: error.message });
        console.error(`❌ Erreur avec ${className}:`, error.message);
      }
    }
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ IMPORTATION PERKS');
    console.log('='.repeat(60));
    
    const totalInDB = await Perk.countDocuments({ tier: { $in: ['t1', 't2'] } });
    console.log(`✅ ${totalInDB} perks importées dans la base`);
    console.log(`❌ ${errorCount} erreurs`);
    
    if (errors.length > 0) {
      console.log('\n📋 Détail des erreurs:');
      errors.slice(0, 5).forEach(err => {
        console.log(`   • ${err.class}: ${err.error}`);
      });
      if (errors.length > 5) {
        console.log(`   ... et ${errors.length - 5} autres`);
      }
    }
    
    // Statistiques
    console.log('\n📈 Statistiques:');
    
    const t1Count = await Perk.countDocuments({ tier: 't1' });
    const t2Count = await Perk.countDocuments({ tier: 't2' });
    
    console.log(`   • T1 perks: ${t1Count}`);
    console.log(`   • T2 perks: ${t2Count}`);
    
    // Distribution par classe pour T2
    const t2ByClass = await Perk.aggregate([
      { $match: { tier: 't2' } },
      { $group: { _id: '$class', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n🏷️  T2 perks par classe:');
    t2ByClass.forEach(stat => {
      console.log(`   • ${stat._id}: ${stat.count}`);
    });
    
    // Exemples
    console.log('\n🔍 Exemples de perks importées:');
    const samples = await Perk.find({ tier: 't1' }).limit(3).select('name tier description');
    samples.forEach(perk => {
      console.log(`   • [${perk.tier}] ${perk.name}: ${perk.description.substring(0, 50)}...`);
    });
    
    const t2Samples = await Perk.find({ tier: 't2', class: 'Archer' }).limit(2).select('name class description');
    t2Samples.forEach(perk => {
      console.log(`   • [${perk.tier}-${perk.class}] ${perk.name}`);
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
async function importT1Perks(t1Perks) {
  const perks = [];
  
  for (const [name, description] of Object.entries(t1Perks)) {
    const thumbnail = `${name}.png`;
    const displayOrder = T1_DISPLAY_ORDER[name] || 0;
    
    const perk = new Perk({
      name: name,
      description: description,
      thumbnail: thumbnail,
      tier: 't1',
      class: 'General',
      displayOrder: displayOrder,
      tags: getTagsFromDescription(description, 't1', name)
    });
    
    perks.push(perk.save());
  }
  
  await Promise.all(perks);
}

// Fonction pour importer les perks T2
async function importT2Perks(className, t2Perks) {
  const perks = [];
  const displayOrderMap = T2_DISPLAY_ORDER[className] || {};
  
  for (const [name, description] of Object.entries(t2Perks)) {
    const thumbnail = `${name}.png`;
    const displayOrder = displayOrderMap[name] || 0;
    
    const perk = new Perk({
      name: name,
      description: description,
      thumbnail: thumbnail,
      tier: 't2',
      class: className,
      displayOrder: displayOrder,
      tags: getTagsFromDescription(description, 't2', className)
    });
    
    perks.push(perk.save());
  }
  
  await Promise.all(perks);
}

// Fonction pour extraire les tags de la description
function getTagsFromDescription(description, tier, context) {
  const desc = description.toLowerCase();
  const tags = [];
  
  // Tags basés sur le contenu
  if (desc.includes('atk')) tags.push('atk');
  if (desc.includes('def')) tags.push('def');
  if (desc.includes('hp')) tags.push('hp');
  if (desc.includes('crit')) tags.push('crit');
  if (desc.includes('accuracy') || desc.includes('acc')) tags.push('accuracy');
  if (desc.includes('penetration')) tags.push('penetration');
  if (desc.includes('mana') || desc.includes('mp')) tags.push('mana');
  if (desc.includes('cooldown')) tags.push('cooldown');
  if (desc.includes('heal')) tags.push('healing');
  if (desc.includes('ally') || desc.includes('allies')) tags.push('support');
  
  // Tags basés sur le tier
  if (tier === 't1') tags.push('general');
  if (tier === 't2') tags.push('class');
  
  // Tags basés sur le contexte/classe
  if (context === 'Knight' || context === 'Warrior') tags.push('defensive');
  if (context === 'Assassin' || context === 'Archer') tags.push('offensive');
  if (context === 'Wizard') tags.push('magical');
  if (context === 'Priest') tags.push('healing', 'support');
  if (context === 'Mechanic') tags.push('mechanical');
  
  // Tags PvE/PvP
  if (desc.includes('hero') || desc.includes('pvp')) tags.push('pvp');
  if (desc.includes('monster') || desc.includes('non-hero')) tags.push('pve');
  
  return [...new Set(tags)]; // Supprimer les doublons
}

if (require.main === module) {
  importPerks();
}

module.exports = { importPerks };