const mongoose = require('mongoose');

const GearSetSchema = new mongoose.Schema({
  slug: { 
    type: String, 
    required: true,
    unique: true,
    index: true 
  },
  
  name: { 
    type: String, 
    required: true,
    index: true 
  },
  
  thumbnail: { 
    type: String, 
    required: true 
  },
  
  bonus2P: { 
    type: String, 
    required: true 
  },
  
  bonus4P: { 
    type: String, 
    required: true 
  },
  
  sortOrder: { 
    type: Number, 
    default: 999,
    index: true 
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

// Middleware
GearSetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes (seulement ceux-ci)
GearSetSchema.index({ name: 'text' });

// Méthode API
GearSetSchema.methods.toAPIFormat = function() {
  return {
    _id: this._id,
    slug: this.slug,
    name: this.name,
    thumbnail: this.thumbnail,
    bonus2P: this.bonus2P,
    bonus4P: this.bonus4P,
    sortOrder: this.sortOrder
  };
};

const GearSet = mongoose.model('GearSet', GearSetSchema);

module.exports = GearSet;