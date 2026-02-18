const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// =============================
// NESTED SCHEMAS
// =============================

const ArtifactConfigSchema = new mongoose.Schema({
  artifactSlug: {
    type: String,
    default: null
  },
  stars: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  artifactInfo: {
    name: String,
    thumbnail: String,
    description: String
  }
}, { _id: false });

const GearSetConfigSchema = new mongoose.Schema({
  gearSetSlug: {
    type: String,
    default: null
  },
  pieces: {
    type: Number,
    enum: [0, 2, 4],
    default: 0
  },
  isMultiSet: {
    type: Boolean,
    default: false
  },
  sets: [{
    slug: String,
    pieces: { type: Number, enum: [2], default: 2 }
  }],
  gearSetInfo: {
    name: String,
    thumbnail: String,
    bonus2P: String,
    bonus4P: String
  }
}, { _id: false });

const PerksConfigSchema = new mongoose.Schema({
  t1: {
    selected: [{
      type: String,
      enum: ['atk-up', 'hp-up', 'def-up', 'crit-resist-up', 'monster-hunting']
    }]
  },
  t2: {
    selected: [{ type: String }]
  },
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

const SWConfigSchema = new mongoose.Schema({
  advancement: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    validate: {
      validator: function(value) {
        return value === null ||
          value === 0 || value === 1 || value === 2 ||
          value === "0" || value === "1" || value === "2" ||
          value === "null" || value === "none";
      },
      message: 'Invalid advancement value'
    }
  }
}, { _id: false });

SWConfigSchema.pre('validate', function(next) {
  if (this.advancement === undefined) {
    this.advancement = null;
  }

  if (typeof this.advancement === 'string') {
    switch (this.advancement) {
      case "null":
      case "none":
        this.advancement = null;
        break;
      case "0":
      case "1":
      case "2":
        this.advancement = parseInt(this.advancement);
        break;
      default:
        this.advancement = null;
    }
  }

  if (this.advancement !== null && typeof this.advancement !== 'number') {
    this.advancement = null;
  }

  if (this.advancement !== null && ![0, 1, 2].includes(this.advancement)) {
    this.advancement = null;
  }

  next();
});

// =============================
// HERO CONFIG
// =============================

const HeroConfigSchema = new mongoose.Schema({
  heroSlug: {
    type: String,
    required: [true, 'heroSlug is required']
  },

  heroId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hero'
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

  updatedAt: {
    type: Date,
    default: Date.now
  }

}, { _id: true });

// =============================
// MAIN TEAM SCHEMA
// =============================

const TeamSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    default: 'My Team'
  },

  description: {
    type: String,
    trim: true,
    maxlength: 500,
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
    default: true,
    index: true
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  createdBy: {
    type: String,
    required: true,
    index: true
  },

  views: {
    type: Number,
    default: 0
  },

  upvotes: {
    type: Number,
    default: 0
  },

  bookmarks: {
    type: Number,
    default: 0
  },

  tags: [{
    type: String,
    enum: [
      'pvp',
      'arena',
      'guild_conquest',
      'guild_raid',
      'world_boss',
      'shakmeh',
      'trial',
      'story',
      'raid',
      'other',
      'test',
      'beginner',
      'advanced',
      'meta',
      'fun',
      'farming',
      'boss'
    ],
    index: true
  }],

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

// =============================
// PRE-SAVE ENRICHMENT
// =============================

TeamSchema.pre('save', async function(next) {

  if (this.heroes && this.isModified('heroes')) {

    const Hero = mongoose.model('Hero');
    const Artifact = mongoose.model('Artifact');
    const GearSet = mongoose.model('GearSet');

    for (const heroConfig of this.heroes) {

      try {

        if (heroConfig.heroSlug && !heroConfig.heroId) {
          const hero = await Hero.findOne({ slug: heroConfig.heroSlug })
            .select('_id');

          if (hero) {
            heroConfig.heroId = hero._id;
          }
        }

        if (heroConfig.artifact?.artifactSlug &&
            !heroConfig.artifact.artifactInfo?.name) {

          const artifact = await Artifact.findOne({
            slug: heroConfig.artifact.artifactSlug
          }).select('name thumbnail description');

          if (artifact) {
            heroConfig.artifact.artifactInfo = {
              name: artifact.name,
              thumbnail: artifact.thumbnail,
              description: artifact.description
            };
          }
        }

        if (heroConfig.gearSet?.gearSetSlug &&
            !heroConfig.gearSet.gearSetInfo?.name) {

          const gearSet = await GearSet.findOne({
            slug: heroConfig.gearSet.gearSetSlug
          }).select('name thumbnail bonus2P bonus4P');

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
        return next(error);
      }
    }
  }

  if (!this.legacyId && this.isNew) {
    this.legacyId = `team_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  if (this.isNew && !this.source) {
    this.source = 'mongodb';
  }

  next();
});

// =============================
// METHODS
// =============================

HeroConfigSchema.methods.getSWBonus = function() {
  const sw = this.sw || {};
  const advancement = sw.advancement;

  if (advancement === null || advancement === undefined) return [];

  const bonuses = [];

  if (advancement >= 1) bonuses.push('advancement.1');
  if (advancement >= 2) bonuses.push('advancement.2');

  return bonuses;
};

TeamSchema.methods.toAPIFormat = function() {
  const teamObj = this.toObject();

  return {
    id: teamObj._id.toString(),
    name: teamObj.name,
    description: teamObj.description,
    teamSize: teamObj.teamSize,
    heroes: teamObj.heroes,
    isPublic: teamObj.isPublic,
    author: teamObj.author,
    createdBy: teamObj.createdBy,
    createdAt: teamObj.createdAt,
    updatedAt: teamObj.updatedAt,
    views: teamObj.views,
    upvotes: teamObj.upvotes,
    bookmarks: teamObj.bookmarks,
    tags: teamObj.tags,
    authorNotes: teamObj.authorNotes,
    source: teamObj.source,
    formatVersion: teamObj.formatVersion,
    legacyId: teamObj.legacyId
  };
};

// =============================
// INDEXES
// =============================

TeamSchema.index({ name: 'text', description: 'text', authorNotes: 'text' });
TeamSchema.index({ isPublic: 1, createdAt: -1 });
TeamSchema.index({ isPublic: 1, upvotes: -1 });
TeamSchema.index({ isPublic: 1, views: -1 });
TeamSchema.index({ author: 1, createdAt: -1 });
TeamSchema.index({ tags: 1 });
TeamSchema.index({ 'heroes.heroSlug': 1 });
TeamSchema.index({ teamSize: 1 });
TeamSchema.index({ source: 1 });

TeamSchema.plugin(mongoosePaginate);

const Team = mongoose.model('Team', TeamSchema, 'teams');

module.exports = Team;
