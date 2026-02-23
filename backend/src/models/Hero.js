const mongoose = require('mongoose');

// Common slug generator function
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

// === Nested Schemas ===

const SkillSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  cost: { type: String, default: null },
  cooldown: { type: String, default: null },
  description: { type: String, default: '' },
  thumbnail: { type: String, default: '' }
}, { _id: false });

const BookSchema = new mongoose.Schema({
  II: { type: String, default: '' },
  III: { type: String, default: '' },
  IV: { type: String, default: '' }
}, { _id: false });

const PerkOptionSchema = new mongoose.Schema({
  effect: { type: String, default: '' },
  thumbnail: { type: String, default: '' }
}, { _id: false });

const T3PerkSchema = new mongoose.Schema({
  light: { type: PerkOptionSchema, default: () => ({}) },
  dark: { type: PerkOptionSchema, default: () => ({}) }
}, { _id: false });

// Flexible schema for UW values
const UWValueLevelSchema = new mongoose.Schema({}, { 
  _id: false,
  strict: false
});

const UWSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  value: { type: Map, of: UWValueLevelSchema, default: () => new Map() },
  thumbnail: { type: String, default: '' },
  story: { type: String, default: '' }
}, { _id: false });

const UTValueSchema = new mongoose.Schema({}, {
  _id: false,
  strict: false
});

const UTSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  value: { type: UTValueSchema, default: () => ({}) },
  thumbnail: { type: String, default: '' },
  story: { type: String, default: '' }
}, { _id: false });

const SWSchema = new mongoose.Schema({
  requirement: { type: String, default: '' },
  description: { type: String, default: '' },
  cooldown: { type: String, default: '' },
  uses: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  advancement: {
    "1": { type: String, default: '' },
    "2": { type: String, default: '' }
  },
  story: { type: String, default: '' }
}, { _id: false });

// === Main Hero Schema ===

const HeroSchema = new mongoose.Schema({
  infos: {
    name: { type: String, required: true, index: true },
    title: { type: String, default: '' },
    class: { type: String, default: 'Unknown', index: true },
    position: { type: String, default: 'Unknown', index: true },
    attack_range: { type: String, default: '' },
    damage_type: { type: String, default: '' },
    gender: { type: String, default: '' },
    age: { type: String, default: '' },
    height: { type: String, default: '' },
    race: { type: String, default: '' },
    constellation: { type: String, default: '' },
    birth_month: { type: String, default: '' },
    like: { type: String, default: '' },
    dislike: { type: String, default: '' },
    story: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    story_: { type: String, default: '' }
  },
  
  skills: {
    type: Map,
    of: SkillSchema,
    default: () => new Map()
  },
  
  books: {
    type: Map,
    of: BookSchema,
    default: () => new Map()
  },
  
  perks: {
    t3: {
      type: Map,
      of: T3PerkSchema,
      default: () => new Map()
    },
    t5: {
      light: { type: PerkOptionSchema, default: () => ({}) },
      dark: { type: PerkOptionSchema, default: () => ({}) }
    }
  },
  
  uw: { type: UWSchema, default: () => ({}) },
  
  uts: {
    type: Map,
    of: UTSchema,
    default: () => new Map()
  },
  
  sw: { type: SWSchema, default: () => ({}) },
  
  splashart: { type: String, default: '' },
  costumes: { type: String, default: '' },
  visual: { type: String, default: null },
  aliases: { type: [String], default: null },
  
  // Metadata
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    lowercase: true 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  sourceFile: { type: String, required: true },
  
  releaseOrder: { type: Number, default: -1 },
  hasImage: { type: Boolean, default: true }
}, {
  strict: false
});

// === Middleware ===

HeroSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Ensure slug exists
  if (!this.slug && this.infos?.name) {
    this.slug = createSlug(this.infos.name);
  }
  
  // Normalize only image paths
  const normalizeImagePath = (imagePath) => {
    if (!imagePath) return '';
    
    if (imagePath.startsWith('heroes/')) {
      return imagePath;
    }
    
    const heroName = this.infos?.name || 'unknown';
    return `heroes/${heroName}/${imagePath}`;
  };
  
  // Normalize actual image fields only
  
  if (this.infos?.thumbnail) {
    this.infos.thumbnail = normalizeImagePath(this.infos.thumbnail);
  }
  
  if (this.skills && this.skills instanceof Map) {
    for (const [key, skill] of this.skills) {
      if (skill?.thumbnail) {
        skill.thumbnail = normalizeImagePath(skill.thumbnail);
      }
    }
  }
  
  if (this.uw?.thumbnail) {
    this.uw.thumbnail = normalizeImagePath(this.uw.thumbnail);
  }
  
  if (this.uts && this.uts instanceof Map) {
    for (const [key, ut] of this.uts) {
      if (ut?.thumbnail) {
        ut.thumbnail = normalizeImagePath(ut.thumbnail);
      }
    }
  }
  
  if (this.sw?.thumbnail) {
    this.sw.thumbnail = normalizeImagePath(this.sw.thumbnail);
  }
  
  if (this.splashart) {
    this.splashart = normalizeImagePath(this.splashart);
  }
  
  if (this.costumes) {
    this.costumes = normalizeImagePath(this.costumes);
  }
  
  next();
});

// === API Methods ===

HeroSchema.methods.toAPIFormat = function() {
  return {
    _id: this._id,
    slug: this.slug,
    name: this.infos?.name || '',
    title: this.infos?.title || '',
    class: this.infos?.class || 'Unknown',
    position: this.infos?.position || 'Unknown',
    thumbnail: this.infos?.thumbnail || '',
    releaseOrder: this.releaseOrder || 999,
    
    hasUW: !!this.uw?.name,
    hasSW: !!this.sw?.requirement,
    utsCount: this.uts ? this.uts.size : 0,
    skillsCount: this.skills ? this.skills.size : 0
  };
};

HeroSchema.methods.toSimpleJSON = function() {
  return {
    id: this._id.toString(),
    slug: this.slug,
    name: this.infos?.name || '',
    class: this.infos?.class || 'Unknown',
    thumbnail: this.infos?.thumbnail || ''
  };
};

// === Indexes ===

HeroSchema.index({ slug: 1 });
HeroSchema.index({ 'infos.name': 1 });
HeroSchema.index({ 'infos.class': 1 });
HeroSchema.index({ 'infos.position': 1 });
HeroSchema.index({ releaseOrder: 1 });

const Hero = mongoose.model('Hero', HeroSchema);

module.exports = Hero;
