const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const app = express();
const SERVER_PORT = process.env.SERVER_PORT || 3002;

/*
|--------------------------------------------------------------------------
| Paths
|--------------------------------------------------------------------------
*/

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
const PUBLIC_PATH = path.join(PROJECT_ROOT, 'kingsraid-planner', 'frontend', 'public');
const KINGSRAID_DATA_PATH = path.join(PUBLIC_PATH, 'kingsraid-data');

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://kingsraid-planner.com",
  "https://www.kingsraid-planner.com",
  "https://kingsraid-planner.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| MongoDB Connection
|--------------------------------------------------------------------------
*/

// Fallback connection local
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    console.log(`Database: ${mongoose.connection.db.databaseName}`);
    console.log(`Host: ${mongoose.connection.host}`);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

/*
|--------------------------------------------------------------------------
| Static Files
|--------------------------------------------------------------------------
*/

app.use('/kingsraid-data', express.static(KINGSRAID_DATA_PATH));

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

const routes = require('./routes');
app.use('/', routes);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Kings Raid Planner API',
    timestamp: new Date().toISOString(),
    mongodb: {
      connected: mongoose.connection.readyState === 1,
      database: mongoose.connection.db?.databaseName || 'N/A',
    },
  });
});

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
  });
});

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(SERVER_PORT, () => {
  console.log('--------------------------------------------------');
  console.log(`Server running on http://localhost:${SERVER_PORT}`);
  console.log('API v2 endpoints:');
  console.log(`  Heroes:    http://localhost:${SERVER_PORT}/api/v2/heroes`);
  console.log(`  Teams:     http://localhost:${SERVER_PORT}/api/v2/teams`);
  console.log(`  Perks:     http://localhost:${SERVER_PORT}/api/v2/perks`);
  console.log(`  Artifacts: http://localhost:${SERVER_PORT}/api/v2/artifacts`);
  console.log(`  Gearsets:  http://localhost:${SERVER_PORT}/api/v2/gearsets`);
  console.log(`  Health:    http://localhost:${SERVER_PORT}/api/health`);
  console.log('--------------------------------------------------');
});

module.exports = app;
