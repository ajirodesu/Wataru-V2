const fs = require("fs-extra");
const path = require("path");

const meta = {
  name: "adminonly",
  aliases: ["adonly", "onlyad", "onlyadmin"],
  prefix: true, // adjust as needed
  version: "1.5",
  author: "NTKhang",
  cooldown: 5,
  type: "admin",
  description: "Turn on/off admin-only mode for the bot (global)",
  category: "owner",
  guide: [
    "[on | off]: Turn on/off global admin-only mode"
  ]
};

async function onStart({ wataru, args }) {
  // Use the configuration file at app/config.json relative to the cwd.
  const configPath = path.join(process.cwd(), "json/config.json");
  let config = global.config; // global.config is already loaded

  if (!args[0]) {
    return wataru.reply("Syntax error: please specify 'on' or 'off'.");
  }

  const input = args[0].toLowerCase();
  if (input !== "on" && input !== "off") {
    return wataru.reply("Syntax error: only 'on' or 'off' are allowed.");
  }

  // "on" means enabling admin-only mode.
  const value = input === "on";
  config.adminOnly = value;

  // Write the updated configuration back to app/config.json.
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  return wataru.reply(value
    ? "Bot admin-only mode has been enabled. Only bot admins can use the bot."
    : "Bot admin-only mode has been disabled. Everyone can use the bot.");
};
module.exports = { meta, onStart };
