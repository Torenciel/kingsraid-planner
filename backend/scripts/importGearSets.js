const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const GearSet = require('../src/models/GearSet');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function importGearSets() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
    
    // Chemin du fichier
    const gearSetsPath = path.join(
      __dirname,
      '..',
      '..',
      'frontend',
      'public',
      'kingsraid-data',
      'table-data',
      'gearsets.json'
    );
    
    console.log(`📂 Lecture des gear sets depuis: ${gearSetsPath}`);
    
    if (!fs.existsSync(gearSetsPath)) {
      console.error(`❌ Fichier non trouvé: ${gearSetsPath}`);
      process.exit(1);
    }
    
    // Lire les données
    const gearSetsData = JSON.parse(fs.readFileSync(gearSetsPath, 'utf8'));
    
    // Vider la collection
    console.log('🗑️  Suppression des anciens gear sets...');
    await GearSet.deleteMany({});
    console.log('✅ Anciens gear sets supprimés');
    
    let importedCount = 0;
    let errorCount = 0;
    
    // Définir l'ordre de tri
    const sortOrderMap = {
      'black_dragon': 1,
      'fire_dragon': 2,
      'frost_dragon': 3,
      'poison_dragon': 4,
      'lava_gear': 5,
      'beast_of_chaos': 6,
      'dark_legion': 7,
      'hero_suppression_gear': 8,
      'hero_protection_gear': 9
    };
    
    // Importer chaque gear set
    for (const gearSetData of gearSetsData) {
      try {
        const gearSet = new GearSet({
          id: gearSetData.id,
          name: gearSetData.name,
          image: gearSetData.image,
          bonus2P: gearSetData.bonus2P,
          bonus4P: gearSetData.bonus4P,
          sortOrder: sortOrderMap[gearSetData.id] || 999
        });
        
        await gearSet.save();
        importedCount++;
        console.log(`✅ ${gearSetData.name} importé`);
        
      } catch (error) {
        console.error(`❌ Erreur avec ${gearSetData.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(40));
    console.log('📊 IMPORT GEAR SETS TERMINÉ');
    console.log(`✅ ${importedCount} gear sets importés`);
    console.log(`❌ ${errorCount} erreurs`);
    console.log('='.repeat(40) + '\n');
    
    await mongoose.disconnect();
    console.log('👋 Déconnecté de MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

importGearSets();