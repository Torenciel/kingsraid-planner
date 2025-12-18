const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Artifact = require('../src/models/Artifact');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Fonction pour nettoyer les données d'artifact
function cleanArtifactData(artifactData) {
  const data = JSON.parse(JSON.stringify(artifactData));
  
  // 1. S'assurer que value existe et est un objet
  if (!data.value || typeof data.value !== 'object') {
    data.value = {};
  }
  
  // 2. Nettoyer les valeurs (certains peuvent être null ou undefined)
  Object.keys(data.value).forEach(key => {
    if (!data.value[key]) {
      data.value[key] = '';
    }
  });
  
  // 3. S'assurer que les champs obligatoires existent
  if (!data.name) data.name = 'Unknown';
  if (!data.description) data.description = '';
  if (!data.thumbnail) data.thumbnail = '';
  if (!data.story) data.story = '';
  
  // 4. Normaliser le thumbnail
  if (data.thumbnail && !data.thumbnail.startsWith('artifacts/')) {
    const filename = data.thumbnail.split('/').pop() || data.thumbnail;
    data.thumbnail = `artifacts/${filename}`;
  }
  
  return data;
}

async function importArtifacts() {
  try {
    console.log('='.repeat(60));
    console.log('🚀 IMPORTATION ARTIFACTS');
    console.log('='.repeat(60));
    
    // Connexion MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kingsraid', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connecté');
    
    // Vider la collection existante
    console.log('\n🗑️  Suppression des anciens artifacts...');
    const deleteResult = await Artifact.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount} anciens artifacts supprimés`);
    
    // Chemins des fichiers
    const basePath = path.join(
      __dirname,
      '..',
      '..',
      'frontend',
      'public',
      'kingsraid-data'
    );
    
    const artifactsPath = path.join(basePath, 'table-data', 'artifacts.json');
    const orderPath = path.join(basePath, 'artifact_release_order.json');
    
    console.log(`\n📂 Lecture des artifacts depuis: ${artifactsPath}`);
    
    if (!fs.existsSync(artifactsPath)) {
      console.error(`❌ Fichier non trouvé: ${artifactsPath}`);
      process.exit(1);
    }
    
    // Lire les données
    const artifactsData = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
    
    // Lire l'ordre de release
    let orderData = {};
    if (fs.existsSync(orderPath)) {
      orderData = JSON.parse(fs.readFileSync(orderPath, 'utf8'));
      console.log(`📅 ${Object.keys(orderData).length} artifacts dans l'ordre de release`);
    } else {
      console.log('⚠️  Fichier d\'ordre de release non trouvé');
    }
    
    console.log(`\n📄 ${artifactsData.length} artifacts à importer`);
    
    let importedCount = 0;
    let errorCount = 0;
    const warnings = [];
    
    // Importer chaque artifact
    for (const artifactData of artifactsData) {
      try {
        // Nettoyer les données
        const cleanedData = cleanArtifactData(artifactData);
        
        // Vérifier les données minimales
        if (!cleanedData.name || cleanedData.name === 'Unknown') {
          warnings.push({ name: 'Unknown', warning: 'Nom manquant' });
          continue;
        }
        
        // Créer l'artifact
        const artifact = new Artifact({
          name: cleanedData.name,
          description: cleanedData.description,
          value: cleanedData.value,
          thumbnail: cleanedData.thumbnail,
          story: cleanedData.story,
          aliases: cleanedData.aliases,
          releaseOrder: orderData[cleanedData.name] || 999
        });
        
        await artifact.save();
        importedCount++;
        
        // Afficher le nombre d'attributs
        const attrCount = Object.keys(cleanedData.value || {}).length;
        console.log(`✅ ${importedCount}. ${cleanedData.name} (${attrCount} attribut(s))`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Erreur avec ${artifactData?.name || 'Unknown'}:`, error.message);
        
        // Debug détaillé
        if (process.env.NODE_ENV === 'development') {
          console.error('Data:', JSON.stringify(artifactData, null, 2).substring(0, 300) + '...');
        }
      }
    }
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ IMPORTATION ARTIFACTS');
    console.log('='.repeat(60));
    console.log(`✅ ${importedCount} artifacts importés avec succès`);
    console.log(`❌ ${errorCount} erreurs`);
    console.log(`⚠️  ${warnings.length} avertissements`);
    
    if (warnings.length > 0) {
      console.log('\n📋 Avertissements:');
      warnings.slice(0, 5).forEach(warn => {
        console.log(`   • ${warn.name}: ${warn.warning}`);
      });
      if (warnings.length > 5) {
        console.log(`   ... et ${warnings.length - 5} autres`);
      }
    }
    
    // Statistiques MongoDB
    const totalInDB = await Artifact.countDocuments();
    console.log(`\n📊 Total dans la base: ${totalInDB} artifacts`);
    
    // Statistiques par nombre d'attributs
    const allArtifacts = await Artifact.find({}, { name: 1, value: 1 });
    const stats = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0
    };
    
    allArtifacts.forEach(artifact => {
      const attrCount = Object.keys(artifact.value || {}).length;
      stats[attrCount] = (stats[attrCount] || 0) + 1;
    });
    
    console.log('\n📈 Distribution par nombre d\'attributs:');
    Object.entries(stats).forEach(([count, total]) => {
      if (total > 0) {
        console.log(`   • ${count} attribut(s): ${total} artifacts`);
      }
    });
    
    // Exemples
    console.log('\n🔍 Exemples d\'artifacts importés:');
    const samples = await Artifact.find().limit(5).select('name value thumbnail');
    samples.forEach(artifact => {
      const attrCount = Object.keys(artifact.value || {}).length;
      console.log(`   • ${artifact.name} (${attrCount} attribut(s))`);
    });
    
    // Trouver un artifact avec plusieurs attributs
    const multiAttr = await Artifact.findOne({ 
      $expr: { $gt: [{ $size: { $objectToArray: "$value" } }, 1] } 
    }).select('name value');
    
    if (multiAttr) {
      console.log(`\n🔧 Exemple d'artifact avec plusieurs attributs: ${multiAttr.name}`);
      console.log(`   Attributs: ${Object.keys(multiAttr.value).join(', ')}`);
    }
    
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB');
    console.log('🎉 IMPORTATION ARTIFACTS TERMINÉE !');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  importArtifacts();
}

module.exports = { importArtifacts };