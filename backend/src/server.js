const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const app = require('./app');

const SERVER_PORT = process.env.SERVER_PORT || 3002;
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
