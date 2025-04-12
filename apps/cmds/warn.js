const meta = {
  name: "warn",
  version: "1.8.2", // Updated version to reflect changes
  aliases: [],
  description: "Warn a member in the group. If they receive 3 warnings, they will be banned.",
  author: "NTKhang",
  prefix: "both",
  category: "moderation",
  type: "administrator",
  cooldown: 5,
  guide: [
    "@username <reason>         - Warn a member with an optional reason",
    "list                       - View list of warned members",
    "listban                    - View list of members banned after 3 warnings",
    "info [@username|<uid>]     - View warning details for a member (or yourself if omitted)",
    "unban [@username|<uid>]    - Unban a member (remove all warnings and lift ban) [admin only]",
    "unwarn [@username|<uid>] [<number>] - Remove a specific warning (or the last one if number omitted) [admin only]",
    "reset                      - Reset all warning data in the group [admin only]",
    "Note: The bot must be an admin with 'ban users' permission to ban or unban members."
  ]
};

async function onStart({ bot, msg, args, db, wataru }) {
  try {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // Helper: Check if the sender is an admin in the group.
    async function isAdmin(userId) {
      try {
        const member = await bot.getChatMember(chatId, userId);
        return member.status === "administrator" || member.status === "creator";
      } catch (err) {
        return false;
      }
    }

    // Helper: Get a user's display name via Telegram.
    async function getUserName(uid) {
      try {
        const member = await bot.getChatMember(chatId, uid);
        if (member.user.username) return '@' + member.user.username;
        else return `${member.user.first_name || ""} ${member.user.last_name || ""}`.trim();
      } catch (err) {
        return `User(${uid})`;
      }
    }

    if (!args[0]) {
      return wataru.reply("⚠️ Syntax Error: Missing arguments.");
    }

    const subCmd = args[0].toLowerCase();

    switch (subCmd) {
      case "list": {
        const allWarns = await db.getWarnsForGroup(chatId);
        const grouped = {};
        allWarns.forEach(warn => {
          if (!grouped[warn.user_id]) grouped[warn.user_id] = [];
          grouped[warn.user_id].push(warn);
        });
        const listText = await Promise.all(Object.entries(grouped).map(async ([uid, warns]) => {
          const name = await getUserName(uid);
          return `${name} (${uid}): ${warns.length}`;
        }));
        const response = listText.length
          ? "List of members who have been warned:\n" + listText.join("\n") +
            "\n\nTo view details, use: info [@username|<uid>]"
          : "This group has no warnings.";
        return wataru.reply(response);
      }

      case "listban": {
        const allWarns = await db.getWarnsForGroup(chatId);
        const grouped = {};
        allWarns.forEach(warn => {
          if (!grouped[warn.user_id]) grouped[warn.user_id] = [];
          grouped[warn.user_id].push(warn);
        });
        const banned = await Promise.all(Object.entries(grouped).map(async ([uid, warns]) => {
          if (warns.length >= 3) {
            const name = await getUserName(uid);
            return `${name} (${uid})`;
          }
        }));
        const filtered = banned.filter(item => item);
        const response = filtered.length
          ? "List of banned members (warned 3+ times):\n" + filtered.join("\n")
          : "There are no banned members in this group.";
        return wataru.reply(response);
      }

      case "info":
      case "check": {
        let targetUid;
        if (args[1]) {
          if (!/^\d+$/.test(args[1])) {
            return wataru.reply("⚠️ Invalid user ID. Please provide a numeric user ID.");
          }
          targetUid = parseInt(args[1], 10);
        } else if (msg.reply_to_message) {
          targetUid = msg.reply_to_message.from.id;
        } else {
          targetUid = senderId;
        }
        const warns = await db.getWarnsForUser(chatId, targetUid);
        const name = await getUserName(targetUid);
        let response = `User ID: ${targetUid}\nName: ${name}\n`;
        if (!warns || warns.length === 0) {
          response += "No warning data.";
        } else {
          response += "Warning list:";
          warns.forEach((warn, index) => {
            response += `\n - Warning ${index + 1}: Reason: ${warn.reason}\n   Time: ${warn.dateTime}`;
          });
        }
        return wataru.reply(response);
      }

      case "unban": {
        if (!(await isAdmin(senderId))) {
          return wataru.reply("❌ Only group administrators can unban members.");
        }
        let targetUid;
        if (args[1]) {
          if (!/^\d+$/.test(args[1])) {
            return wataru.reply("⚠️ Invalid user ID. Please provide a numeric user ID.");
          }
          targetUid = parseInt(args[1], 10);
        } else if (msg.reply_to_message) {
          targetUid = msg.reply_to_message.from.id;
        } else {
          return wataru.reply("⚠️ Please provide a user ID or reply to a message to unban.");
        }
        await db.removeAllWarnsForUser(chatId, targetUid);
        const name = await getUserName(targetUid);
        await bot.unbanChatMember(chatId, targetUid).catch(err => {
          console.error(`Failed to unban user ${targetUid}: ${err}`);
        });
        return wataru.reply(`✅ Successfully unbanned member [${targetUid} | ${name}].`);
      }

      case "unwarn": {
        if (!(await isAdmin(senderId))) {
          return wataru.reply("❌ Only group administrators can remove warnings.");
        }
        let targetUid;
        if (args[1]) {
          if (!/^\d+$/.test(args[1])) {
            return wataru.reply("⚠️ Invalid user ID. Please provide a numeric user ID.");
          }
          targetUid = parseInt(args[1], 10);
        } else if (msg.reply_to_message) {
          targetUid = msg.reply_to_message.from.id;
        } else {
          return wataru.reply("⚠️ Please provide a user ID or reply to a message.");
        }
        const warns = await db.getWarnsForUser(chatId, targetUid);
        if (!warns || warns.length === 0) {
          return wataru.reply(`⚠️ The user with ID ${targetUid} has no warnings.`);
        }
        let warnIndex;
        if (args[2]) {
          if (!/^\d+$/.test(args[2])) {
            return wataru.reply("⚠️ Invalid warning number. Please provide a positive integer.");
          }
          warnIndex = parseInt(args[2], 10) - 1;
          if (warnIndex < 0 || warnIndex >= warns.length) {
            return wataru.reply(`❌ Invalid warning number. The user has ${warns.length} warning(s).`);
          }
        } else {
          warnIndex = warns.length - 1;
        }
        await db.removeWarnForUser(chatId, targetUid, warnIndex);
        const name = await getUserName(targetUid);
        return wataru.reply(`✅ Successfully removed warning #${warnIndex + 1} from [${targetUid} | ${name}].`);
      }

      case "reset": {
        if (!(await isAdmin(senderId))) {
          return wataru.reply("❌ Only group administrators can reset warning data.");
        }
        await db.resetWarnsForGroup(chatId);
        return wataru.reply("✅ All warning data in this group has been reset.");
      }

      default: {
        if (!(await isAdmin(senderId))) {
          return wataru.reply("❌ Only group administrators can warn members.");
        }
        let targetUid, reason;
        if (msg.reply_to_message) {
          targetUid = msg.reply_to_message.from.id;
          reason = args.slice(0).join(" ").trim();
        } else if (args[0]) {
          if (!/^\d+$/.test(args[0])) {
            return wataru.reply("⚠️ Invalid user ID. Please provide a numeric user ID.");
          }
          targetUid = parseInt(args[0], 10);
          reason = args.slice(1).join(" ").trim();
        } else {
          return wataru.reply("⚠️ You need to reply to a message or specify a user ID to warn.");
        }
        if (!reason) reason = "No reason provided";
        const dateTime = new Date().toLocaleString();
        await db.addWarn(chatId, targetUid, reason, dateTime, senderId);
        const warns = await db.getWarnsForUser(chatId, targetUid);
        const count = warns ? warns.length : 1;
        const name = await getUserName(targetUid);
        if (count >= 3) {
          wataru.reply(
            `⚠️ Warned member ${name} ${count} times\n- User ID: ${targetUid}\n- Reason: ${reason}\n- Time: ${dateTime}\nThis member has reached 3 warnings and will be banned.\nTo unban, use: unban ${targetUid}`
          );
          await bot.banChatMember(chatId, targetUid).catch(err => {
            wataru.reply(`⚠️ Failed to ban user "${name}". Ensure the bot has 'ban users' permission.`);
          });
        } else {
          wataru.reply(
            `⚠️ Warned member ${name} ${count} times\n- User ID: ${targetUid}\n- Reason: ${reason}\n- Time: ${dateTime}\nIf this user receives ${3 - count} more warning(s), they will be banned.`
          );
        }
      }
    }
  } catch (error) {
    console.error(`[warn] » ${error}`);
    return wataru.reply("❌ An error occurred while processing the warn command.");
  }
}

module.exports = { meta, onStart }; 