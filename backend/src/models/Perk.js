// src/models/Perk.js
const mongoose = require('mongoose');

const perkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  tier: {
    type: String,
    enum: ['t1', 't2', 't3', 't4', 't5'],
    required: true
  },
  class: {
    type: String,
    enum: [
      'General', 'Knight', 'Warrior', 'Assassin',
      'Archer', 'Wizard', 'Priest', 'Mechanic'
    ],
    required: true
  },
  // Nouveaux champs pour T3/T5
  heroSlug: {
    type: String,
    required: function() { 
      return this.tier === 't3' || this.tier === 't5'; 
    }
  },
  heroName: {
    type: String,
    required: function() { 
      return this.tier === 't3' || this.tier === 't5'; 
    }
  },
  skillIndex: {
    type: Number,
    min: 1,
    max: 4,
    required: function() { 
      return this.tier === 't3'; 
    }
  },
  type: {
    type: String,
    enum: ['light', 'dark'],
    required: function() { 
      return this.tier === 't3' || this.tier === 't5'; 
    }
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  tags: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index composé pour T1/T2 (nom+classe+tier)
// Cela permet d'avoir la même perk T2 dans différentes classes
perkSchema.index({ name: 1, class: 1, tier: 1 }, { 
  unique: true,
  partialFilterExpression: { tier: { $in: ['t1', 't2'] } }
});

// Index composé pour T3/T5 (nom+héro+skill+type)
// Cela permet d'avoir des noms similaires pour différents héros
perkSchema.index({ 
  name: 1, 
  heroSlug: 1, 
  tier: 1,
  skillIndex: 1,
  type: 1 
}, { 
  unique: true,
  partialFilterExpression: { tier: { $in: ['t3', 't5'] } }
});

// Index pour les recherches courantes
perkSchema.index({ tier: 1, class: 1 });
perkSchema.index({ heroSlug: 1, tier: 1 });
perkSchema.index({ tier: 1, type: 1 });
perkSchema.index({ tags: 1 });

module.exports = mongoose.model('Perk', perkSchema);