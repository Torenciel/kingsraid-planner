const mongoose = require('mongoose');

// === SCHÉMAS IMBRIQUÉS ===

// Configuration d'artifact (avec référence au modèle Artifact)
const ArtifactConfigSchema = new mongoose.Schema({
  // Référence à l'artifact
  artifactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artifact',
    default: null
  },
  
  // Infos de l'artifact (dupliquées pour éviter populate)
  artifactInfo: {
    name: { type: String, default: null },
    thumbnail: { type: String, default: null },
    description: { type: String, default: null }
  },
  
  // Niveau (0-5)
  level: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  // Stars (0-5)
  stars: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  }
}, { _id: false });

// Configuration de gear set (avec référence au modèle GearSet)
const GearSetConfigSchema = new mongoose.Schema({
  // Référence au gear set
  gearSetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GearSet',
    default: null
  },
  
  // Infos du gear set (dupliquées)
  gearSetInfo: {
    id: { type: String, default: null }, // "black_dragon", etc.
    name: { type: String, default: null },
    image: { type: String, default: null },
    bonus2P: { type: String, default: null },
    bonus4P: { type: String, default: null }
  },
  
  // Pieces équipées (2 ou 4)
  pieces: {
    type: Number,
    enum: [0, 2, 4],
    default: 0
  }
}, { _id: false });

// Configuration de perks
const PerksConfigSchema = new mongoose.Schema({
  // T3 Perks (pour les 4 skills)
  t3: {
    s1: {
      type: String,
      enum: ['light', 'dark', null],
      default: null
    },
    s2: {
      type: String,
      enum: ['light', 'dark', null],
      default: null
    },
    s3: {
      type: String,
      enum: ['light', 'dark', null],
      default: null
    },
    s4: {
      type: String,
      enum: ['light', 'dark', null],
      default: null
    }
  },
  // T5 Perk
  t5: {
    type: String,
    enum: ['light', 'dark', null],
    default: null
  }
}, { _id: false });

// Configuration d'UT (Unique Treasure)
const UTConfigSchema = new mongoose.Schema({
  // Choix d'UT (0 = pas d'UT, 1-4 = UT1 à UT4)
  choice: {
    type: Number,
    enum: [0, 1, 2, 3, 4],
    default: 0
  },
  
  // Stars (0-5)
  stars: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  // Niveau d'amélioration optionnel
  enhancement: {
    type: Number,
    min: 0,
    max: 20,
    default: 0
  }
}, { _id: false });

// Configuration d'un héros dans l'équipe
const HeroConfigSchema = new mongoose.Schema({
  // Référence au héros
  heroId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Hero',
    required: true 
  },
  
  // Information du héros (dupliquée pour éviter les populate)
  heroInfo: {
    name: { type: String, required: true },
    class: { type: String, required: true },
    position: { type: String, required: true },
    thumbnail: { type: String, required: true },
    slug: { type: String, required: true }
  },
  
  // Position dans l'équipe (0-7)
  slotPosition: {
    type: Number,
    required: true,
    min: 0,
    max: 7,
    default: 0
  },
  
  // === CONFIGURATIONS ===
  
  // UW (Unique Weapon)
  uw: {
    stars: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  
  // UT (Unique Treasure)
  ut: {
    type: UTConfigSchema,
    default: () => ({})
  },
  
  // SW (Soul Weapon) Advancement
  sw: {
    advancement: {
      type: String,
      enum: ['none', 'blue', 'purple', 'red'],
      default: 'none'
    },
    // Niveau optionnel
    level: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  
  // Artifact
  artifact: {
    type: ArtifactConfigSchema,
    default: () => ({})
  },
  
  // Gear Set
  gearSet: {
    type: GearSetConfigSchema,
    default: () => ({})
  },
  
  // Perks
  perks: {
    type: PerksConfigSchema,
    default: () => ({})
  },
  
  // Transcendance level (0-5)
  transcendence: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  // Notes personnelles
  notes: {
    type: String,
    default: '',
    maxlength: 500
  },
  
  // Date de dernière modification
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// === SCHÉMA PRINCIPAL TEAM ===
const TeamSchema = new mongoose.Schema({
  // Informations de base
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
  
  // Taille de l'équipe
  teamSize: {
    type: Number,
    min: 1,
    max: 8,
    default: 4
  },
  
  // Héros dans l'équipe
  heroes: [HeroConfigSchema],
  
  // Métadonnées
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
  
  // Statistiques
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
  
  // Tags (basés sur vos routes)
  tags: [{
    type: String,
    enum: [
      'pvp', 'gc', 'gr', 'wb', 'shakmeh', 'trial', 'story', 'raid',
      'test', 'beginner', 'advanced', 'meta', 'fun'
    ],
    index: true
  }],
  
  // Game mode
  gameMode: {
    type: String,
    enum: [
      'arena', 'guild_conquest', 'guild_raid', 'world_boss',
      'shakmeh', 'trial', 'story', 'raid', 'other'
    ],
    default: 'other'
  },
  
  // Difficulté
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'very_hard', 'extreme'],
    default: 'medium'
  },
  
  // Notes de l'auteur
  authorNotes: {
    type: String,
    default: '',
    maxlength: 1000
  },
  
  // Compatibilité
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
    default: 2
  }
});

