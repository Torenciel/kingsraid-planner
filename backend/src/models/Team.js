const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// Generate slug automatically on creation
if (this.isNew && !this.slug) {
  const slugify = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  this.slug = `${slugify(this.name)}-${this._id}`;
}

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
  }
}, { _id: false });

const GearSetConfigSchema = new mongoose.Schema({
  isMultiSet: {
    type: Boolean,
    default: false
  },
  sets: {
    type: [String], // ["black-dragon"] or ["set1", "set2"]
    default: []
  },
  pieces: {
    type: Number,
    enum: [0, 2, 4],
    default: 0
  }
}, { _id: false });

const PerksConfigSchema = new mongoose.Schema({
  t1: {
    selected: [{ type: String }]
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
    type: Number,
    enum: [0, 1, 2, null],
    default: null
  }
}, { _id: false });

// =============================
// HERO CONFIG
// =============================

const HeroConfigSchema = new mongoose.Schema({
  heroSlug: {
    type: String,
    required: true
  },

  heroId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hero'
  },

  slotPosition: {
    type: Number,
    required: true,
    min: 0,
    max: 7
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

  slug: {
    type: String,
    required: true,
    unique: true,
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

  views: { type: Number, default: 0 },
  upvotes: { type: Number, default: 0 },
  bookmarks: { type: Number, default: 0 },

  tags: [{
    type: String,
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
    default: 4
  }

}, {
  timestamps: true
});

// =============================
// VALIDATE
// =============================

TeamSchema.pre('validate', function (next) {
  if (this.isNew && !this.slug) {
    const slugify = (text) => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
    };

    this.slug = `${slugify(this.name)}-${this._id}`;
  }

  next();
});

// =============================
// PRE-SAVE
// =============================

TeamSchema.pre('save', async function(next) {

  if (this.heroes && this.isModified('heroes')) {

    const Hero = mongoose.model('Hero');

    for (const heroConfig of this.heroes) {

      if (heroConfig.heroSlug && !heroConfig.heroId) {
        const hero = await Hero.findOne({ slug: heroConfig.heroSlug })
          .select('_id');

        if (hero) {
          heroConfig.heroId = hero._id;
        }
      }

      heroConfig.updatedAt = Date.now();
    }
  }

  if (!this.legacyId && this.isNew) {
    this.legacyId = `team_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  next();
});

// =============================
// METHODS
// =============================

TeamSchema.methods.toAPIFormat = function() {
  const teamObj = this.toObject();

  return {
    id: teamObj._id.toString(),
    name: teamObj.name,
    slug: teamObj.slug,
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

TeamSchema.plugin(mongoosePaginate);

const Team = mongoose.model('Team', TeamSchema, 'teams');

module.exports = Team;
