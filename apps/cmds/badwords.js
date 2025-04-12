const meta = {
  name: "badwords",
  version: "1.4",
  aliases: ["badword"],
  description: "Manage banned words in the group. Admins can add, delete, list, turn on/off the warning system, and unwarn users.",
  author: "NTKhang",
  prefix: "both",
  category: "moderation",
  type: "administrator",
  cooldown: 5,
  guide: [
    "add <words>: add banned words (separate multiple words with commas or vertical bars)",
    "delete <words>: delete banned words",
    "list [hide]: show the list of banned words (use 'hide' to mask words)",
    "on: turn on banned words warning",
    "off: turn off banned words warning",
    "unwarn <userID> or reply to a message: remove 1 warning from a user"
  ]
};

/**
 * Handles the execution of the badwords command based on subcommands.
 * @param {Object} params - Parameters including bot, args, wataru, msg, and db.
 */
async function onStart({ bot, args, wataru, msg, db }) {
  try {
    // Ensure the command is used in a group
    if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
      return wataru.reply("This command can only be used in groups.");
    }

    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Helper function to check if the user is an admin
    async function isAdmin() {
      const member = await bot.getChatMember(chatId, userId);
      return member.status === 'administrator' || member.status === 'creator';
    }

    // Retrieve group data
    const groupData = (await db.getGroup(chatId)) || {};
    let badWordsData = {
      enabled: groupData.badwords_enabled || 0,
      words: groupData.badwords_words ? JSON.parse(groupData.badwords_words) : [],
      violationUsers: groupData.badwords_violations ? JSON.parse(groupData.badwords_violations) : {}
    };

    const subcommand = args[0]?.toLowerCase();
    if (!subcommand) {
      // Join the guide array into a single string separated by newlines.
      return wataru.reply(meta.guide.join("\n"));
    }

    switch (subcommand) {
      case "add": {
        if (!(await isAdmin())) {
          return wataru.reply("⚠️ | Only admins can add banned words to the list");
        }
        const words = args.slice(1)
          .join(" ")
          .split(/[,|]/)
          .map(w => w.trim())
          .filter(w => w);
        if (!words.length) {
          return wataru.reply("⚠️ | You haven't entered the banned words");
        }
        const success = [];
        const alreadyExist = [];
        const tooShort = [];
        for (const word of words) {
          if (badWordsData.words.includes(word)) {
            alreadyExist.push(word);
          } else if (word.length < 2) {
            tooShort.push(word);
          } else {
            badWordsData.words.push(word);
            success.push(word);
          }
        }
        await db.runQuery(
          "UPDATE groups SET badwords_words = ? WHERE group_id = ?",
          [JSON.stringify(badWordsData.words), chatId]
        );
        let reply = "";
        if (success.length)
          reply += `✅ | Added ${success.length} banned words to the list\n`;
        if (alreadyExist.length)
          reply += `❌ | ${alreadyExist.length} banned words already exist: ${alreadyExist.map(hideWord).join(", ")}\n`;
        if (tooShort.length)
          reply += `⚠️ | ${tooShort.length} banned words are too short: ${tooShort.join(", ")}\n`;
        return wataru.reply(reply.trim());
      }

      case "delete":
      case "del":
      case "-d": {
        if (!(await isAdmin())) {
          return wataru.reply("⚠️ | Only admins can delete banned words from the list");
        }
        const words = args.slice(1)
          .join(" ")
          .split(/[,|]/)
          .map(w => w.trim())
          .filter(w => w);
        if (!words.length) {
          return wataru.reply("⚠️ | You haven't entered the words to delete");
        }
        const success = [];
        const notExist = [];
        for (const word of words) {
          const index = badWordsData.words.indexOf(word);
          if (index !== -1) {
            badWordsData.words.splice(index, 1);
            success.push(word);
          } else {
            notExist.push(word);
          }
        }
        await db.runQuery(
          "UPDATE groups SET badwords_words = ? WHERE group_id = ?",
          [JSON.stringify(badWordsData.words), chatId]
        );
        let reply = "";
        if (success.length)
          reply += `✅ | Deleted ${success.length} banned words from the list\n`;
        if (notExist.length)
          reply += `❌ | ${notExist.length} banned words do not exist: ${notExist.join(", ")}\n`;
        return wataru.reply(reply.trim());
      }

      case "list":
      case "all":
      case "-a": {
        if (!badWordsData.words.length) {
          return wataru.reply("⚠️ | The list of banned words in your group is currently empty");
        }
        const hide = args[1]?.toLowerCase() === "hide";
        const list = hide
          ? badWordsData.words.map(hideWord).join(", ")
          : badWordsData.words.join(", ");
        return wataru.reply(`📑 | The list of banned words in your group: ${list}`);
      }

      case "on": {
        if (!(await isAdmin())) {
          return wataru.reply("⚠️ | Only admins can turn on this feature");
        }
        badWordsData.enabled = 1;
        await db.runQuery(
          "UPDATE groups SET badwords_enabled = 1 WHERE group_id = ?",
          [chatId]
        );
        return wataru.reply("✅ | Banned words warning has been turned on");
      }

      case "off": {
        if (!(await isAdmin())) {
          return wataru.reply("⚠️ | Only admins can turn off this feature");
        }
        badWordsData.enabled = 0;
        await db.runQuery(
          "UPDATE groups SET badwords_enabled = 0 WHERE group_id = ?",
          [chatId]
        );
        return wataru.reply("✅ | Banned words warning has been turned off");
      }

      case "unwarn": {
        if (!(await isAdmin())) {
          return wataru.reply("⚠️ | Only admins can remove banned words warnings");
        }
        let targetUserId;
        if (msg.reply_to_message) {
          targetUserId = msg.reply_to_message.from.id;
        } else if (args[1]) {
          targetUserId = args[1];
        }
        if (!targetUserId || isNaN(targetUserId)) {
          return wataru.reply("⚠️ | You haven't entered user ID or replied to a user's message");
        }
        if (!badWordsData.violationUsers[targetUserId]) {
          return wataru.reply(`⚠️ | User ${targetUserId} has not been warned for banned words`);
        }
        badWordsData.violationUsers[targetUserId]--;
        if (badWordsData.violationUsers[targetUserId] <= 0) {
          delete badWordsData.violationUsers[targetUserId];
        }
        await db.runQuery(
          "UPDATE groups SET badwords_violations = ? WHERE group_id = ?",
          [JSON.stringify(badWordsData.violationUsers), chatId]
        );
        const userName = (await bot.getChatMember(chatId, targetUserId)).user.first_name;
        return wataru.reply(`✅ | Removed banned words warning of user ${targetUserId} | ${userName}`);
      }

      default:
        return wataru.reply(meta.guide.join("\n"));
    }
  } catch (error) {
    console.error(`[ badwords ] » ${error}`);
    return wataru.reply("[ badwords ] » An error occurred.");
  }
}