// === MIDDLEWARE ===
TeamSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  // Mettre à jour les infos des héros, artifacts, gear sets
  if (this.heroes && this.isModified('heroes')) {
    const Hero = mongoose.model('Hero');
    const Artifact = mongoose.model('Artifact');
    const GearSet = mongoose.model('GearSet');
    
    for (const heroConfig of this.heroes) {
      // Infos héros
      if (heroConfig.heroId && (!heroConfig.heroInfo || this.isNew)) {
        try {
          const hero = await Hero.findById(heroConfig.heroId)
            .select('infos.name infos.class infos.position infos.thumbnail slug');
          
          if (hero) {
            heroConfig.heroInfo = {
              name: hero.infos.name,
              class: hero.infos.class,
              position: hero.infos.position,
              thumbnail: hero.infos.thumbnail,
              slug: hero.slug
            };
          }
        } catch (error) {
          console.error('Error populating hero info:', error);
        }
      }
      
      // Infos artifact
      if (heroConfig.artifact?.artifactId && !heroConfig.artifact.artifactInfo?.name) {
        try {
          const artifact = await Artifact.findById(heroConfig.artifact.artifactId)
            .select('name thumbnail description');
          
          if (artifact) {
            heroConfig.artifact.artifactInfo = {
              name: artifact.name,
              thumbnail: artifact.thumbnail,
              description: artifact.description
            };
          }
        } catch (error) {
          console.error('Error populating artifact info:', error);
        }
      }
      
      // Infos gear set
      if (heroConfig.gearSet?.gearSetId && !heroConfig.gearSet.gearSetInfo?.name) {
        try {
          const gearSet = await GearSet.findById(heroConfig.gearSet.gearSetId)
            .select('id name image bonus2P bonus4P');
          
          if (gearSet) {
            heroConfig.gearSet.gearSetInfo = {
              id: gearSet.id,
              name: gearSet.name,
              image: gearSet.image,
              bonus2P: gearSet.bonus2P,
              bonus4P: gearSet.bonus4P
            };
          }
        } catch (error) {
          console.error('Error populating gear set info:', error);
        }
      }
      
      // Mettre à jour updatedAt du héros
      heroConfig.updatedAt = Date.now();
    }
  }
  
  // Générer legacyId si manquant
  if (!this.legacyId && this.isNew) {
    this.legacyId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  next();
});

// === INDEXES ===
TeamSchema.index({ name: 'text', description: 'text', authorNotes: 'text' });
TeamSchema.index({ isPublic: 1, createdAt: -1 });
TeamSchema.index({ isPublic: 1, likes: -1 });
TeamSchema.index({ isPublic: 1, views: -1 });
TeamSchema.index({ createdBy: 1, createdAt: -1 });
TeamSchema.index({ tags: 1, gameMode: 1 });

// === MÉTHODES ===

// Formater pour le frontend (compatible avec TeamContext)
TeamSchema.methods.toFrontendFormat = function() {
  const team = this.toObject();
  
  // Convertir _id en id
  team.id = team._id.toString();
  delete team._id;
  
  // Formater les héros pour TeamContext
  team.heroes = team.heroes.map(heroConfig => {
    // Objet héros de base
    const hero = {
      id: heroConfig.heroId.toString(),
      name: heroConfig.heroInfo.name,
      class: heroConfig.heroInfo.class,
      position: heroConfig.heroInfo.position,
      thumbnail: heroConfig.heroInfo.thumbnail,
      slug: heroConfig.heroInfo.slug
    };
    
    // Formater les subSlots comme dans votre TeamContext
    // [UT, UW, SW, Artifact] - chaque slot avec {item, stars}
    const subSlots = [
      { // UT
        item: heroConfig.ut.choice > 0 ? {
          type: 'ut',
          id: heroConfig.ut.choice,
          name: `UT${heroConfig.ut.choice}`
        } : null,
        stars: heroConfig.ut.stars
      },
      { // UW
        item: heroConfig.uw.stars > 0 ? {
          type: 'uw',
          name: 'Unique Weapon'
        } : null,
        stars: heroConfig.uw.stars
      },
      { // SW
        item: heroConfig.sw.advancement !== 'none' ? {
          type: 'sw',
          advancement: heroConfig.sw.advancement,
          name: 'Soul Weapon'
        } : null,
        stars: 0 // SW n'a pas de stars
      },
      { // Artifact
        item: heroConfig.artifact.artifactId ? {
          type: 'artifact',
          id: heroConfig.artifact.artifactId.toString(),
          name: heroConfig.artifact.artifactInfo.name,
          thumbnail: heroConfig.artifact.artifactInfo.thumbnail
        } : null,
        stars: heroConfig.artifact.stars
      }
    ];
    
    // Gear Set (séparé dans votre contexte)
    const gearSet = heroConfig.gearSet.gearSetId ? {
      id: heroConfig.gearSet.gearSetInfo.id,
      name: heroConfig.gearSet.gearSetInfo.name,
      image: heroConfig.gearSet.gearSetInfo.image,
      pieces: heroConfig.gearSet.pieces
    } : null;
    
    // Perks (formatté pour votre PerkModal)
    const perks = heroConfig.perks ? {
      t3: heroConfig.perks.t3,
      t5: heroConfig.perks.t5
    } : null;
    
    // Transcendance
    const transcendence = heroConfig.transcendence;
    
    return {
      hero,
      slotPosition: heroConfig.slotPosition,
      subSlots,
      subStars: subSlots.map(slot => slot.stars),
      gearSet,
      perks,
      transcendence,
      notes: heroConfig.notes
    };
  });
  
  // S'assurer que team.heroes a la bonne longueur (avec null pour slots vides)
  const formattedTeam = Array(this.teamSize).fill(null);
  team.heroes.forEach(heroConfig => {
    formattedTeam[heroConfig.slotPosition] = heroConfig;
  });
  
  team.heroes = formattedTeam;
  
  return team;
};

const Team = mongoose.model('Team', TeamSchema);

module.exports = Team;