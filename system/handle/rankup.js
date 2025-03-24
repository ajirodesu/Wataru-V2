exports.rankup = async function({ bot, msg, chatId, wataru, db }) {
  try {
    if (msg.from) {
      // Retrieve the user from the database.
      let user = await db.getUser(msg.from.id);
      if (!user) return;

      // Extract current level and total messages.
      let currentLevel = user.level || 1;
      const totalMessages = user.message_count || 0;

      // Calculate cumulative threshold for the next level:
      // Threshold = 10 * (2^(currentLevel) - 1)
      let requiredMessages = 10 * (Math.pow(2, currentLevel) - 1);

      // Loop to handle multiple level-ups if the message count is high.
      while (totalMessages >= requiredMessages) {
        currentLevel++; // Increase level.
        // Update the user's level in the database.
        await db.updateUserRank(msg.from.id, currentLevel, totalMessages);

        // Build the full name using first name and optional last name.
        const fullName = msg.from.first_name + (msg.from.last_name ? ` ${msg.from.last_name}` : '');

        // Send a congratulatory message.
        const message = `🎉 Congratulations ${fullName}, you've reached level ${currentLevel}!`;
        await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
        console.log(`[Rankup] User ${msg.from.id} (${fullName}) leveled up to ${currentLevel}!`);

        // Update the threshold for the next level.
        requiredMessages = 10 * (Math.pow(2, currentLevel) - 1);
      }
    }
  } catch (error) {
    console.error("Error processing rankup functionality:", error);
  }
};
