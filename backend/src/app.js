const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
const PUBLIC_PATH = path.join(PROJECT_ROOT, 'kingsraid-planner', 'frontend', 'public');
const KINGSRAID_DATA_PATH = path.join(PUBLIC_PATH, 'kingsraid-data');

app.set("trust proxy", 1);
app.use(helmet());

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
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use('/kingsraid-data', express.static(KINGSRAID_DATA_PATH));

const routes = require('./routes');
app.use('/', routes);

app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
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

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
  });
});

module.exports = app;
