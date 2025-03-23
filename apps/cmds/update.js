"use strict";

const path = require("path");
const updater = require(path.join(process.cwd(), "update"));

exports.meta = {
  name: "update",
  aliases: [],
  prefix: "both",
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Updates the bot to the latest version from GitHub.",
  guide: [],
  cooldown: 10,
  type: "admin",
  category: "system",
};

/**
 * Handles the /update command in Telegram.
 * @param {Object} params - Wataru bot framework parameters.
 */
exports.onStart = async function({ wataru, chatId, msg }) {
  // Optional: Restrict to bot owner (uncomment and set your ID)
  // const ownerId = "YOUR_TELEGRAM_ID";
  // if (msg.from.id.toString() !== ownerId) {
  //   return wataru.reply("Only the bot owner can update the bot.");
  // }

  try {
    await wataru.reply("Starting update process...");
    await updater.updateBot();
    await wataru.reply("Update completed successfully!");
    await wataru.reply("Restarting bot now...");
    process.exit(1); // Trigger restart via index.js
  } catch (error) {
    const errorMsg = `Failed to update the bot: ${error.message || "Unknown error"}`;
    console.error(`[ERROR] ${errorMsg}`);
    await wataru.reply(errorMsg);
  }
};

/**
 * Shell entry point for `node update`.
 */
if (require.main === module) {
  console.log("Running update from shell...");
  updater.updateBot()
    .then(() => {
      console.log("Shell update completed successfully. Restarting...");
      process.exit(1); // Trigger restart
    })
    .catch((error) => {
      const errorMsg = `Shell update failed: ${error.message || "Unknown error"}`;
      console.error(`[ERROR] ${errorMsg}`);
      process.exit(2); // Exit with error code (no restart)
    });
}