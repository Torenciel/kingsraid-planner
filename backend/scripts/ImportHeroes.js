const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Hero = require('../src/models/Hero');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Fonction pour nettoyer et normaliser les données avant transformation
function cleanAndNormalizeData(jsonData) {
  const data = JSON.parse(JSON.stringify(jsonData));
  
  // 1. S'assurer que infos existe
  if (!data.infos) data.infos = {};
  
  // 2. Normaliser les clés avec espaces dans infos
  const keyMapping = {
    'attack range': 'attack_range',
    'damage type': 'damage_type',
    'birth of month': 'birth_month'
  };
  
  if (data.infos) {
    Object.keys(keyMapping).forEach(oldKey => {
      if (data.infos[oldKey] !== undefined) {
        data.infos[keyMapping[oldKey]] = data.infos[oldKey];
        delete data.infos[oldKey];
      }
    });
  }
  
  // 3. S'assurer que story_ existe (copier de story si manquant)
  if (!data.infos.story_ && data.infos.story) {
    data.infos.story_ = data.infos.story;
  }
  
  // 4. S'assurer que les structures principales existent
  if (!data.skills) data.skills = {};
  if (!data.books) data.books = {};
  if (!data.perks) data.perks = { t3: {}, t5: {} };
  if (!data.perks.t3) data.perks.t3 = {};
  if (!data.perks.t5) data.perks.t5 = {};
  if (!data.uw) data.uw = { value: {} };
  if (!data.uw.value) data.uw.value = {};
  if (!data.uts) data.uts = {};
  if (!data.sw) data.sw = { advancement: {} };
  if (!data.sw.advancement) data.sw.advancement = {};
  
  // 5. Nettoyer les valeurs null/undefined dans skills
  if (data.skills) {
    Object.keys(data.skills).forEach(skillKey => {
      if (data.skills[skillKey]) {
        if (data.skills[skillKey].cost === undefined) data.skills[skillKey].cost = null;
        if (data.skills[skillKey].cooldown === undefined) data.skills[skillKey].cooldown = null;
        if (!data.skills[skillKey].name) data.skills[skillKey].name = '';
        if (!data.skills[skillKey].description) data.skills[skillKey].description = '';
        if (!data.skills[skillKey].thumbnail) data.skills[skillKey].thumbnail = '';
      }
    });
  }
  
  // 6. Nettoyer les livres
  if (data.books) {
    Object.keys(data.books).forEach(bookKey => {
      if (data.books[bookKey]) {
        if (!data.books[bookKey].II) data.books[bookKey].II = '';
        if (!data.books[bookKey].III) data.books[bookKey].III = '';
        if (!data.books[bookKey].IV) data.books[bookKey].IV = '';
      }
    });
  }
  
  // 7. Nettoyer UW value (accepter un seul niveau si c'est tout ce qu'il y a)
  if (data.uw && data.uw.value) {
    // Convertir l'objet en Map-friendly format si nécessaire
    const uwValue = data.uw.value;
    if (typeof uwValue === 'object' && !Array.isArray(uwValue)) {
      // C'est bon, garder tel quel
    } else {
      data.uw.value = {};
    }
  }
  
  // 8. Nettoyer UT values
  if (data.uts) {
    Object.keys(data.uts).forEach(utKey => {
      if (data.uts[utKey] && !data.uts[utKey].value) {
        data.uts[utKey].value = {};
      }
    });
  }
  
  return data;
}

