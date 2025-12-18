const mongoose = require('mongoose');

const GearSetSchema = new mongoose.Schema({
  // ID unique (comme "black_dragon", "fire_dragon")
  id: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    index: true 
  },
  
  name: { 
    type: String, 
    required: true,
    index: true 
  },
  
  image: { 
    type: String, 
    required: true 
  },
  
  // Bonus 2 pièces
  bonus2P: { 
    type: String, 
    required: true 
  },
  
  // Bonus 4 pièces
  bonus4P: { 
    type: String, 
    required: true 
  },
  
  // Type/catégorie
  type: {
    type: String,
    enum: [
      'dragon',          // Black Dragon, Fire Dragon, etc.
      'pvp',             // Hero Suppression/Protection
      'raid',            // Beast of Chaos, Dark Legion
      'stat',            // Lava Gear (crit damage)
      'special',         // Autres
      'unknown'
    ],
    default: 'unknown',
    index: true
  },
  
  // Stat principale (pour tri/filtrage)
  mainStat: {
    type: String,
    enum: [
      'atk',
      'def',
      'hp',
      'crit',
      'crit_damage',
      'mp_recovery',
      'crit_resistance',
      'boss_damage',
      'hero_damage',
      'damage_reduction',
      'all_damage',
      null
    ],
    default: null
  },
  
  // Recommandé pour
  recommendedFor: [{
    type: String,
    enum: [
      'dps',
      'tank',
      'healer',
      'support',
      'pvp',
      'pve',
      'raid',
      'worldboss',
      'general'
    ]
  }],
  
  // Ordre de tri (personnalisable)
  sortOrder: { 
    type: Number, 
    default: 999 
  },
  
  // Métadonnées
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Middleware pour updatedAt
GearSetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Déterminer automatiquement le type et mainStat
GearSetSchema.pre('save', function(next) {
  // Déterminer le type basé sur le nom
  const nameLower = this.name.toLowerCase();
  
  if (nameLower.includes('dragon')) {
    this.type = 'dragon';
  } else if (nameLower.includes('hero')) {
    this.type = 'pvp';
  } else if (nameLower.includes('beast') || nameLower.includes('legion')) {
    this.type = 'raid';
  } else if (nameLower.includes('lava')) {
    this.type = 'stat';
  }
  
  // Déterminer la stat principale basé sur le bonus
  if (this.bonus2P.includes('Crit DMG')) {
    this.mainStat = 'crit_damage';
  } else if (this.bonus2P.includes('MP Recovery')) {
    this.mainStat = 'mp_recovery';
  } else if (this.bonus2P.includes('Crit')) {
    this.mainStat = 'crit';
  } else if (this.bonus2P.includes('HP')) {
    this.mainStat = 'hp';
  } else if (this.bonus2P.includes('Crit Resistance')) {
    this.mainStat = 'crit_resistance';
  } else if (this.bonus2P.includes('DMG to bosses')) {
    this.mainStat = 'boss_damage';
  } else if (this.bonus2P.includes('DMG to Heroes')) {
    this.mainStat = 'hero_damage';
  } else if (this.bonus2P.includes('DMG received')) {
    this.mainStat = 'damage_reduction';
  }
  
  next();
});

// Indexes
GearSetSchema.index({ name: 'text' });
GearSetSchema.index({ type: 1, mainStat: 1 });

// Méthode pour formater pour le frontend
GearSetSchema.methods.toSimpleJSON = function() {
  return {
    id: this.id,
    name: this.name,
    image: this.image,
    bonus2P: this.bonus2P,
    bonus4P: this.bonus4P,
    type: this.type,
    mainStat: this.mainStat
  };
};

const GearSet = mongoose.model('GearSet', GearSetSchema);

module.exports = GearSet;