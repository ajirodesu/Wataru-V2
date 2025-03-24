const meta = {
  name: "rank",
  aliases: [],
  prefix: "both",
  version: "1.0.0",
  author: "Your Name",
  description: "Displays your current level and progress towards the next level.",
  guide: ["rank"],
  cooldown: 3,
  type: "anyone",
  category: "Utility"
};

async function onStart({ wataru, msg, chatId, args, db }) {
  try {
    // Retrieve the sender's user data.
    const user = await db.getUser(msg.from.id);
    if (!user) {
      await wataru.reply("**User not found in the database.**", { parse_mode: "Markdown" });
      return;
    }

    const currentLevel = user.level || 1;
    const totalMessages = user.message_count || 0;

    // Calculate the cumulative threshold for the next level.
    // Formula: Next level requires: 10 × (2^(currentLevel) – 1)
    const nextThreshold = 10 * (Math.pow(2, currentLevel) - 1);
    // Calculate the previous threshold (if currentLevel is 1, previous is 0).
    const previousThreshold = currentLevel === 1 ? 0 : 10 * (Math.pow(2, currentLevel - 1) - 1);

    // Determine progress toward the next level.
    const progress = totalMessages - previousThreshold;
    const required = nextThreshold - previousThreshold;
    const percent = Math.min(100, Math.floor((progress / required) * 100));

    const response = `**Your Rank Information**\n\n` +
                     `**Level:** ${currentLevel}\n` +
                     `**Messages Sent:** ${totalMessages}\n` +
                     `**Progress to Next Level:** ${progress} / ${required} (${percent}%)\n` +
                     `**Next Level At:** ${nextThreshold} messages`;

    await wataru.reply(response, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error in rank command:", error);
    await wataru.reply("**An error occurred while retrieving your rank information.**", { parse_mode: "Markdown" });
  }
}

module.exports = { meta, onStart };
