const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const SERVER_PORT = process.env.SERVER_PORT || 3002;

// === CHEMINS CORRIGÉS ===
const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
// AJOUTEZ "kingsraid-planner" dans le chemin
const PUBLIC_PATH = path.join(PROJECT_ROOT, 'kingsraid-planner', 'frontend', 'public');
const KINGSRAID_DATA_PATH = path.join(PUBLIC_PATH, 'kingsraid-data');

console.log('='.repeat(50));
console.log('📂 Project root:', PROJECT_ROOT);
console.log('📂 Public path:', PUBLIC_PATH);
console.log('📂 KingsRaid data path:', KINGSRAID_DATA_PATH);
console.log('📂 Exists?', fs.existsSync(KINGSRAID_DATA_PATH));

// Middleware
app.use(cors());
app.use(express.json());

// Connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kingsraid';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connecté'))
.catch(err => {
  console.error('❌ Erreur MongoDB:', err);
  // Continuer même si MongoDB échoue (mode dégradé)
});

// Routes MongoDB (à importer)
const heroRoutes = require('./routes/hero.routes');
const teamRoutes = require('./routes/team.routes');

app.use('/api/v2/heroes', heroRoutes);  // Nouvelles routes MongoDB
app.use('/api/v2/teams', teamRoutes);   // Nouvelles routes MongoDB

// === ROUTES EXISTANTES (pour compatibilité) ===
// Gardez TOUTES vos routes existantes ici...

// Servir les fichiers statiques KingsRaid
app.use('/kingsraid-data', express.static(KINGSRAID_DATA_PATH));

