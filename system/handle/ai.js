const axios = require('axios');
exports.ai = async function({ bot, msg, chatId, wataru, db }) {
  // Ensure the message is from a private chat and contains text
  if (msg.chat.type === 'private' && msg.text) {
    // Check if the message is a reply to a previous message
    if (msg.reply_to_message) {
      // Don't respond if it's a reply
      return;
    }

    const text = msg.text.trim();
    // Exit if the message starts with the prefix (command)
    if (text.startsWith(global.config.prefix)) return;
    // Access the commands map
    const { commands } = global.client;
    // Check if the first token matches a no-prefix or "both" command
    const tokens = text.split(/\s+/);
    if (tokens.length > 0) {
      const firstToken = tokens[0].toLowerCase();
      for (const cmd of commands.values()) {
        if (cmd.meta.prefix === false || cmd.meta.prefix === "both") {
          if (cmd.meta.name.toLowerCase() === firstToken) return;
          if (
            cmd.meta.aliases &&
            Array.isArray(cmd.meta.aliases) &&
            cmd.meta.aliases.map(alias => alias.toLowerCase()).includes(firstToken)
          ) {
            return;
          }
        }
      }
    }
    // If not a command, proceed to query the API
    await bot.sendChatAction(msg.chat.id, 'typing');
    const query = encodeURIComponent(text);
    const apiUrl = `${global.api.hazeyy}/api/gpt4o/search?content=${query}`;
    try {
      const response = await axios.get(apiUrl);
      const answer = response.data.answer || 'No answer found.';
      wataru.reply(answer);
    } catch (error) {
      console.error(error);
      wataru.reply('Sorry, something went wrong.');
    }
  }
};