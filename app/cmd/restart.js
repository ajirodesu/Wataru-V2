"use strict";

const fs = require("fs-extra");
const path = require("path");

exports.meta = {
  name: "restart",
  aliases: [],
  prefix: "command", // Adjust if Wataru uses "both" or similar
  version: "1.1",
  author: "NTKhang",
  cooldown: 5,
  type: "admin",
  description: "Restart bot",
  category: "Owner",
  guide: ["Restart bot"],
};

/**
 * Handles the /restart command in Telegram.
 * @param {Object} params - Wataru bot framework parameters.
 */
exports.onStart = async function({ wataru, chatId, msg }) {
  const assetsDir = path.join(__dirname, "assets");
  fs.ensureDirSync(assetsDir);

  const restartFile = path.join(assetsDir, "restart.txt");

  // Check for previous restart data
  if (fs.existsSync(restartFile)) {
    const data = fs.readFileSync(restartFile, "utf-8").trim();
    if (data) {
      const [tid, timeValue] = data.split(" ");
      if (tid && timeValue) {
        const diff = ((Date.now() - Number(timeValue)) / 1000).toFixed(2);
        await wataru.reply(`✅ | Bot restarted\n⏰ | Time: ${diff}s`);
        fs.unlinkSync(restartFile);
        return;
      }
    }
  }

  // Write restart data and initiate restart
  try {
    fs.writeFileSync(restartFile, `${chatId} ${Date.now()}`);
    await wataru.reply("🔄 | Restarting bot...");
    process.exit(1); // Trigger restart via index.js
  } catch (error) {
    console.error(`[ERROR] Failed to write restart file: ${error.message}`);
    await wataru.reply("❌ | Failed to initiate restart");
  }
}; 