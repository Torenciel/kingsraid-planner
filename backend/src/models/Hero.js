const mongoose = require('mongoose');

// === SCHÉMAS IMBRIQUÉS (rendus flexibles) ===

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

// === SCHÉMA PRINCIPAL HERO (flexible) ===
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

// === MIDDLEWARE CORRIGÉ (sans récursion infinie) ===
HeroSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Créer le slug si manquant
  if (!this.slug && this.infos?.name) {
    this.slug = this.infos.name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  
  // Fonction helper pour normaliser un chemin d'image
  const normalizeImagePath = (imagePath) => {
    if (!imagePath || imagePath === '' || imagePath === null || imagePath === undefined) {
      return '';
    }
    
    // Si le chemin commence déjà par "heroes/", le garder tel quel
    if (imagePath.startsWith('heroes/')) {
      return imagePath;
    }
    
    // Sinon, ajouter le préfixe du héros
    return `heroes/${this.infos.name}/${imagePath}`;
  };
  
  // Normaliser les chemins d'images de manière SÉCURISÉE (sans récursion)
  
  // 1. Infos
  if (this.infos?.thumbnail) {
    this.infos.thumbnail = normalizeImagePath(this.infos.thumbnail);
  }
  
  // 2. Skills
  if (this.skills && typeof this.skills === 'object') {
    try {
      const skillsObj = this.skills instanceof Map ? 
        Object.fromEntries(this.skills) : this.skills;
      
      for (const skillKey in skillsObj) {
        if (skillsObj[skillKey]?.thumbnail) {
          skillsObj[skillKey].thumbnail = normalizeImagePath(skillsObj[skillKey].thumbnail);
        }
      }
      
      // Reconvertir en Map si nécessaire
      if (this.skills instanceof Map) {
        this.skills = new Map(Object.entries(skillsObj));
      }
    } catch (error) {
      console.warn('Warning: Could not normalize skill images:', error.message);
    }
  }
  
  // 3. Perks - t3
  if (this.perks?.t3 && typeof this.perks.t3 === 'object') {
    try {
      const t3Obj = this.perks.t3 instanceof Map ?
        Object.fromEntries(this.perks.t3) : this.perks.t3;
      
      for (const perkKey in t3Obj) {
        if (t3Obj[perkKey]?.light?.thumbnail) {
          t3Obj[perkKey].light.thumbnail = normalizeImagePath(t3Obj[perkKey].light.thumbnail);
        }
        if (t3Obj[perkKey]?.dark?.thumbnail) {
          t3Obj[perkKey].dark.thumbnail = normalizeImagePath(t3Obj[perkKey].dark.thumbnail);
        }
      }
      
      if (this.perks.t3 instanceof Map) {
        this.perks.t3 = new Map(Object.entries(t3Obj));
      }
    } catch (error) {
      console.warn('Warning: Could not normalize perk t3 images:', error.message);
    }
  }
  
  // 4. Perks - t5
  if (this.perks?.t5?.light?.thumbnail) {
    this.perks.t5.light.thumbnail = normalizeImagePath(this.perks.t5.light.thumbnail);
  }
  if (this.perks?.t5?.dark?.thumbnail) {
    this.perks.t5.dark.thumbnail = normalizeImagePath(this.perks.t5.dark.thumbnail);
  }
  
  // 5. UW
  if (this.uw?.thumbnail) {
    this.uw.thumbnail = normalizeImagePath(this.uw.thumbnail);
  }
  
  // 6. UTs
  if (this.uts && typeof this.uts === 'object') {
    try {
      const utsObj = this.uts instanceof Map ?
        Object.fromEntries(this.uts) : this.uts;
      
      for (const utKey in utsObj) {
        if (utsObj[utKey]?.thumbnail) {
          utsObj[utKey].thumbnail = normalizeImagePath(utsObj[utKey].thumbnail);
        }
      }
      
      if (this.uts instanceof Map) {
        this.uts = new Map(Object.entries(utsObj));
      }
    } catch (error) {
      console.warn('Warning: Could not normalize UT images:', error.message);
    }
  }
  
  // 7. SW
  if (this.sw?.thumbnail) {
    this.sw.thumbnail = normalizeImagePath(this.sw.thumbnail);
  }
  
  // 8. Splashart et costumes
  if (this.splashart) {
    this.splashart = normalizeImagePath(this.splashart);
  }
  
  if (this.costumes) {
    this.costumes = normalizeImagePath(this.costumes);
  }
  
  next();
});

// === INDEXES ===
HeroSchema.index({ slug: 1 });
HeroSchema.index({ 'infos.name': 1 });
HeroSchema.index({ 'infos.class': 1 });
HeroSchema.index({ 'infos.position': 1 });
HeroSchema.index({ releaseOrder: 1 });

const Hero = mongoose.model('Hero', HeroSchema);

module.exports = Hero;