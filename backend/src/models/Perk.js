const mongoose = require('mongoose');

const perkSchema = new mongoose.Schema({
  // Slug: URL-friendly identifier
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
    enum: ['t1', 't2', 't3', 't5'], // t4 removed
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
  
  // Fields required only for T3/T5 perks
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

  // Removed: tags
});

// Compound index for T1/T2
perkSchema.index({ name: 1, class: 1, tier: 1 }, { 
  unique: true,
  partialFilterExpression: { tier: { $in: ['t1', 't2'] } }
});

// Compound index for T3/T5
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

// Indexes for common queries
perkSchema.index({ tier: 1, class: 1 });
perkSchema.index({ heroSlug: 1, tier: 1 });
perkSchema.index({ tier: 1, type: 1 });

// Method to format for API responses
perkSchema.methods.toAPIFormat = function() {
  return {
    _id: this._id,
    slug: this.slug,
    name: this.name,
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
