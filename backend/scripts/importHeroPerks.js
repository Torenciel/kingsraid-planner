const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Perk = require('../src/models/Perk');
const Hero = require('../src/models/Hero');
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
    .replace(/'/g, '')
    .replace(/--+/g, '-')
    .trim();
}

async function importHeroPerks() {
  try {
    console.log('='.repeat(60));
    console.log('🚀 IMPORTATION PERKS HÉROS (T3 & T5) SANS TAGS');
    console.log('='.repeat(60));
    
    // Connexion MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kingsraid', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connecté');
    
    // Vider les anciennes perks T3/T5
    console.log('\n🗑️  Suppression des anciennes perks T3/T5...');
    const deleteResult = await Perk.deleteMany({
      tier: { $in: ['t3', 't5'] }
    });
    console.log(`✅ ${deleteResult.deletedCount} anciennes perks supprimées`);
    
    // Récupérer tous les héros
    console.log('\n📥 Récupération des héros...');
    const heroes = await Hero.find({}).select('slug infos.name infos.class perks').lean();
    
    console.log(`📄 ${heroes.length} héros à traiter`);
    
    let importedCount = 0;
    let errorCount = 0;
    const warnings = [];
    const slugs = new Set();
    
    // Pour chaque héros, extraire les perks T3 et T5
    for (const hero of heroes) {
      const heroName = hero.infos?.name || 'Unknown Hero';
      const heroClass = hero.infos?.class || 'Unknown';
      const heroSlug = hero.slug || createSlug(heroName);
      
      try {
        // Vérifier si le héros a des perks
        if (!hero.perks) {
          warnings.push({ hero: heroName, warning: 'Pas de données perks' });
          continue;
        }
        
        const heroPerks = [];
        
        // T3 Perks (skills 1-4, light/dark)
        if (hero.perks.t3 && typeof hero.perks.t3 === 'object') {
          const t3Perks = hero.perks.t3;
          const validKeys = Object.keys(t3Perks).filter(key => 
            !key.startsWith('$') && ['1', '2', '3', '4'].includes(key)
          );
          
          for (const skillKey of validKeys) {
            const skillPerks = t3Perks[skillKey];
            if (!skillPerks) continue;
            
            const skillIndex = parseInt(skillKey);
            
            // Light perk
            if (skillPerks.light && skillPerks.light.effect) {
              // Créer un slug unique
              const baseSlug = createSlug(`${heroName}-t3-s${skillIndex}-light`);
              let slug = baseSlug;
              let counter = 1;
              while (slugs.has(slug)) {
                slug = `${baseSlug}-${counter}`;
                counter++;
              }
              slugs.add(slug);
              
              const perk = new Perk({
                slug: slug,
                name: `${heroName} - T3 S${skillIndex} Light`,
                description: skillPerks.light.effect,
                thumbnail: skillPerks.light.thumbnail || 'default_t3_light.png',
                tier: 't3',
                class: heroClass,
                heroSlug: heroSlug,
                heroName: heroName,
                skillIndex: skillIndex,
                type: 'light',
                displayOrder: (skillIndex * 10) + 1
                // ❌ SUPPRIMÉ: tags
              });
              
              heroPerks.push(perk.save());
            }
            
            // Dark perk
            if (skillPerks.dark && skillPerks.dark.effect) {
              // Créer un slug unique
              const baseSlug = createSlug(`${heroName}-t3-s${skillIndex}-dark`);
              let slug = baseSlug;
              let counter = 1;
              while (slugs.has(slug)) {
                slug = `${baseSlug}-${counter}`;
                counter++;
              }
              slugs.add(slug);
              
              const perk = new Perk({
                slug: slug,
                name: `${heroName} - T3 S${skillIndex} Dark`,
                description: skillPerks.dark.effect,
                thumbnail: skillPerks.dark.thumbnail || 'default_t3_dark.png',
                tier: 't3',
                class: heroClass,
                heroSlug: heroSlug,
                heroName: heroName,
                skillIndex: skillIndex,
                type: 'dark',
                displayOrder: (skillIndex * 10) + 2
                // ❌ SUPPRIMÉ: tags
              });
              
              heroPerks.push(perk.save());
            }
          }
        }
        
        // T5 Perks
        if (hero.perks.t5) {
          // Light
          if (hero.perks.t5.light && hero.perks.t5.light.effect) {
            // Créer un slug unique
            const baseSlug = createSlug(`${heroName}-t5-light`);
            let slug = baseSlug;
            let counter = 1;
            while (slugs.has(slug)) {
              slug = `${baseSlug}-${counter}`;
              counter++;
            }
            slugs.add(slug);
            
            const perk = new Perk({
              slug: slug,
              name: `${heroName} - T5 Light`,
              description: hero.perks.t5.light.effect,
              thumbnail: hero.perks.t5.light.thumbnail || 'default_t5_light.png',
              tier: 't5',
              class: heroClass,
              heroSlug: heroSlug,
              heroName: heroName,
              type: 'light',
              displayOrder: 51
              // ❌ SUPPRIMÉ: tags
            });
            heroPerks.push(perk.save());
          }
          
          // Dark
          if (hero.perks.t5.dark && hero.perks.t5.dark.effect) {
            // Créer un slug unique
            const baseSlug = createSlug(`${heroName}-t5-dark`);
            let slug = baseSlug;
            let counter = 1;
            while (slugs.has(slug)) {
              slug = `${baseSlug}-${counter}`;
              counter++;
            }
            slugs.add(slug);
            
            const perk = new Perk({
              slug: slug,
              name: `${heroName} - T5 Dark`,
              description: hero.perks.t5.dark.effect,
              thumbnail: hero.perks.t5.dark.thumbnail || 'default_t5_dark.png',
              tier: 't5',
              class: heroClass,
              heroSlug: heroSlug,
              heroName: heroName,
              type: 'dark',
              displayOrder: 52
              // ❌ SUPPRIMÉ: tags
            });
            heroPerks.push(perk.save());
          }
        }
        
        // Sauvegarder toutes les perks de ce héros
        if (heroPerks.length > 0) {
          await Promise.all(heroPerks);
          importedCount += heroPerks.length;
          
          // Afficher une progression
          if (importedCount % 20 === 0) {
            console.log(`✅ ${importedCount} perks importées...`);
          }
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Erreur avec ${heroName}:`, error.message);
      }
    }
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ IMPORTATION PERKS HÉROS');
    console.log('='.repeat(60));
    
    const totalInDB = await Perk.countDocuments({ tier: { $in: ['t3', 't5'] } });
    console.log(`✅ ${totalInDB} perks T3/T5 importées avec succès`);
    console.log(`❌ ${errorCount} erreurs`);
    console.log(`⚠️  ${warnings.length} avertissements`);
    console.log(`🔤 Slugs uniques: ${slugs.size}`);
    
    // Statistiques
    console.log('\n📈 Statistiques:');
    
    const t3Count = await Perk.countDocuments({ tier: 't3' });
    const t5Count = await Perk.countDocuments({ tier: 't5' });
    
    console.log(`   • T3 perks: ${t3Count}`);
    console.log(`   • T5 perks: ${t5Count}`);
    
    // Exemples
    console.log('\n🔍 Exemples de perks importées:');
    const t3Samples = await Perk.find({ tier: 't3' }).limit(2).select('slug name');
    const t5Samples = await Perk.find({ tier: 't5' }).limit(2).select('slug name');
    
    if (t3Samples.length > 0) {
      console.log('T3 Examples:');
      t3Samples.forEach(perk => {
        console.log(`   • ${perk.name} (slug: ${perk.slug})`);
      });
    }
    
    if (t5Samples.length > 0) {
      console.log('T5 Examples:');
      t5Samples.forEach(perk => {
        console.log(`   • ${perk.name} (slug: ${perk.slug})`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB');
    console.log('🎉 IMPORTATION PERKS HÉROS TERMINÉE !');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  importHeroPerks();
}

module.exports = { importHeroPerks, createSlug };