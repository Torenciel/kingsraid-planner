const mongoose = require('mongoose');

const ArtifactSchema = new mongoose.Schema({
  // 🔥 SLUG : Identifiant URL-friendly
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
  
  // Valeurs par étoile (0-5)
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

// Middleware pour mettre à jour updatedAt
ArtifactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index pour recherche textuelle
ArtifactSchema.index({ name: 'text', description: 'text' });

// Méthode utilitaire pour formater les valeurs
ArtifactSchema.methods.getFormattedValues = function(starLevel = 0) {
  const formatted = {};
  
  if (!this.value) return formatted;
  
  Object.entries(this.value).forEach(([key, valueString]) => {
    if (typeof valueString === 'string') {
      const values = valueString.split(',').map(v => v.trim());
      if (values.length === 6 && starLevel >= 0 && starLevel <= 5) {
        formatted[key] = values[starLevel];
      } else {
        formatted[key] = valueString;
      }
    }
  });
  
  return formatted;
};

// Méthode pour formater pour l'API
ArtifactSchema.methods.toAPIFormat = function() {
  return {
    _id: this._id,           // 🔥 ObjectId MongoDB
    slug: this.slug,         // 🔥 Slug URL-friendly
    name: this.name,         // 🔥 Nom d'affichage
    description: this.description,
    thumbnail: this.thumbnail,
    value: this.value,
    releaseOrder: this.releaseOrder
  };
};

const Artifact = mongoose.model('Artifact', ArtifactSchema);

module.exports = Artifact;