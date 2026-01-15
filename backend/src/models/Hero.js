const mongoose = require('mongoose');

// 🔥 FONCTION COMMUNE POUR LES SLUGS (comme les autres scripts)
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

// === SCHÉMAS IMBRIQUÉS (gardez ceux-ci) ===
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

// Schema flexible pour les valeurs UW
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

// === SCHÉMA PRINCIPAL HERO  ===
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
  
  // Métadonnées
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

// === MIDDLEWARE CORRIGÉ (SANS BUG) ===
HeroSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // 1. S'assurer que le slug existe (CORRIGÉ)
  if (!this.slug && this.infos?.name) {
    this.slug = createSlug(this.infos.name); // ✅ Utilise la vraie fonction
  }
  
  // 2. Fonction pour normaliser UNIQUEMENT les chemins d'images
  const normalizeImagePath = (imagePath) => {
    if (!imagePath || imagePath === '' || imagePath === null || imagePath === undefined) {
      return '';
    }
    
    // Si le chemin commence déjà par "heroes/", le garder tel quel
    if (imagePath.startsWith('heroes/')) {
      return imagePath;
    }
    
    // Si c'est juste un nom de fichier, ajouter le chemin du héros
    const heroName = this.infos?.name || 'unknown';
    return `heroes/${heroName}/${imagePath}`;
  };
  
  // 🔥 CORRECTION : NE PAS NORMALISER this.infos.name !
  // this.infos.name reste le nom du héros, pas un chemin d'image
  
  // 3. Normaliser les VRAIS chemins d'images
  // Infos thumbnail
  if (this.infos?.thumbnail) {
    this.infos.thumbnail = normalizeImagePath(this.infos.thumbnail);
  }
  
  // Skills
  if (this.skills && this.skills instanceof Map) {
    for (const [key, skill] of this.skills) {
      if (skill?.thumbnail) {
        skill.thumbnail = normalizeImagePath(skill.thumbnail);
      }
    }
  }
  
  // UW
  if (this.uw?.thumbnail) {
    this.uw.thumbnail = normalizeImagePath(this.uw.thumbnail);
  }
  
  // UTs
  if (this.uts && this.uts instanceof Map) {
    for (const [key, ut] of this.uts) {
      if (ut?.thumbnail) {
        ut.thumbnail = normalizeImagePath(ut.thumbnail);
      }
    }
  }
  
  // SW
  if (this.sw?.thumbnail) {
    this.sw.thumbnail = normalizeImagePath(this.sw.thumbnail);
  }
  
  // Splashart
  if (this.splashart) {
    this.splashart = normalizeImagePath(this.splashart);
  }
  
  // Costumes
  if (this.costumes) {
    this.costumes = normalizeImagePath(this.costumes);
  }
  
  next();
});

// === MÉTHODES POUR L'API (COMME LES AUTRES MODÈLES) ===
HeroSchema.methods.toAPIFormat = function() {
  return {
    _id: this._id,                     // 🔥 ObjectId MongoDB
    slug: this.slug,                   // 🔥 Slug URL-friendly
    name: this.infos?.name || '',      // 🔥 Nom d'affichage
    title: this.infos?.title || '',
    class: this.infos?.class || 'Unknown',
    position: this.infos?.position || 'Unknown',
    thumbnail: this.infos?.thumbnail || '',
    releaseOrder: this.releaseOrder || 999,
    
    // Stats utiles pour le frontend
    hasUW: !!this.uw?.name,
    hasSW: !!this.sw?.requirement,
    utsCount: this.uts ? this.uts.size : 0,
    skillsCount: this.skills ? this.skills.size : 0
  };
};

HeroSchema.methods.toSimpleJSON = function() {
  return {
    id: this._id.toString(),          // String pour le frontend
    slug: this.slug,
    name: this.infos?.name || '',
    class: this.infos?.class || 'Unknown',
    thumbnail: this.infos?.thumbnail || ''
  };
};

// === INDEXES (déjà bons) ===
HeroSchema.index({ slug: 1 });
HeroSchema.index({ 'infos.name': 1 });
HeroSchema.index({ 'infos.class': 1 });
HeroSchema.index({ 'infos.position': 1 });
HeroSchema.index({ releaseOrder: 1 });

const Hero = mongoose.model('Hero', HeroSchema);

module.exports = Hero;