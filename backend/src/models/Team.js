// backend/src/models/Team.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// === SCHÉMAS IMBRIQUÉS ===

const ArtifactConfigSchema = new mongoose.Schema({
  artifactSlug: {
    type: String,
    default: null
  },
  artifactInfo: {
    name: { type: String, default: null },
    thumbnail: { type: String, default: null },
    description: { type: String, default: null }
  },
  stars: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  }
}, { _id: false });

const GearSetConfigSchema = new mongoose.Schema({
  gearSetSlug: {
    type: String,
    default: null
  },
  gearSetInfo: {
    name: { type: String, default: null },
    thumbnail: { type: String, default: null },
    bonus2P: { type: String, default: null },
    bonus4P: { type: String, default: null }
  },
  pieces: {
    type: Number,
    enum: [0, 2, 4],
    default: 0
  }
}, { _id: false });

const PerksConfigSchema = new mongoose.Schema({
  t3: {
    s1: { type: String, enum: ['light', 'dark', null], default: null },
    s2: { type: String, enum: ['light', 'dark', null], default: null },
    s3: { type: String, enum: ['light', 'dark', null], default: null },
    s4: { type: String, enum: ['light', 'dark', null], default: null }
  },
  t5: {
    type: String,
    enum: ['light', 'dark', null],
    default: null
  }
}, { _id: false });

const UTConfigSchema = new mongoose.Schema({
  choice: {
    type: Number,
    enum: [0, 1, 2, 3, 4],
    default: 0
  },
  stars: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  }
}, { _id: false });

// 🔥 CORRIGÉ : SW avec advancement numérique
const SWConfigSchema = new mongoose.Schema({
  advancement: {
    type: Number,
    enum: [0, 1, 2, null], // 0 = blue, 1 = purple, 2 = red
    default: null
  }
}, { _id: false });

// === SCHÉMA HÉROS DANS LA TEAM ===
const HeroConfigSchema = new mongoose.Schema({
  heroSlug: {
    type: String,
    required: [true, 'heroSlug est requis']
  },
  
  heroId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Hero',
    default: null
  },
  
  heroInfo: {
    name: { type: String, default: 'Unknown Hero' },
    class: { type: String, default: 'Unknown' },
    position: { type: String, default: 'Middle-200' },
    thumbnail: { type: String, default: '/assets/heroes/default.png' },
    slug: { type: String, default: 'unknown' }
  },
  
  slotPosition: {
    type: Number,
    required: true,
    min: 0,
    max: 7,
    default: 0
  },
  
  uw: {
    stars: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  
  ut: {
    type: UTConfigSchema,
    default: () => ({})
  },
  
  sw: {
    type: SWConfigSchema,
    default: () => ({})
  },
  
  artifact: {
    type: ArtifactConfigSchema,
    default: () => ({})
  },
  
  gearSet: {
    type: GearSetConfigSchema,
    default: () => ({})
  },
  
  perks: {
    type: PerksConfigSchema,
    default: () => ({})
  },
  
  transcendence: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  notes: {
    type: String,
    default: '',
    maxlength: 500
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// === SCHÉMA PRINCIPAL TEAM ===
const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de l\'équipe est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    default: 'My Team'
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères'],
    default: ''
  },
  
  teamSize: {
    type: Number,
    enum: [4, 6, 8],
    default: 4
  },
  
  heroes: [HeroConfigSchema],
  
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  
  createdBy: {
    type: String,
    default: 'anonymous',
    index: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  views: {
    type: Number,
    default: 0
  },
  
  likes: {
    type: Number,
    default: 0
  },
  
  saves: {
    type: Number,
    default: 0
  },
  
  tags: [{
    type: String,
    enum: [
      'pvp', 'arena', 'gc', 'gr', 'wb', 'shakmeh', 'trial', 'story', 'raid',
      'test', 'beginner', 'advanced', 'meta', 'fun', 'farming', 'boss'
    ],
    index: true
  }],
  
  gameMode: {
    type: String,
    enum: [
      'arena', 'guild_conquest', 'guild_raid', 'world_boss',
      'shakmeh', 'trial', 'story', 'raid', 'other'
    ],
    default: 'other'
  },
  
  authorNotes: {
    type: String,
    default: '',
    maxlength: 1000
  },
  
  legacyId: {
    type: String,
    index: true,
    sparse: true
  },
  
  source: {
    type: String,
    enum: ['legacy', 'mongodb', 'imported'],
    default: 'mongodb'
  },
  
  formatVersion: {
    type: Number,
    default: 3
  }
}, {
  timestamps: true
});

// === MIDDLEWARE PRE-SAVE ===
TeamSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  if (this.heroes && this.isModified('heroes')) {
    const Hero = mongoose.model('Hero');
    const Artifact = mongoose.model('Artifact');
    const GearSet = mongoose.model('GearSet');
    
    for (const heroConfig of this.heroes) {
      try {
        // Récupérer les infos du héros
        if (heroConfig.heroSlug && !heroConfig.heroId) {
          const hero = await Hero.findOne({ slug: heroConfig.heroSlug })
            .select('_id infos.name infos.class infos.position infos.thumbnail slug');
          
          if (hero) {
            heroConfig.heroId = hero._id;
            heroConfig.heroInfo = {
              name: hero.infos.name || 'Unknown',
              class: hero.infos.class || 'Unknown',
              position: hero.infos.position || 'Middle-200',
              thumbnail: hero.infos.thumbnail || '/assets/heroes/default.png',
              slug: hero.slug || heroConfig.heroSlug
            };
          }
        }
        
        // Récupérer les infos de l'artefact
        if (heroConfig.artifact?.artifactSlug && !heroConfig.artifact.artifactInfo?.name) {
          const artifact = await Artifact.findOne({ slug: heroConfig.artifact.artifactSlug })
            .select('name thumbnail description');
          
          if (artifact) {
            heroConfig.artifact.artifactInfo = {
              name: artifact.name,
              thumbnail: artifact.thumbnail,
              description: artifact.description
            };
          }
        }
        
        // Récupérer les infos du gear set
        if (heroConfig.gearSet?.gearSetSlug && !heroConfig.gearSet.gearSetInfo?.name) {
          const gearSet = await GearSet.findOne({ slug: heroConfig.gearSet.gearSetSlug })
            .select('name thumbnail bonus2P bonus4P');
          
          if (gearSet) {
            heroConfig.gearSet.gearSetInfo = {
              name: gearSet.name,
              thumbnail: gearSet.thumbnail,
              bonus2P: gearSet.bonus2P,
              bonus4P: gearSet.bonus4P
            };
          }
        }
        
        heroConfig.updatedAt = Date.now();
        
      } catch (error) {
        console.error('Error processing hero config:', error);
      }
    }
  }
  
  if (!this.legacyId && this.isNew) {
    this.legacyId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  if (this.isNew && !this.source) {
    this.source = 'mongodb';
  }
  
  next();
});

