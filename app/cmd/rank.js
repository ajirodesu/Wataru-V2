exports.meta = {
  name: "rank",
  aliases: ["level"],
  prefix: "both", 
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Displays your current rank level and progress.",
  guide: [],
  cooldown: 5,
  type: "anyone",
  category: "utility"
};

exports.onStart = async function({ wataru, chatId, msg, args, usages, db }) {
  try {
    // Attempt to retrieve the user data.
    let user = await db.getUser(msg.from.id);
    if (!user) {
      // If no record exists, create one.
      await db.upsertUser(msg.from);
      // Inform the user that a new record was created.
      return await wataru.reply(
        "It looks like you didn't have a rank record. I've created one for you. Please try the command again to view your current rank.",
        { parse_mode: "Markdown" }
      );
    }

    // Retrieve current level and message count.
    const currentLevel = user.level || 1;
    const messageCount = user.message_count || 0;

    // Calculate the threshold for the next level.
    const threshold = 10 * Math.pow(2, currentLevel - 1);
    const progressPercentage = ((messageCount / threshold) * 100).toFixed(2);

    // Compose the rank message.
    const replyMessage = `Your current rank:\n\n` +
      `*Level:* ${currentLevel}\n` +
      `*Messages:* ${messageCount}/${threshold} (${progressPercentage}%)\n\n` +
      `Keep chatting to level up!`;

    await wataru.reply(replyMessage, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error in rank command:", error);
    await wataru.reply("An error occurred while retrieving your rank.");
  }
};
