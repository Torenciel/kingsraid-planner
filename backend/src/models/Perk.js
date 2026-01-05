const mongoose = require('mongoose');

const perkSchema = new mongoose.Schema({
  //  SLUG : Identifiant URL-friendly
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
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
    enum: ['t1', 't2', 't3', 't5'], // ❌ Supprimé t4
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
  
  // Champs pour T3/T5 seulement
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
  
  createdAt: {
    type: Date,
    default: Date.now
  }
  
  //  SUPPRIMÉ: tags
});

// Index composé pour T1/T2
perkSchema.index({ name: 1, class: 1, tier: 1 }, { 
  unique: true,
  partialFilterExpression: { tier: { $in: ['t1', 't2'] } }
});

// Index composé pour T3/T5
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

// Méthode pour formater pour l'API
perkSchema.methods.toAPIFormat = function() {
  return {
    _id: this._id,           //  ObjectId MongoDB
    slug: this.slug,         //  Slug URL-friendly
    name: this.name,         //  Nom d'affichage
    description: this.description,
    thumbnail: this.thumbnail,
    tier: this.tier,
    class: this.class,
    heroSlug: this.heroSlug,
    heroName: this.heroName,
    skillIndex: this.skillIndex,
    type: this.type,
    displayOrder: this.displayOrder
  };
};

const Perk = mongoose.model('Perk', perkSchema);

module.exports = Perk;