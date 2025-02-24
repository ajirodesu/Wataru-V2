const fs = require('fs');
const path = require('path');

// Command configuration
exports.meta = {
  name: "admin",
  aliases: ["admins", "ad"],
  version: "0.0.1",
  type: "anyone",
  category: "system",
  description: "Admin management command",
  cooldown: 0,
  guide: "[add/list/remove]",
  author: "AjiroDesu"
};

// Command initialization
exports.onStart = async function ({ wataru, bot, chatId, msg, args, usages }) {

  // Define the path to the config.json file in the json folder
  const configPath = path.join(process.cwd(), 'json', 'config.json');

  // Read the config file
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error("Error reading config.json:", error);
    return wataru.reply("An error occurred while accessing the admin list.");
  }

  let admins = config.admin || [];
  let command = args[0];
  let targetId = args[1] || (msg.reply_to_message ? msg.reply_to_message.from.id : null);

  // Extract user ID from mentions if present
  if (msg.reply_to_message && !targetId) {
    targetId = msg.reply_to_message.from.id;
  } else if (args.length > 1) {
    targetId = args[1];
  }

  // Function to get user info by ID using wataru
  async function getUserInfo(userId) {
    try {
      const userInfo = await bot.getChat(userId);
      return userInfo;
    } catch (err) {
      console.error("Error fetching user info:", err);
      return null;
    }
  }

  // Handle the 'list' command
  if (command === "list") {
    if (admins.length === 0) {
      return wataru.reply("There are currently no admins.");
    }
    let message = "List of System Admins:\n\n";
    for (let adminId of admins) {
      try {
        const userInfo = await getUserInfo(adminId);
        if (userInfo) {
          const name = userInfo.first_name + ' ' + (userInfo.last_name || '');
          message += `${config.symbols || ''} ${name}\nhttps://t.me/${userInfo.username || adminId}\n\n`;
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    }
    return wataru.reply(message);
  }

  // Handle the 'add' command
  if (command === "add" || command === "-a" || command === "a") {
    if (!admins.includes(msg.from.id.toString())) {
      return wataru.reply("You don't have permission to use this command. Only admins can use this method.");
    }
    let id = parseInt(targetId);
    if (isNaN(id)) {
      return wataru.reply("⚠️ The ID provided is invalid.");
    }
    if (admins.includes(id.toString())) {
      return wataru.reply("This user is already an admin.");
    }
    admins.push(id.toString());
    config.admin = admins; // Update the admin list in the config

    // Save the updated config to config.json
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
      console.error("Error writing to config.json:", error);
      return wataru.reply("Failed to update admin list.");
    }

    const userInfo = await getUserInfo(id);
    const userName = userInfo ? `${userInfo.first_name} ${userInfo.last_name || ''}` : 'User';
    return wataru.reply(`${userName} has been successfully added as an admin.`);
  }

  // Handle the 'remove' command
  if (command === "remove" || command === "-r" || command === "r") {
    if (!admins.includes(msg.from.id.toString())) {
      return wataru.reply("You don't have permission to use this command. Only admins can use this method.");
    }
    if (admins.length === 0) {
      return wataru.reply("There are no admins to remove.");
    }
    let id = parseInt(targetId);
    if (isNaN(id)) {
      return wataru.reply("⚠️ The ID provided is invalid.");
    }
    if (!admins.includes(id.toString())) {
      return wataru.reply("This user is not an admin.");
    }
    config.admin = admins.filter(a => a !== id.toString()); // Remove the admin from the config

    // Save the updated config to config.json
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
      console.error("Error writing to config.json:", error);
      return wataru.reply("Failed to update admin list.");
    }

    const userInfo = await getUserInfo(id);
    const userName = userInfo ? `${userInfo.first_name} ${userInfo.last_name || ''}` : 'User';
    return wataru.reply(`${userName} has been successfully removed as an admin.`);
  }

  // Handle invalid or unknown commands
  return usages();
};