// Fonction pour transformer les données JSON en format MongoDB
function transformHeroData(jsonData, fileName) {
  // Nettoyer d'abord les données
  const cleanedData = cleanAndNormalizeData(jsonData);
  
  // Créer une copie profonde
  const heroData = JSON.parse(JSON.stringify(cleanedData));
  
  // 1. Récupérer le nom du héros
  const heroName = heroData.infos?.name || fileName.replace('.json', '');
  
  // 2. Créer le slug
  heroData.slug = heroName
    .toLowerCase()
    .normalize('NFD') // Normaliser les accents
    .replace(/[\u0300-\u036f]/g, '') // Retirer les diacritiques
    .replace(/[^\w\s-]/g, '') // Retirer caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-'); // Éviter les tirets multiples
  
  // 3. Normaliser les chemins d'images
  const normalizeImagePath = (imagePath, heroName) => {
    if (!imagePath || imagePath === '') return '';
    
    // Si le chemin est déjà correct ou vide, le garder
    if (imagePath.startsWith('heroes/') || imagePath === '') {
      return imagePath;
    }
    
    // Si c'est null ou undefined, retourner chaîne vide
    if (imagePath === null || imagePath === undefined) {
      return '';
    }
    
    // Sinon, ajouter le préfixe du héros
    // Exemple: "ico.png" -> "heroes/Aisha/ico.png"
    // Mais d'abord, retirer le "heroes/" en double si présent
    const cleanPath = imagePath.replace(/^heroes\//, '');
    return `heroes/${heroName}/${cleanPath}`;
  };
  
  // 4. Appliquer la normalisation à toutes les images
  const normalizeAllImages = (obj, context) => {
    if (!obj || typeof obj !== 'object') return;
    
    for (const key in obj) {
      if (key === 'thumbnail' && typeof obj[key] === 'string') {
        obj[key] = normalizeImagePath(obj[key], heroName);
      } else if (typeof obj[key] === 'object') {
        normalizeAllImages(obj[key], context);
      }
    }
  };
  
  // Normaliser infos
  if (heroData.infos) {
    normalizeAllImages(heroData.infos, 'infos');
    
    // S'assurer que les champs obligatoires ont des valeurs par défaut
    if (!heroData.infos.class) heroData.infos.class = 'Unknown';
    if (!heroData.infos.position) heroData.infos.position = 'Unknown';
  }
  
  // Normaliser skills
  if (heroData.skills) {
    normalizeAllImages(heroData.skills, 'skills');
  }
  
  // Normaliser perks
  if (heroData.perks) {
    normalizeAllImages(heroData.perks, 'perks');
  }
  
  // Normaliser uw
  if (heroData.uw) {
    normalizeAllImages(heroData.uw, 'uw');
  }
  
  // Normaliser uts
  if (heroData.uts) {
    normalizeAllImages(heroData.uts, 'uts');
  }
  
  // Normaliser sw
  if (heroData.sw) {
    normalizeAllImages(heroData.sw, 'sw');
  }
  
  // Normaliser splashart et costumes
  if (heroData.splashart) {
    heroData.splashart = normalizeImagePath(heroData.splashart, heroName);
  }
  
  if (heroData.costumes) {
    heroData.costumes = normalizeImagePath(heroData.costumes, heroName);
  }
  
  // 5. Ajouter les métadonnées
  heroData.sourceFile = fileName;
  
  // Vérifier si l'image existe (approximatif)
  heroData.hasImage = !!heroData.infos?.thumbnail && heroData.infos.thumbnail !== '';
  
  // 6. Convertir les objets en Maps pour MongoDB (se fera automatiquement)
  
  return heroData;
}

// Fonction pour lire l'ordre de release
function loadReleaseOrder(releaseOrderPath) {
  try {
    if (fs.existsSync(releaseOrderPath)) {
      const fileContent = fs.readFileSync(releaseOrderPath, 'utf8');
      const releaseData = JSON.parse(fileContent);
      
      // Convertir en tableau [nom, ordre]
      const releaseArray = Object.entries(releaseData || {})
        .map(([name, order]) => ({ name, order: parseInt(order) }))
        .sort((a, b) => a.order - b.order);
      
      console.log(`📅 ${releaseArray.length} héros dans l'ordre de release`);
      return releaseArray;
    }
  } catch (error) {
    console.error('❌ Erreur lecture release order:', error.message);
  }
  return [];
}

async function importHeroes() {
  try {
    console.log('='.repeat(60));
    console.log('🚀 DÉBUT IMPORTATION HÉROS (Version flexible)');
    console.log('='.repeat(60));
    
    // Connexion MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kingsraid', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connecté');
    
    // Vider la collection existante
    console.log('\n🗑️  Suppression des héros existants...');
    const deleteResult = await Hero.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount} héros supprimés`);
    
    // Chemins des fichiers
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
    
    console.log(`\n📂 Chemin des données: ${heroesDataPath}`);
    
    // Vérifier que le dossier existe
    if (!fs.existsSync(heroesDataPath)) {
      console.error(`❌ ERREUR: Dossier introuvable: ${heroesDataPath}`);
      console.log('Vérifiez que vos données sont dans: frontend/public/kingsraid-data/table-data/heroes/');
      process.exit(1);
    }
    
    // Lire l'ordre de release
    const releaseOrder = loadReleaseOrder(releaseOrderPath);
    
    // Lister les fichiers
    const files = fs.readdirSync(heroesDataPath);
    const jsonFiles = files.filter(file => 
      file.endsWith('.json') && file !== 'heroes.json'
    );
    
    console.log(`📄 ${jsonFiles.length} fichiers JSON trouvés\n`);
    
    let importedCount = 0;
    let errorCount = 0;
    const errors = [];
    const warnings = [];
    
    // Importer chaque fichier
    for (const fileName of jsonFiles) {
      try {
        const filePath = path.join(heroesDataPath, fileName);
        
        // Lire le fichier
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);
        
        // Vérifier les données de base
        if (!jsonData.infos || !jsonData.infos.name) {
          warnings.push({ file: fileName, warning: 'Pas de nom dans infos' });
          console.log(`⚠️  ${fileName}: Pas de nom dans infos, utilisation du nom de fichier`);
        }
        
        // Transformer les données
        const heroData = transformHeroData(jsonData, fileName);
        
        // Ajouter l'ordre de release
        const releaseInfo = releaseOrder.find(r => 
          r.name === heroData.infos.name
        );
        if (releaseInfo) {
          heroData.releaseOrder = releaseInfo.order;
        } else {
          heroData.releaseOrder = 999; // Valeur par défaut pour ceux sans ordre
        }
        
        // Vérifications avant sauvegarde
        if (!heroData.slug) {
          throw new Error('Slug non généré');
        }
        
        // Vérifier les données minimales
        const missingFields = [];
        if (!heroData.infos?.name) missingFields.push('name');
        if (!heroData.infos?.class || heroData.infos.class === 'Unknown') missingFields.push('class');
        if (!heroData.infos?.position || heroData.infos.position === 'Unknown') missingFields.push('position');
        
        if (missingFields.length > 0) {
          warnings.push({ 
            file: fileName, 
            warning: `Champs manquants: ${missingFields.join(', ')}` 
          });
        }
        
        // Créer et sauvegarder le document
        const hero = new Hero(heroData);
        await hero.save();
        
        importedCount++;
        
        // Message détaillé pour debug
        const skillsCount = Object.keys(heroData.skills || {}).length;
        const hasUW = !!heroData.uw?.name;
        const hasSW = !!heroData.sw?.requirement;
        
        console.log(`✅ ${importedCount.toString().padStart(3, ' ')}. ${heroData.infos.name || fileName}`);
        console.log(`   📊 Skills: ${skillsCount}, UW: ${hasUW ? '✓' : '✗'}, SW: ${hasSW ? '✓' : '✗'}, Classe: ${heroData.infos.class}`);
        
      } catch (error) {
        errorCount++;
        errors.push({ 
          file: fileName, 
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        console.error(`❌ Erreur avec ${fileName}:`, error.message);
        
        // Log détaillé en développement
        if (process.env.NODE_ENV === 'development') {
          console.error('Stack:', error.stack);
          
          // Afficher un aperçu des données problématiques
          try {
            const filePath = path.join(heroesDataPath, fileName);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(fileContent);
            console.error('Data preview:', JSON.stringify(jsonData, null, 2).substring(0, 500) + '...');
          } catch (e) {
            console.error('Cannot read file for debug:', e.message);
          }
        }
      }
    }
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ IMPORTATION');
    console.log('='.repeat(60));
    console.log(`✅ ${importedCount} héros importés avec succès`);
    console.log(`❌ ${errorCount} erreurs`);
    console.log(`⚠️  ${warnings.length} avertissements`);
    
    if (warnings.length > 0) {
      console.log('\n📋 Avertissements:');
      warnings.slice(0, 10).forEach(warn => {
        console.log(`   • ${warn.file}: ${warn.warning}`);
      });
      if (warnings.length > 10) {
        console.log(`   ... et ${warnings.length - 10} autres avertissements`);
      }
    }
    
    if (errors.length > 0) {
      console.log('\n📋 Détail des erreurs:');
      errors.slice(0, 10).forEach(err => {
        console.log(`   • ${err.file}: ${err.error}`);
      });
      if (errors.length > 10) {
        console.log(`   ... et ${errors.length - 10} autres erreurs`);
      }
    }
    
    // Statistiques MongoDB
    const totalInDB = await Hero.countDocuments();
    console.log(`\n📊 Total dans la base: ${totalInDB} héros`);
    
    // Statistiques par classe
    const classStats = await Hero.aggregate([
      { $group: { _id: '$infos.class', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n🏷️  Distribution par classe:');
    classStats.forEach(stat => {
      console.log(`   • ${stat._id || 'Non spécifié'}: ${stat.count}`);
    });
    
    // Vérifier quelques héros importés
    console.log('\n🔍 Exemples de héros importés:');
    const sampleHeroes = await Hero.find().limit(5).select('infos.name infos.class infos.position slug');
    sampleHeroes.forEach(hero => {
      const skillsCount = Object.keys(hero.skills || {}).length;
      console.log(`   • ${hero.infos.name} (${hero.infos.class}/${hero.infos.position}) - ${skillsCount} skills - ${hero.slug}`);
    });
    
    // Héros problématiques
    const problematic = await Hero.find({
      $or: [
        { 'infos.class': { $in: ['', 'Unknown', null] } },
        { 'infos.position': { $in: ['', 'Unknown', null] } }
      ]
    }).limit(5).select('infos.name infos.class infos.position');
    
    if (problematic.length > 0) {
      console.log('\n⚠️  Héros avec classe/position inconnue:');
      problematic.forEach(h => {
        console.log(`   • ${h.infos.name}: Classe="${h.infos.class}", Position="${h.infos.position}"`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB');
    console.log('🎉 IMPORTATION TERMINÉE !');
    
    // Suggestions pour les erreurs restantes
    if (errorCount > 0) {
      console.log('\n💡 Suggestions pour résoudre les erreurs:');
      console.log('   1. Vérifiez les fichiers JSON problématiques');
      console.log('   2. Assurez-vous que chaque héros a au moins:');
      console.log('      - Un nom dans infos.name');
      console.log('      - Une classe dans infos.class');
      console.log('      - Une position dans infos.position');
      console.log('   3. Les skills et UW peuvent être vides');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Point d'entrée
if (require.main === module) {
  importHeroes();
}

module.exports = { importHeroes };