// backend/scripts/clearGearSets.js
const mongoose = require('mongoose');
const path = require('path');

// Load .env from the correct path
require('dotenv').config({
  path: path.join(__dirname, '..', '.env')
});

async function clearGearSets() {
  try {
    console.log('CLEARING GEARSETS COLLECTION');
    console.log('='.repeat(60));

    // Use your URI
    const mongoURI = process.env.MONGODB_URI;
    console.log(`Connecting to: ${mongoURI}`);

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if the model already exists
    let GearSet;
    try {
      GearSet = mongoose.model('GearSet');
    } catch (e) {
      // Create a temporary model if needed
      const GearSetSchema = new mongoose.Schema({
        slug: String,
        name: String,
        thumbnail: String,
        bonus2P: String,
        bonus4P: String,
        sortOrder: Number
      });
      GearSet = mongoose.model('GearSet', GearSetSchema);
    }

    // Delete ALL documents
    const deleteResult = await GearSet.deleteMany({});
    console.log(`${deleteResult.deletedCount} gear sets deleted`);

    // Try to drop indexes
    try {
      await GearSet.collection.dropIndexes();
      console.log('Indexes dropped');
    } catch (indexError) {
      console.log('Note on indexes:', indexError.message);
    }

    await mongoose.disconnect();
    console.log('\nOperation complete!');
    console.log('You can now run: node backend/scripts/importGearSets.js');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\nMongoDB is not running!');
      console.error('Start MongoDB with: mongod --dbpath ./data/db');
      console.error('Or use MongoDB Compass to check the connection.');
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  clearGearSets();
}

module.exports = { clearGearSets };