/**
 * Monitors chat messages for banned words and takes action if detected.
 * @param {Object} params - Parameters including bot, wataru, msg, chatId, and db.
 */
async function onChat({ bot, wataru, msg, chatId, db }) {
  try {
    if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') return;
    const groupData = await db.getGroup(chatId);
    if (!groupData || !groupData.badwords_enabled) return;
    const badWords = groupData.badwords_words ? JSON.parse(groupData.badwords_words) : [];
    if (!badWords.length) return;
    let violationUsers = groupData.badwords_violations ? JSON.parse(groupData.badwords_violations) : {};

    // Skip if the message is a badwords command
    const prefix = groupData.prefix || '';
    const isCommand = ["badwords", "badword"].some(alias => msg.text?.startsWith(prefix + alias));
    if (isCommand) return;

    for (const word of badWords) {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      if (msg.text && regex.test(msg.text)) {
        const userId = msg.from.id;
        const currentViolations = violationUsers[userId] || 0;
        if (currentViolations < 1) {
          await wataru.reply(`⚠️ | Banned words "${word}" detected in your message. Next violation will result in a kick.`);
          violationUsers[userId] = 1;
        } else {
          await wataru.reply(`⚠️ | Banned words "${word}" detected again. You have been kicked for repeated violations.`);
          try {
            await bot.banChatMember(chatId, userId);
            delete violationUsers[userId];
          } catch (error) {
            if (error.response && error.response.statusCode === 403) {
              await wataru.reply("Bot needs admin privileges to kick banned members");
            }
          }
        }
        await db.runQuery(
          "UPDATE groups SET badwords_violations = ? WHERE group_id = ?",
          [JSON.stringify(violationUsers), chatId]
        );
        break; // Handle one violation per message
      }
    }
  } catch (error) {
    console.error(`[ badwords onChat ] » ${error}`);
  }
}

/**
 * Masks a word by replacing middle characters with asterisks.
 * @param {string} str - The word to mask.
 * @returns {string} - The masked word.
 */
function hideWord(str) {
  if (str.length === 2) return str[0] + "*";
  return str[0] + "*".repeat(str.length - 2) + str[str.length - 1];
}

module.exports = { meta, onStart, onChat };
