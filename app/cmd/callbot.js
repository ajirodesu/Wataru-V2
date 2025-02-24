exports.meta = {
  name: "callbot",
  keyword: ["bot"],
  aliases: [],
  version: "40.0.3",
  author: "John Lester",
  description: "Automatically responds when someone mentions 'bot'.",
  guide: [""],
  cooldown: 60,
  type: "anyone",
  category: "hidden"
};

// Array of random responses.
const randomResponses = [
  "Hello, my name is {botname}.",
  "What exactly do you want me to do?",
  "Love you <3",
  "Hi, hello baby wife :3",
  "To contact admin, use callad!",
  "You're the most adorable bot on the planet.",
  "It's me~~~~"
];

/**
 * Fetches the bot's name using node-telegram-bot-api.
 */
async function getBotName(bot) {
  const botInfo = await bot.getMe();
  return botInfo.first_name || "Bot";
}

/**
 * onStart is called when the command is invoked directly.
 * Here, we assume that `wataru` has already been attached to the parameter.
 */
exports.onStart = async function ({ bot, msg, wataru }) {
  const botname = await getBotName(bot);
  const name = msg.from.first_name || "User";
  const response =
    randomResponses[Math.floor(Math.random() * randomResponses.length)]
      .replace("{botname}", botname);

  // Use wataru.reply to send a message.
  await wataru.reply(`${name}, ${response}`);
};

/**
 * onWord is triggered by the global event handler
 * whenever a message contains any of the keywords.
 */
exports.onWord = async function ({ bot, msg, wataru }) {
  const botname = await getBotName(bot);
  const name = (`${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim()) || "User";
  const response =
    randomResponses[Math.floor(Math.random() * randomResponses.length)]
      .replace("{botname}", botname);

  // Use wataru.reply to automatically include reply_to_message_id in non-private chats.
  await wataru.reply(`${name}, ${response}`);
};
