const moment = require("moment-timezone");

// In‑memory cooldown tracker (per user)
const cooldowns = {};

/**
 * greet
 *
 * Called on every incoming message.
 *
 * @param {object} options
 * @param {object} options.bot - An instance of node-telegram-bot-api.
 * @param {object} options.msg - The incoming message object.
 * @param {Array<string>} [options.args] - Optional pre-parsed message tokens.
 */
exports.greet = async function({ bot, wataru, msg, args }) {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (!msg.text) return;

    const text = msg.text.trim();

    // If the message starts with the prefix, assume it's a command.
    if (text.startsWith(global.config.prefix)) return;

    // Also check if the first token matches a no‑prefix or "both" command.
    const tokens = text.split(/\s+/);
    if (tokens.length > 0) {
      const firstToken = tokens[0].toLowerCase();
      for (const cmd of global.client.commands.values()) {
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

    // If no args are provided, parse them from the text.
    if (!args || args.length === 0) {
      args = text.split(/\s+/);
    }

    // List of greeting keywords (case-insensitive)
    const greetingKeywords = ["hi", "hello", "hai", "yo", "hallow", "hola", "low"];
    const detected = args.find(word => greetingKeywords.includes(word.toLowerCase()));
    if (!detected) return;

    // Cooldown check (per user)
    const cooldownKey = "greet" + userId;
    const nowTimestamp = Date.now();
    if (cooldowns[cooldownKey] && nowTimestamp < cooldowns[cooldownKey]) return;
    cooldowns[cooldownKey] = nowTimestamp + 60 * 1000; // 60-second cooldown

    // Ignore messages from bots.
    if (msg.from.is_bot) return;

    // Get real-time info using moment-timezone.
    const timeZone = global.config.timeZone; // Ensure this is set in your global config.
    const nowMoment = moment().tz(timeZone);
    const currentTime = nowMoment.format("HH:mm:ss");
    const formattedLong = nowMoment.format("LLLL");
    const monthDay = nowMoment.format("MM-DD");

    // Default greeting based on time.
    const defaultGreeting =
      currentTime >= "00:00:00" && currentTime <= "04:59:59" ? "Good morning" :
      currentTime >= "05:00:00" && currentTime <= "06:59:59" ? "Let's eat breakfast" :
      currentTime >= "07:00:00" && currentTime <= "10:59:59" ? "Good morning" :
      currentTime >= "11:00:00" && currentTime <= "12:59:59" ? "Let's eat lunch" :
      currentTime >= "13:00:00" && currentTime <= "17:59:59" ? "Good afternoon" :
      currentTime >= "18:00:00" && currentTime <= "19:59:59" ? "Let's eat dinner" :
      "Good evening";

    // Day‑of‑week greeting options.
    let dayGreetingOptions = [];
    const upperLong = formattedLong.toUpperCase();
    if (upperLong.includes("SUN")) {
      dayGreetingOptions = ["have a great Sunday", defaultGreeting, "have a nice day"];
    } else if (upperLong.includes("MON")) {
      dayGreetingOptions = ["have a great Monday", defaultGreeting, "have a nice day"];
    } else if (upperLong.includes("TUE")) {
      dayGreetingOptions = ["have a great Tuesday", defaultGreeting, "have a nice day"];
    } else if (upperLong.includes("WED")) {
      dayGreetingOptions = ["have a great Wednesday", defaultGreeting, "have a nice day"];
    } else if (upperLong.includes("THU")) {
      dayGreetingOptions = ["have a great Thursday", defaultGreeting, "have a nice day"];
    } else if (upperLong.includes("FRI")) {
      dayGreetingOptions = ["have a great Friday", defaultGreeting, "have a nice day"];
    } else if (upperLong.includes("SAT")) {
      dayGreetingOptions = ["have a great Saturday", defaultGreeting, "have a nice day"];
    }

    // Define special greetings for specific days.
    const specialGreetings = {
      "01-01": ["Happy New Year! 🎉 Wishing you a fantastic start to the year!"],
      "02-14": ["Happy Valentine's Day! 💖 Spread the love today!"],
      "04-01": ["Happy April Fools' Day! 😆 Enjoy the fun and pranks!"],
      "11-01": ["Happy Halloween! 🎃 Trick or treat!"],
      "12-25": ["Merry Christmas! 🎄 I hope your holiday season is full of peace, joy, and happiness!"],
      "12-31": ["Happy New Year's Eve! 🥳 Let's welcome the new year with positivity!"]
    };

    // Merge any special day greetings with the regular options.
    if (specialGreetings[monthDay]) {
      dayGreetingOptions = specialGreetings[monthDay].concat(dayGreetingOptions);
    }

    // Choose a random greeting message.
    const greetingMessage = dayGreetingOptions[Math.floor(Math.random() * dayGreetingOptions.length)];

    // Choose a random emoji.
    const emojiList = [
      "😁", "😉", "🥰", "🤩", "🥳",
      "😇", "😊", "☺️", "🤗", "❤️", "💗"
    ];
    const randomEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];

    // Send the greeting.
    await bot.sendMessage(
      chatId,
      `Hi <b>${msg.from.first_name}</b>, ${greetingMessage} ${randomEmoji}`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    console.error("Error in greet:", error);
  }
};
