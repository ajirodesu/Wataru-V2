exports.meta = {
  name: "uptime",
  aliases: ["up"],
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Shows the bot's uptime with a personalized greeting.",
  guide: [""],
  cooldown: 5,
  type: "anyone",
  category: "info"
};

exports.onStart = async function({ bot, chatId, msg, args }) {
  // Retrieve the user's actual name (combine first and last name if available)
  let userName = msg.from.first_name;
  if (msg.from.last_name) {
    userName += " " + msg.from.last_name;
  }

  // Get the uptime in seconds and convert to days, hours, minutes, and seconds
  let uptimeSeconds = process.uptime();
  const days = Math.floor(uptimeSeconds / (3600 * 24));
  uptimeSeconds %= 3600 * 24;
  const hours = Math.floor(uptimeSeconds / 3600);
  uptimeSeconds %= 3600;
  const minutes = Math.floor(uptimeSeconds / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  // Build a human-readable uptime string.
  // Only include days if it's non-zero.
  let uptimeStr = "";
  if (days > 0) {
    uptimeStr += `${days} day${days !== 1 ? "s" : ""}, `;
  }
  uptimeStr += `${hours} hour${hours !== 1 ? "s" : ""}, `;
  uptimeStr += `${minutes} minute${minutes !== 1 ? "s" : ""} and `;
  uptimeStr += `${seconds} second${seconds !== 1 ? "s" : ""}`;

  // Send the personalized uptime message to the chat
  const message = `Greetings Master ${userName}, I've been running for ${uptimeStr}.`;
  await bot.sendMessage(chatId, message);
};