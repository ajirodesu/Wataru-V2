const fs = require('fs');
const path = require('path');

// Command configuration
exports.meta = {
  name: "vip",
  version: "0.0.1",
  type: "anyone",
  category: "system",
  description: "VIP management command",
  cooldown: 0,
  guide: "[add/list/remove]",
  author: "AjiroDesu"
};

// Command initialization
exports.onStart = async function ({ bot, chatId, msg, args, usages }) {
  // Define the path to the vip.json file in the json folder
  const vipPath = path.join(process.cwd(), 'json', 'vip.json');
  
  // Read the vip file
  let vip;
  try {
    vip = JSON.parse(fs.readFileSync(vipPath, 'utf8'));
  } catch (error) {
    console.error("Error reading vip.json:", error);
    return bot.sendMessage(chatId, "An error occurred while accessing the VIP list.");
  }

  let vipList = vip.uid || [];
  let admins = global.config.admin || [];
  let command = args[0];
  let targetId = args[1] || (msg.reply_to_message ? msg.reply_to_message.from.id : null);

  // Extract user ID from mentions if present
  if (msg.reply_to_message && !targetId) {
    targetId = msg.reply_to_message.from.id;
  } else if (args.length > 1) {
    targetId = args[1];
  }

  // Function to get user info by ID
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
    if (vipList.length === 0) {
      return bot.sendMessage(chatId, "There are currently no VIPs.");
    }
    let message = "List of VIPs:\n\n";
    for (let vipId of vipList) {
      try {
        const userInfo = await getUserInfo(vipId);
        if (userInfo) {
          const name = userInfo.first_name + ' ' + (userInfo.last_name || '');
          message += `${global.config.symbols || ''} ${name}\nhttps://t.me/${userInfo.username || vipId}\n\n`;
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    }
    return bot.sendMessage(chatId, message);
  }

  // Handle the 'add' command
  if (command === "add" || command === "-a" || command === "a") {
    if (!admins.includes(msg.from.id.toString())) {
      return bot.sendMessage(chatId, "You don't have permission to use this command. Only admins can use this method.");
    }
    let id = parseInt(targetId);
    if (isNaN(id)) {
      return bot.sendMessage(chatId, "⚠️ The ID provided is invalid.");
    }
    if (vipList.includes(id.toString())) {
      return bot.sendMessage(chatId, "This user is already a VIP.");
    }
    vipList.push(id.toString());
    vip.uid = vipList; // Update the VIP list

    // Save the updated vip list to vip.json
    try {
      fs.writeFileSync(vipPath, JSON.stringify(vip, null, 2), 'utf8');
    } catch (error) {
      console.error("Error writing to vip.json:", error);
      return bot.sendMessage(chatId, "Failed to update VIP list.");
    }

    const userInfo = await getUserInfo(id);
    const userName = userInfo ? `${userInfo.first_name} ${userInfo.last_name || ''}` : 'User';
    return bot.sendMessage(chatId, `${userName} has been successfully added as a VIP.`);
  }

  // Handle the 'remove' command
  if (command === "remove" || command === "-r" || command === "r") {
    if (!admins.includes(msg.from.id.toString())) {
      return bot.sendMessage(chatId, "You don't have permission to use this command. Only admins can use this method.");
    }
    if (vipList.length === 0) {
      return bot.sendMessage(chatId, "There are no VIPs to remove.");
    }
    let id = parseInt(targetId);
    if (isNaN(id)) {
      return bot.sendMessage(chatId, "⚠️ The ID provided is invalid.");
    }
    if (!vipList.includes(id.toString())) {
      return bot.sendMessage(chatId, "This user is not a VIP.");
    }
    vip.uid = vipList.filter(v => v !== id.toString()); // Remove the VIP from the list

    // Save the updated vip list to vip.json
    try {
      fs.writeFileSync(vipPath, JSON.stringify(vip, null, 2), 'utf8');
    } catch (error) {
      console.error("Error writing to vip.json:", error);
      return bot.sendMessage(chatId, "Failed to update VIP list.");
    }

    const userInfo = await getUserInfo(id);
    const userName = userInfo ? `${userInfo.first_name} ${userInfo.last_name || ''}` : 'User';
    return bot.sendMessage(chatId, `${userName} has been successfully removed as a VIP.`);
  }

  // Handle invalid or unknown commands
  return usages();
};
