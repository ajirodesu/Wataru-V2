// chatKeyword.js

// Command metadata for documentation and configuration
exports.meta = {
  name: "chatKeyword",
  aliases: ["keyword"],  // Optional aliases
  prefix: "both",        // Works for both prefixed commands and chat messages
  version: "1.0.0",
  author: "Your Name",
  description: "Detects the keyword 'hello' in any message and responds accordingly.",
  guide: ["Simply include the word 'hello' in your message."],
  cooldown: 5,
  type: "anyone",
  category: "chat"
};

// onChat handler: gets invoked for every message (not just commands)
exports.onChat = async function({ bot, wataru, msg, chatId, args }) {
  // Define the keyword to detect (case-insensitive)
  const keyword = "hello";

  // Ensure the message contains text
  if (!msg.text) return;

  // Check if the message text includes the keyword
  if (msg.text.toLowerCase().includes(keyword)) {
    try {
      // Respond to the chat when the keyword is detected
      await bot.sendMessage(chatId, `I detected the word "${keyword}" in your message!`);
    } catch (error) {
      console.error("Error sending message in onChat command:", error);
    }
  }
};

exports.onStart = async function({ bot, wataru, msg, chatId, args }) {
  wataru.reply("Hey");
};
