// backend/scripts/clearGearSets.js
const mongoose = require('mongoose');
const path = require('path');

// Charger le .env depuis le bon chemin
require('dotenv').config({ 
  path: path.join(__dirname, '..', '.env') 
});

async function clearGearSets() {
  try {
    console.log('🗑️  VIDAGE COMPLET DE LA COLLECTION GEARSETS');
    console.log('='.repeat(60));
    
    // Utiliser votre URI
    const mongoURI = process.env.MONGODB_URI;
    console.log(`🔗 Connexion à: ${mongoURI}`);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connecté à MongoDB');
    
    // Vérifier si le modèle existe déjà
    let GearSet;
    try {
      GearSet = mongoose.model('GearSet');
    } catch (e) {
      // Créer un modèle temporaire si nécessaire
      const GearSetSchema = new mongoose.Schema({
        slug: String,
        name: String,
        thumbnail: String,
        bonus2P: String,
        bonus4P: String,
        sortOrder: Number
      });
      GearSet = mongoose.model('GearSet', GearSetSchema);
    }
    
    // Supprimer TOUS les documents
    const deleteResult = await GearSet.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount} gear sets supprimés`);
    
    // Essayer de supprimer les indexes
    try {
      await GearSet.collection.dropIndexes();
      console.log('✅ Indexes supprimés');
    } catch (indexError) {
      console.log('ℹ️  Note sur les indexes:', indexError.message);
    }
    
    await mongoose.disconnect();
    console.log('\n🎉 Opération terminée !');
    console.log('Vous pouvez maintenant exécuter: node backend/scripts/importGearSets.js');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 MongoDB n\'est pas démarré !');
      console.error('Démarrez MongoDB avec: mongod --dbpath ./data/db');
      console.error('Ou utilisez MongoDB Compass pour vérifier la connexion.');
    }
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  clearGearSets();
}

module.exports = { clearGearSets };