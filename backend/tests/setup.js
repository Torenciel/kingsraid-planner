const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");

async function connectTestDB() {
  const uri = process.env.MONGODB_URI.replace(
    /\/([^/?]+)(\?|$)/,
    "/kingsraid-test$2"
  );
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

async function disconnectTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

module.exports = { connectTestDB, disconnectTestDB };
