const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Nouveau modèle propre avec slug
const ArtifactSchema = new mongoose.Schema({
  // 🔥 _id: Généré automatiquement par MongoDB (ObjectId)
  
  // 🔥 SLUG : Identifiant URL-friendly (unique)
  slug: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  
  // 🔥 NAME : Nom d'affichage
  name: { 
    type: String, 
    required: true,
    index: true 
  },
  
  description: { 
    type: String, 
    required: true 
  },
  
  // Valeurs par étoile (structure flexible)
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {}
  },
  
  thumbnail: { 
    type: String, 
    required: true 
  },
  
  story: { 
    type: String, 
    default: '' 
  },
  
  aliases: { 
    type: [String], 
    default: [] 
  },
  
  releaseOrder: { 
    type: Number, 
    index: true,
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

const Artifact = mongoose.model('Artifact', ArtifactSchema);

// Fonction pour créer un slug propre
function createSlug(name) {
  if (!name) return 'unknown';
  
  return name
    .toLowerCase()
    .normalize('NFD') // Séparer les accents
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces, tirets
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/'/g, '') // Supprimer apostrophes pour le slug
    .replace(/--+/g, '-') // Éviter doubles tirets
    .trim();
}

// Fonction pour corriger les thumbnails connus (garder les apostrophes)
function correctThumbnail(thumbnail) {
  if (!thumbnail) return thumbnail;
  
  // Liste de corrections pour les thumbnails sans apostrophe
  const corrections = {
    'artifacts/Madames Bronze Mirrors.png': 'artifacts/Madame\'s Bronze Mirrors.png',
    'artifacts/Madames Bronze Mirrors.png': 'artifacts/Madame\'s Bronze Mirrors.png',
    'artifacts/Solenis Engraving.png': 'artifacts/Solenis\' Engraving.png',
    // Ajoutez d'autres corrections au besoin
  };
  
  // Vérifier s'il y a une correction pour ce thumbnail
  const corrected = corrections[thumbnail];
  if (corrected) {
    console.log(`   → Correction thumbnail: ${thumbnail} → ${corrected}`);
    return corrected;
  }
  
  return thumbnail;
}

// Fonction pour nettoyer les données d'artifact
function cleanArtifactData(artifactData) {
  const data = JSON.parse(JSON.stringify(artifactData));
  
  // 1. Créer le slug à partir du nom
  if (data.name) {
    data.slug = createSlug(data.name);
  }
  
  // 2. S'assurer que value existe et est un objet
  if (!data.value || typeof data.value !== 'object') {
    data.value = {};
  }
  
  // 3. Nettoyer les valeurs
  Object.keys(data.value).forEach(key => {
    if (!data.value[key]) {
      data.value[key] = '';
    }
    // S'assurer que c'est une string (certains peuvent être null)
    if (typeof data.value[key] !== 'string') {
      data.value[key] = String(data.value[key] || '');
    }
  });
  
  // 4. S'assurer que les champs obligatoires existent
  if (!data.name) data.name = 'Unknown';
  if (!data.description) data.description = '';
  if (!data.thumbnail) data.thumbnail = '';
  if (!data.story) data.story = '';
  if (!data.aliases) data.aliases = [];
  
  // 5. Normaliser le thumbnail (format standard) - IMPORTANT: GARDER LES APOSTROPHES
  if (data.thumbnail) {
    // S'assurer que le chemin commence par 'artifacts/'
    if (!data.thumbnail.startsWith('artifacts/')) {
      const filename = data.thumbnail.split('/').pop() || data.thumbnail;
      data.thumbnail = `artifacts/${filename}`;
    }
    // CORRECTION: Appliquer les corrections pour garder les apostrophes
    data.thumbnail = correctThumbnail(data.thumbnail);
    // NE PAS SUPPRIMER LES APOSTROPHES - c'était l'erreur
  }
  
  return data;
}

async function importArtifacts() {
  try {
    console.log('='.repeat(60));
    console.log('🚀 IMPORTATION ARTIFACTS AVEC SLUGS');
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
    const slugs = new Set(); // Pour détecter les doublons
    
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
        
        // Vérifier le slug unique
        if (slugs.has(cleanedData.slug)) {
          console.warn(`⚠️  Slug en double détecté: ${cleanedData.slug}`);
          // Ajouter un suffixe numérique
          let counter = 1;
          let newSlug = cleanedData.slug;
          while (slugs.has(newSlug)) {
            newSlug = `${cleanedData.slug}-${counter}`;
            counter++;
          }
          cleanedData.slug = newSlug;
          console.log(`   → Changé en: ${newSlug}`);
        }
        slugs.add(cleanedData.slug);
        
        // Créer l'artifact avec le slug
        const artifact = new Artifact({
          slug: cleanedData.slug,        // 🔥 NOUVEAU: Slug
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
        console.log(`✅ ${importedCount}. ${cleanedData.name}`);
        console.log(`   Slug: ${cleanedData.slug}, Thumbnail: ${cleanedData.thumbnail}`);
        
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
    console.log(`🔤 Slugs uniques: ${slugs.size}`);
    
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
    
    // Afficher quelques exemples avec leurs thumbnails
    console.log('\n🔍 Exemples d\'artifacts importés (vérifiez les apostrophes):');
    const samples = await Artifact.find().limit(5).select('slug name thumbnail');
    samples.forEach(artifact => {
      console.log(`   • ${artifact.name}`);
      console.log(`     Slug: ${artifact.slug}`);
      console.log(`     Thumbnail: ${artifact.thumbnail}`);
    });
    
    // Vérifier les thumbnails avec apostrophes
    console.log('\n🔍 Artifacts avec apostrophes dans le thumbnail:');
    const artifactsWithApostrophe = await Artifact.find({
      thumbnail: /'/
    }).select('name thumbnail');
    
    console.log(`   ${artifactsWithApostrophe.length} artifacts avec apostrophe:`);
    artifactsWithApostrophe.forEach(artifact => {
      console.log(`   • ${artifact.name}: ${artifact.thumbnail}`);
    });
    
    // Vérifier les thumbnails SANS apostrophes qui devraient en avoir
    console.log('\n🔍 Vérification des thumbnails potentiellement problématiques:');
    const problemNames = ['Madame\'s Bronze Mirrors', 'Solenis\' Engraving'];
    for (const name of problemNames) {
      const artifact = await Artifact.findOne({ name: name }).select('name thumbnail');
      if (artifact) {
        const hasApostrophe = artifact.thumbnail.includes("'");
        console.log(`   • ${artifact.name}: ${hasApostrophe ? '✅ Avec apostrophe' : '❌ SANS apostrophe'} (${artifact.thumbnail})`);
      }
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

module.exports = { importArtifacts, createSlug };