const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Perk = require('../src/models/Perk');
const Hero = require('../src/models/Hero');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Function to create a clean slug
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
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kingsraid', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    await Perk.deleteMany({
      tier: { $in: ['t3', 't5'] }
    });
    
    const heroes = await Hero.find({}).select('slug infos.name infos.class perks').lean();
    
    let importedCount = 0;
    let errorCount = 0;
    const warnings = [];
    const slugs = new Set();
    
    for (const hero of heroes) {
      const heroName = hero.infos?.name || 'Unknown Hero';
      const heroClass = hero.infos?.class || 'Unknown';
      const heroSlug = hero.slug || createSlug(heroName);
      
      try {
        if (!hero.perks) {
          warnings.push({ hero: heroName, warning: 'Missing perks data' });
          continue;
        }
        
        const heroPerks = [];
        
        // T3 Perks
        if (hero.perks.t3 && typeof hero.perks.t3 === 'object') {
          const t3Perks = hero.perks.t3;
          const validKeys = Object.keys(t3Perks).filter(key => 
            !key.startsWith('$') && ['1', '2', '3', '4'].includes(key)
          );
          
          for (const skillKey of validKeys) {
            const skillPerks = t3Perks[skillKey];
            if (!skillPerks) continue;
            
            const skillIndex = parseInt(skillKey);
            
            if (skillPerks.light && skillPerks.light.effect) {
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
              });
              
              heroPerks.push(perk.save());
            }
            
            if (skillPerks.dark && skillPerks.dark.effect) {
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
              });
              
              heroPerks.push(perk.save());
            }
          }
        }
        
        // T5 Perks
        if (hero.perks.t5) {
          if (hero.perks.t5.light && hero.perks.t5.light.effect) {
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
            });
            heroPerks.push(perk.save());
          }
          
          if (hero.perks.t5.dark && hero.perks.t5.dark.effect) {
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
            });
            heroPerks.push(perk.save());
          }
        }
        
        if (heroPerks.length > 0) {
          await Promise.all(heroPerks);
          importedCount += heroPerks.length;
        }
        
      } catch (error) {
        errorCount++;
        console.error(`Error with ${heroName}:`, error.message);
      }
    }
    
    const totalInDB = await Perk.countDocuments({ tier: { $in: ['t3', 't5'] } });
    console.log(`Import completed. ${totalInDB} perks imported, ${errorCount} errors.`);
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  importHeroPerks();
}

module.exports = { importHeroPerks, createSlug };