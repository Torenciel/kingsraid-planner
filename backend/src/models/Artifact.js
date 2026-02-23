const mongoose = require('mongoose');

const ArtifactSchema = new mongoose.Schema({
  // Slug: URL-friendly identifier
  slug: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  
  // Name: Display name
  name: { 
    type: String, 
    required: true,
    index: true 
  },
  
  description: { 
    type: String, 
    required: true 
  },
  
  // Values per star level (0-5)
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

// Middleware to update updatedAt before saving
ArtifactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Text search index
ArtifactSchema.index({ name: 'text', description: 'text' });

// Utility method to format values based on star level
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

// Method to format for API responses
ArtifactSchema.methods.toAPIFormat = function() {
  return {
    _id: this._id,
    slug: this.slug,
    name: this.name,
    description: this.description,
    thumbnail: this.thumbnail,
    value: this.value,
    releaseOrder: this.releaseOrder
  };
};

const Artifact = mongoose.model('Artifact', ArtifactSchema);

module.exports = Artifact;