// === MÉTHODE POUR CALCULER LES BONUS SW ===
HeroConfigSchema.methods.getSWBonus = function() {
  const sw = this.sw || {};
  const advancement = sw.advancement;
  
  if (advancement === null) return [];
  
  const bonuses = [];
  
  if (advancement >= 0) { // Blue ou plus
    // Blue donne les stats de base du SW
  }
  
  if (advancement >= 1) { // Purple ou plus
    // Purple ajoute le bonus advancement.1
    bonuses.push('advancement.1');
  }
  
  if (advancement >= 2) { // Red
    // Red ajoute le bonus advancement.2
    bonuses.push('advancement.2');
  }
  
  return bonuses;
};

// === MÉTHODE POUR FORMATER POUR L'API ===
TeamSchema.methods.toAPIFormat = function() {
  const teamObj = this.toObject();
  
  return {
    id: teamObj._id.toString(),
    name: teamObj.name,
    description: teamObj.description,
    teamSize: teamObj.teamSize,
    heroes: teamObj.heroes.map(hero => ({
      id: hero._id.toString(),
      heroSlug: hero.heroSlug,
      heroId: hero.heroId,
      heroInfo: hero.heroInfo,
      slotPosition: hero.slotPosition,
      uw: hero.uw,
      ut: hero.ut,
      sw: hero.sw,
      artifact: hero.artifact,
      gearSet: hero.gearSet,
      perks: hero.perks,
      transcendence: hero.transcendence,
      notes: hero.notes,
      updatedAt: hero.updatedAt
    })),
    isPublic: teamObj.isPublic,
    createdBy: teamObj.createdBy,
    createdAt: teamObj.createdAt,
    updatedAt: teamObj.updatedAt,
    views: teamObj.views,
    likes: teamObj.likes,
    saves: teamObj.saves,
    tags: teamObj.tags,
    gameMode: teamObj.gameMode,
    authorNotes: teamObj.authorNotes,
    source: teamObj.source,
    formatVersion: teamObj.formatVersion,
    legacyId: teamObj.legacyId
  };
};

// === INDEXES ===
TeamSchema.index({ name: 'text', description: 'text', authorNotes: 'text' });
TeamSchema.index({ isPublic: 1, createdAt: -1 });
TeamSchema.index({ isPublic: 1, likes: -1 });
TeamSchema.index({ isPublic: 1, views: -1 });
TeamSchema.index({ createdBy: 1, createdAt: -1 });
TeamSchema.index({ tags: 1, gameMode: 1 });
TeamSchema.index({ 'heroes.heroSlug': 1 });
TeamSchema.index({ teamSize: 1 });
TeamSchema.index({ source: 1 });

TeamSchema.plugin(mongoosePaginate);

const Team = mongoose.model('Team', TeamSchema, 'teams');

module.exports = Team;