const fs = require('fs');
const path = require('path');

const meta = {
  name: "resetdb",
  aliases: ["cleardb", "dbreset"],
  prefix: "both",
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Reset the bot's database and restart",
  guide: ["resetdb"],
  cooldown: 10,
  type: "admin",  // Assuming this should be restricted to admins
  category: "system"
};

async function onStart({ wataru, chatId, msg, usages }) {
  try {
    // Define the database path
    const dbPath = path.join(process.cwd(), 'system', 'database', 'wataru.db');

    // Check if database exists
    if (!fs.existsSync(dbPath)) {
      await wataru.reply("No database found to reset.");
      return;
    }

    // Delete the database file
    fs.unlinkSync(dbPath);

    // Send confirmation message
    await wataru.reply("Database has been reset successfully. Restarting bot now...");

    // Trigger restart by exiting with code 1 (matches index.js restart condition)
    process.exit(1);

  } catch (error) {
    console.error("Error resetting database:", error);
    await wataru.reply("An error occurred while resetting the database: " + error.message);
  }
};
module.exports = { meta, onStart };