// Route de debug existante
app.get('/api/debug', (req, res) => {
  const masangPath = path.join(KINGSRAID_DATA_PATH, 'hero_release_order_masang.json');
  const heroesDataPath = path.join(KINGSRAID_DATA_PATH, 'table-data', 'heroes');
  
  const masangExists = fs.existsSync(masangPath);
  const heroesDataExists = fs.existsSync(heroesDataPath);
  
  let heroFiles = [];
  if (heroesDataExists) {
    try {
      heroFiles = fs.readdirSync(heroesDataPath);
    } catch (e) {
      heroFiles = [`Error: ${e.message}`];
    }
  }
  
  res.json({
    paths: {
      projectRoot: PROJECT_ROOT,
      publicPath: PUBLIC_PATH,
      kingsraidPath: KINGSRAID_DATA_PATH,
      masangPath: masangPath,
      heroesDataPath: heroesDataPath
    },
    exists: {
      kingsraidData: fs.existsSync(KINGSRAID_DATA_PATH),
      masang: masangExists,
      heroesData: heroesDataExists
    },
    files: {
      heroesCount: heroFiles.length,
      heroFiles: heroFiles.slice(0, 10)
    },
    server: {
      port: SERVER_PORT,
      env: process.env.NODE_ENV,
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  });
});

// Route pour le fichier masang
app.get('/api/kingsraid-data/hero_release_order_masang.json', (req, res) => {
  const filePath = path.join(KINGSRAID_DATA_PATH, 'hero_release_order_masang.json');
  
  console.log(`🔍 Accessing masang file: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    console.log('✅ File found, sending...');
    res.sendFile(filePath);
  } else {
    console.log('❌ File not found, creating test data...');
    
    // Vérifier si le dossier existe
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Données de test
    const testData = ["Kasel", "Frey", "Cleo", "Roi", "Clause"];
    try {
      fs.writeFileSync(filePath, JSON.stringify(testData, null, 2));
      console.log(`📝 Test file created at: ${filePath}`);
      res.json(testData);
    } catch (error) {
      console.error('❌ Error creating file:', error);
      res.status(500).json({ 
        error: 'Failed to create file',
        details: error.message 
      });
    }
  }
});

// API pour les héros (FONCTION CORRIGÉE)
app.get('/api/heroes', (req, res) => {
  try {
    const { sort = 'name' } = req.query;
    console.log(`🔍 Loading heroes with sort: ${sort}`);
    
    // Utiliser la fonction avec les bons chemins
    const heroes = getAllHeroesWithDetails();
    console.log(`📊 ${heroes.length} heroes loaded`);
    
    const sortedHeroes = sortHeroes(heroes, sort);
    
    // Vérifier quels héros ont des images
    const heroesWithImages = sortedHeroes.filter(hero => {
      const imagePath = path.join(KINGSRAID_DATA_PATH, 'assets', 'heroes', hero.name, 'ico.png');
      const exists = fs.existsSync(imagePath);
      if (!exists) {
        console.log(`❌ Missing image for: ${hero.name} at ${imagePath}`);
      }
      return exists;
    });
    
    const missingHeroes = sortedHeroes.filter(hero => {
      const imagePath = path.join(KINGSRAID_DATA_PATH, 'assets', 'heroes', hero.name, 'ico.png');
      return !fs.existsSync(imagePath);
    }).map(hero => hero.name);
    
    const response = {
      heroes: heroesWithImages,
      missingHeroes: missingHeroes,
      total: heroes.length,
      loaded: heroesWithImages.length,
      missingCount: missingHeroes.length,
      currentSort: sort,
      paths: {
        heroesData: path.join(KINGSRAID_DATA_PATH, 'table-data', 'heroes'),
        imagesBase: path.join(KINGSRAID_DATA_PATH, 'assets', 'heroes')
      }
    };
    
    console.log(`✅ Response: ${response.heroes.length} heroes with images`);
    console.log(`❌ Missing: ${response.missingCount} heroes`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error in /api/heroes:', error);
    res.status(500).json({
      error: 'Failed to load heroes',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      heroes: []
    });
  }
});

// === FONCTIONS UTILITAIRES AVEC CHEMINS CORRIGÉS ===

function loadReleaseOrder() {
  try {
    const releaseOrderPath = path.join(KINGSRAID_DATA_PATH, 'hero_release_order.json');
    console.log(`📅 Loading release order from: ${releaseOrderPath}`);
    
    if (fs.existsSync(releaseOrderPath)) {
      const fileContent = fs.readFileSync(releaseOrderPath, 'utf8');
      const releaseData = JSON.parse(fileContent);
      
      if (releaseData && typeof releaseData === 'object') {
        const releaseArray = Object.entries(releaseData)
          .sort((a, b) => parseInt(a[1]) - parseInt(b[1]))
          .map(entry => entry[0]);
        
        console.log(`📅 Release order loaded: ${releaseArray.length} heroes`);
        return releaseArray;
      }
    }
    console.log('⚠️ No release order file found');
    return [];
  } catch (error) {
    console.error('❌ Error reading release order:', error);
    return [];
  }
}

function getAllHeroesWithDetails() {
  const heroesDataPath = path.join(KINGSRAID_DATA_PATH, 'table-data', 'heroes');
  console.log(`📁 Scanning heroes from: ${heroesDataPath}`);
  
  if (!fs.existsSync(heroesDataPath)) {
    console.error(`❌ ERROR: Heroes data path not found: ${heroesDataPath}`);
    console.log(`❌ Current working directory: ${process.cwd()}`);
    return [];
  }
  
  let heroFiles = [];
  try {
    heroFiles = fs.readdirSync(heroesDataPath).filter(file => {
      return file.endsWith('.json') && file !== 'heroes.json';
    });
    console.log(`📁 Found ${heroFiles.length} hero JSON files`);
  } catch (error) {
    console.error('❌ Error reading heroes directory:', error);
    return [];
  }
  
  const heroes = [];
  const releaseOrder = loadReleaseOrder();
  
  heroFiles.forEach(fileName => {
    try {
      const heroJsonPath = path.join(heroesDataPath, fileName);
      const heroData = JSON.parse(fs.readFileSync(heroJsonPath, 'utf8'));
      const heroName = heroData.infos?.name || fileName.replace('.json', '');
      const releaseIndex = releaseOrder.indexOf(heroName);
      
      // Vérifier si l'image existe
      const imagePath = path.join(KINGSRAID_DATA_PATH, 'assets', 'heroes', heroName, 'ico.png');
      const hasImage = fs.existsSync(imagePath);
      
      heroes.push({
        id: heroName,
        name: heroName,
        role: heroData.infos?.class || getRoleFromName(heroName),
        rarity: 5,
        image: `/kingsraid-data/assets/heroes/${heroName}/ico.png`,
        releaseOrder: releaseIndex,
        hasReleaseOrder: releaseIndex !== -1,
        hasImage: hasImage,
        _debug: {
          jsonPath: heroJsonPath,
          imagePath: imagePath,
          imageExists: hasImage
        }
      });
      
    } catch (error) {
      console.error(`❌ Error reading hero file ${fileName}:`, error.message);
    }
  });
  
  console.log(`📊 Prepared ${heroes.length} heroes from data`);
  return heroes;
}

function sortHeroes(heroes, sortType) {
  const releaseOrder = loadReleaseOrder();
  
  switch (sortType) {
    case 'release':
      return heroes.sort((a, b) => {
        const indexA = releaseOrder.indexOf(a.name);
        const indexB = releaseOrder.indexOf(b.name);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
      
    case 'name':
    default:
      return heroes.sort((a, b) => a.name.localeCompare(b.name));
  }
}

function getRoleFromName(name) {
  const roleMap = {
    Kasel: 'Warrior',
    Frey: 'Priest',
    Cleo: 'Wizard',
    Clause: 'Knight',
    Roi: 'Assassin',
    Selene: 'Archer',
    Lakrak: 'Mechanic'
  };
  
  return roleMap[name] || 'Unknown';
}

// Routes temporaires pour les équipes (stockage en mémoire)
const teams = new Map();

app.post('/api/teams', (req, res) => {
  try {
    const teamData = req.body;
    
    if (!teamData || !teamData.h) {
      return res.status(400).json({ error: 'Invalid team data' });
    }
    
    const title = teamData.t || 'Unknown Team';
    const teamId = generateShortId();
    
    teams.set(teamId, {
      id: teamId,
      title: title,
      data: teamData,
      createdAt: new Date(),
      accessCount: 0
    });
    
    console.log(`✅ Team saved: ${teamId} - ${title}`);
    
    res.json({
      success: true,
      id: teamId,
      message: 'Team saved successfully'
    });
  } catch (error) {
    console.error('❌ Error saving team:', error);
    res.status(500).json({ error: 'Failed to save team' });
  }
});

app.get('/api/teams/:id', (req, res) => {
  try {
    const teamId = req.params.id;
    const team = teams.get(teamId);
    
    if (team) {
      team.accessCount++;
      console.log(`📂 Team loaded: ${teamId} (access #${team.accessCount})`);
      
      res.json({
        success: true,
        data: team.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
  } catch (error) {
    console.error('❌ Error loading team:', error);
    res.status(500).json({ error: 'Failed to load team' });
  }
});

function generateShortId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Kings Raid Planner API',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    endpoints: {
      v1: {
        heroes: '/api/heroes',
        debug: '/api/debug'
      },
      v2: {
        heroes: '/api/v2/heroes',
        teams: '/api/v2/teams',
        health: '/api/health'
      }
    }
  });
});

// Démarrer le serveur
app.listen(SERVER_PORT, () => {
  console.log(`🚀 KingsRaid API Server running on http://localhost:${SERVER_PORT}`);
  console.log(`📁 Data path: ${KINGSRAID_DATA_PATH}`);
  console.log(`📊 MongoDB: ${MONGODB_URI}`);
  console.log(`🔗 Debug endpoint: http://localhost:${SERVER_PORT}/api/debug`);
  console.log(`👥 Heroes (JSON): http://localhost:${SERVER_PORT}/api/heroes`);
  console.log(`👥 Heroes (MongoDB): http://localhost:${SERVER_PORT}/api/v2/heroes`);
  console.log(`🏥 Health: http://localhost:${SERVER_PORT}/api/health`);
});

module.exports = app;