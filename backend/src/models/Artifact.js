const mongoose = require('mongoose');

// Schéma flexible pour les valeurs d'artifact
// Certains artifacts n'ont qu'un seul attribut (value.0), d'autres en ont plusieurs
const ArtifactValueSchema = new mongoose.Schema({}, { 
  _id: false,
  strict: false // Permettre n'importe quelle structure (0, 1, 2, 3...)
});

// Schéma principal Artifact (flexible)
const ArtifactSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true,
    index: true 
  },
  
  description: { 
    type: String, 
    required: true 
  },
  
  // Valeurs par niveau (peut avoir 0, 1, 2, 3...)
  value: {
    type: ArtifactValueSchema,
    required: true,
    default: () => ({}) // Valeur par défaut vide
  },
  
  thumbnail: { 
    type: String, 
    required: true 
  },
  
  story: { 
    type: String, 
    required: true 
  },
  
  aliases: { 
    type: [String], 
    default: null 
  },
  
  releaseOrder: { 
    type: Number, 
    index: true,
    default: 999 
  },
  
  // Type/catégorie
  category: {
    type: String,
    enum: [
      'stat_boost',
      'defense',
      'offense',
      'support',
      'healing',
      'cc',
      'utility',
      'special',
      'unknown'
    ],
    default: 'unknown'
  },
  
  tags: [{
    type: String,
    enum: [
      'pve', 'pvp', 'raid', 'worldboss', 'guild',
      'beginner', 'advanced', 'meta', 'seasonal', 'limited'
    ]
  }],
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  strict: false // Permettre des champs supplémentaires
});

// Middleware
ArtifactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Déterminer automatiquement la catégorie basée sur la description
  if (this.description) {
    const desc = this.description.toLowerCase();
    
    if (desc.includes('hp') || desc.includes('health')) {
      this.category = 'defense';
    } else if (desc.includes('atk') || desc.includes('attack') || desc.includes('dmg')) {
      this.category = 'offense';
    } else if (desc.includes('def') || desc.includes('defense') || desc.includes('protection')) {
      this.category = 'defense';
    } else if (desc.includes('crit')) {
      this.category = 'offense';
    } else if (desc.includes('mana') || desc.includes('mp')) {
      this.category = 'utility';
    } else if (desc.includes('cc') || desc.includes('stun') || desc.includes('freeze')) {
      this.category = 'cc';
    } else if (desc.includes('heal') || desc.includes('recovery')) {
      this.category = 'healing';
    } else if (desc.includes('ally') || desc.includes('allies') || desc.includes('team')) {
      this.category = 'support';
    }
  }
  
  // Normaliser les chemins de thumbnail
  if (this.thumbnail && !this.thumbnail.startsWith('artifacts/')) {
    // Extraire le nom de fichier
    const filename = this.thumbnail.split('/').pop() || this.thumbnail;
    this.thumbnail = `artifacts/${filename}`;
  }
  
  next();
});

// Indexes
ArtifactSchema.index({ name: 'text', description: 'text' });
ArtifactSchema.index({ category: 1, releaseOrder: 1 });
ArtifactSchema.index({ tags: 1 });

// Méthode pour parser les valeurs
ArtifactSchema.methods.getValuesByStar = function(starLevel) {
  if (starLevel < 0 || starLevel > 5) {
    throw new Error('Star level must be between 0 and 5');
  }
  
  const result = {};
  
  // Pour chaque propriété dans value (0, 1, 2, 3, etc.)
  for (const key in this.value) {
    if (this.value[key] && typeof this.value[key] === 'string') {
      const values = this.value[key].split(', ');
      if (values.length === 6) { // 0-5 stars
        result[key] = values[starLevel];
      } else {
        result[key] = this.value[key]; // Garder la valeur originale
      }
    }
  }
  
  return result;
};

// Méthode pour obtenir tous les niveaux
ArtifactSchema.methods.getAllValues = function() {
  const result = { stars: {} };
  
  // Générer pour chaque niveau 0-5
  for (let star = 0; star <= 5; star++) {
    result.stars[star] = this.getValuesByStar(star);
  }
  
  // Ajouter les informations de base
  result.name = this.name;
  result.description = this.description;
  result.category = this.category;
  result.thumbnail = this.thumbnail;
  
  return result;
};

// Méthode pour formater pour le frontend
ArtifactSchema.methods.toSimpleJSON = function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    thumbnail: this.thumbnail,
    releaseOrder: this.releaseOrder,
    category: this.category,
    tags: this.tags,
    hasMultipleStats: Object.keys(this.value).length > 1
  };
};

const Artifact = mongoose.model('Artifact', ArtifactSchema);

module.exports = Artifact;