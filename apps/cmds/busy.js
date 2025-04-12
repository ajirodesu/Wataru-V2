const meta = {
  name: "busy",
  version: "1.0.0",
  aliases: [],
  description:
    "Toggle do not disturb mode. When enabled, if you're mentioned the bot will notify others that you are busy.",
  author: "NTKhang",
  prefix: "both",
  category: "utility",
  type: "everyone",
  cooldown: 5,
  guide: [
    "[empty | <reason>]   - Turn on do not disturb mode with an optional reason",
    "off                  - Turn off do not disturb mode"
  ]
};

async function onStart({ bot, msg, args, db, wataru }) {
  try {
    const senderId = msg.from.id;
    if (args[0] && args[0].toLowerCase() === "off") {
      // Turn off busy mode: remove busy record for this user
      await db.removeBusy(senderId);
      return wataru.reply("✅ | Do not disturb mode has been turned off.");
    } else {
      // Turn on busy mode: set busy reason for sender (if provided)
      const reason = args.join(" ") || "";
      await db.setBusy(senderId, reason);
      if (reason) {
        return wataru.reply(
          "✅ | Do not disturb mode has been turned on with reason: " + reason
        );
      } else {
        return wataru.reply("✅ | Do not disturb mode has been turned on.");
      }
    }
  } catch (err) {
    console.error("[busy] Error:", err);
    return wataru.reply("❌ An error occurred while processing the busy command.");
  }
}

async function onChat({ bot, msg, db, wataru }) {
  try {
    // First, check if the message is a reply.
    if (msg.reply_to_message) {
      const targetId = msg.reply_to_message.from.id;
      // Do not notify if the user replied to their own message.
      if (targetId === msg.from.id) return;

      const busyData = await db.getBusy(targetId);
      if (busyData) {
        const name = msg.reply_to_message.from.first_name || "This user";
        return wataru.reply(
          busyData.reason
            ? `${name} is currently busy with reason: ${busyData.reason}`
            : `${name} is currently busy.`
        );
      }
    }

    // If not a reply, check for mention entities in the message.
    if (msg.entities && msg.text) {
      // Process each entity in the message.
      for (const entity of msg.entities) {
        // Case 1: When a text_mention is used (contains a user object)
        if (entity.type === 'text_mention' && entity.user) {
          const targetId = entity.user.id;
          // Skip if a user mentions themselves.
          if (targetId === msg.from.id) continue;

          const busyData = await db.getBusy(targetId);
          if (busyData) {
            const name = entity.user.first_name || "This user";
            return wataru.reply(
              busyData.reason
                ? `${name} is currently busy with reason: ${busyData.reason}`
                : `${name} is currently busy.`
            );
          }
        }
        // Case 2: When a mention is used (e.g. "@username")
        else if (entity.type === 'mention') {
          // Extract the username from the message text.
          const username = msg.text.substring(entity.offset, entity.offset + entity.length).replace('@', '');
          // Look up the user by username from your database.
          // (Assumes db.getUserByUsername returns a user object.)
          const userRecord = await db.getUserByUsername(username);
          if (userRecord) {
            const targetId = userRecord.user_id;
            // Skip if the mentioned username is the same as the sender.
            if (targetId === msg.from.id) continue;

            const busyData = await db.getBusy(targetId);
            if (busyData) {
              const name = userRecord.first_name || username;
              return wataru.reply(
                busyData.reason
                  ? `${name} is currently busy with reason: ${busyData.reason}`
                  : `${name} is currently busy.`
              );
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[busy:onChat] Error:", err);
  }
}

module.exports = { meta, onStart, onChat };
