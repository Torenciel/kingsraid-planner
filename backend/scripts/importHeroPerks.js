const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Perk = require('../src/models/Perk');
const Hero = require('../src/models/Hero');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function importHeroPerks() {
  try {
    console.log('='.repeat(60));
    console.log('🚀 IMPORTATION PERKS HÉROS (T3 & T5)');
    console.log('='.repeat(60));
    
    // Connexion MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kingsraid');
    console.log('✅ MongoDB connecté');
    
    // Vider les anciennes perks T3/T5
    console.log('\n🗑️  Suppression des anciennes perks T3/T5...');
    const deleteResult = await Perk.deleteMany({
      tier: { $in: ['t3', 't5'] }
    });
    console.log(`✅ ${deleteResult.deletedCount} anciennes perks supprimées`);
    
    // Récupérer tous les héros en tant qu'objets simples
    console.log('\n📥 Récupération des héros...');
    const heroes = await Hero.find({}).select('slug infos.name infos.class perks').lean();
    
    console.log(`📄 ${heroes.length} héros à traiter`);
    
    let importedCount = 0;
    let errorCount = 0;
    const errors = [];
    let t3Count = 0;
    let t5Count = 0;
    let heroesWithPerks = 0;
    let heroesWithoutPerks = 0;
    
    // Pour chaque héros, extraire les perks T3 et T5
    for (const hero of heroes) {
      const heroName = hero.infos?.name || 'Unknown Hero';
      const heroClass = hero.infos?.class || 'Unknown';
      const heroSlug = hero.slug || heroName.toLowerCase().replace(/\s+/g, '-');
      
      try {
        // Vérifier si le héros a des perks
        if (!hero.perks) {
          console.log(`⚠️  ${heroName}: Pas de données perks`);
          heroesWithoutPerks++;
          continue;
        }
        
        const heroPerks = [];
        
        // T3 Perks (skills 1-4, light/dark)
        if (hero.perks.t3 && typeof hero.perks.t3 === 'object') {
          // Convertir en objet simple si nécessaire et filtrer les clés internes
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
              const perk = new Perk({
                name: `${heroName} - T3 S${skillIndex} Light`,
                description: skillPerks.light.effect,
                thumbnail: skillPerks.light.thumbnail || 'default_t3_light.png',
                tier: 't3',
                class: heroClass,
                heroSlug: heroSlug,
                heroName: heroName,
                skillIndex: skillIndex,
                type: 'light',
                displayOrder: (skillIndex * 10) + 1,
                tags: [
                  't3', 'hero', 
                  heroClass.toLowerCase(), 
                  `skill-${skillIndex}`, 
                  'light',
                  heroSlug
                ].filter(Boolean)
              });
              
              heroPerks.push(perk.save());
              t3Count++;
            }
            
            // Dark perk
            if (skillPerks.dark && skillPerks.dark.effect) {
              const perk = new Perk({
                name: `${heroName} - T3 S${skillIndex} Dark`,
                description: skillPerks.dark.effect,
                thumbnail: skillPerks.dark.thumbnail || 'default_t3_dark.png',
                tier: 't3',
                class: heroClass,
                heroSlug: heroSlug,
                heroName: heroName,
                skillIndex: skillIndex,
                type: 'dark',
                displayOrder: (skillIndex * 10) + 2,
                tags: [
                  't3', 'hero',
                  heroClass.toLowerCase(),
                  `skill-${skillIndex}`,
                  'dark',
                  heroSlug
                ].filter(Boolean)
              });
              
              heroPerks.push(perk.save());
              t3Count++;
            }
          }
        }
        
        // T5 Perks
        if (hero.perks.t5) {
          // Light
          if (hero.perks.t5.light && hero.perks.t5.light.effect) {
            const perk = new Perk({
              name: `${heroName} - T5 Light`,
              description: hero.perks.t5.light.effect,
              thumbnail: hero.perks.t5.light.thumbnail || 'default_t5_light.png',
              tier: 't5',
              class: heroClass,
              heroSlug: heroSlug,
              heroName: heroName,
              type: 'light',
              displayOrder: 51,
              tags: [
                't5', 'hero',
                heroClass.toLowerCase(),
                'light',
                heroSlug
              ].filter(Boolean)
            });
            heroPerks.push(perk.save());
            t5Count++;
          }
          
          // Dark
          if (hero.perks.t5.dark && hero.perks.t5.dark.effect) {
            const perk = new Perk({
              name: `${heroName} - T5 Dark`,
              description: hero.perks.t5.dark.effect,
              thumbnail: hero.perks.t5.dark.thumbnail || 'default_t5_dark.png',
              tier: 't5',
              class: heroClass,
              heroSlug: heroSlug,
              heroName: heroName,
              type: 'dark',
              displayOrder: 52,
              tags: [
                't5', 'hero',
                heroClass.toLowerCase(),
                'dark',
                heroSlug
              ].filter(Boolean)
            });
            heroPerks.push(perk.save());
            t5Count++;
          }
        }
        
        // Sauvegarder toutes les perks de ce héros
        if (heroPerks.length > 0) {
          await Promise.all(heroPerks);
          importedCount += heroPerks.length;
          heroesWithPerks++;
          
          // Afficher une progression
          if (heroesWithPerks % 10 === 0) {
            console.log(`✅ ${heroesWithPerks} héros traités...`);
          }
        } else {
          heroesWithoutPerks++;
        }
        
      } catch (error) {
        errorCount++;
        errors.push({ hero: heroName, error: error.message });
        console.error(`❌ Erreur avec ${heroName}:`, error.message);
      }
    }
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ IMPORTATION PERKS HÉROS');
    console.log('='.repeat(60));
    
    const totalInDB = await Perk.countDocuments({ tier: { $in: ['t3', 't5'] } });
    const dbT3Count = await Perk.countDocuments({ tier: 't3' });
    const dbT5Count = await Perk.countDocuments({ tier: 't5' });
    
    console.log(`✅ ${totalInDB} perks T3/T5 importées`);
    console.log(`❌ ${errorCount} erreurs`);
    
    // Statistiques
    console.log('\n📈 Statistiques:');
    console.log(`   • T3 perks: ${dbT3Count}`);
    console.log(`   • T5 perks: ${dbT5Count}`);
    console.log(`   • Héros avec perks: ${heroesWithPerks}`);
    console.log(`   • Héros sans perks: ${heroesWithoutPerks}`);
    
    // Répartition par type (light/dark)
    const t3Light = await Perk.countDocuments({ tier: 't3', type: 'light' });
    const t3Dark = await Perk.countDocuments({ tier: 't3', type: 'dark' });
    const t5Light = await Perk.countDocuments({ tier: 't5', type: 'light' });
    const t5Dark = await Perk.countDocuments({ tier: 't5', type: 'dark' });
    
    console.log('\n🎨 Répartition light/dark:');
    console.log(`   • T3 Light: ${t3Light}, Dark: ${t3Dark}`);
    console.log(`   • T5 Light: ${t5Light}, Dark: ${t5Dark}`);
    
    // Répartition par classe
    console.log('\n🏷️  Répartition par classe:');
    const byClass = await Perk.aggregate([
      { $match: { tier: { $in: ['t3', 't5'] } } },
      { $group: { _id: '$class', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    byClass.forEach(item => {
      console.log(`   • ${item._id}: ${item.count}`);
    });
    
    
    // Vérifier le total attendu
    const expectedPerks = heroesWithPerks * 10; // 8 T3 + 2 T5 par héros
    console.log(`\n🎯 Total attendu: ~${expectedPerks} perks (${heroesWithPerks} héros × ~10 perks)`);
    console.log(`🎯 Total importé: ${totalInDB} perks (${((totalInDB/expectedPerks)*100).toFixed(1)}%)`);
    
    if (totalInDB < expectedPerks * 0.9) {
      console.warn(`⚠️  Attention: Seulement ${((totalInDB/expectedPerks)*100).toFixed(1)}% des perks attendues`);
      console.warn(`   Certains héros peuvent avoir moins de 10 perks.`);
    }
    
    // Exemples
    console.log('\n🔍 Exemples de perks importées:');
    const t3Samples = await Perk.find({ tier: 't3' }).limit(2).select('name description');
    const t5Samples = await Perk.find({ tier: 't5' }).limit(2).select('name description');
    
    if (t3Samples.length > 0) {
      console.log('T3 Examples:');
      t3Samples.forEach(perk => {
        console.log(`   • ${perk.name}: ${perk.description.substring(0, 60)}...`);
      });
    }
    
    if (t5Samples.length > 0) {
      console.log('T5 Examples:');
      t5Samples.forEach(perk => {
        console.log(`   • ${perk.name}: ${perk.description.substring(0, 60)}...`);
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

module.exports = { importHeroPerks };