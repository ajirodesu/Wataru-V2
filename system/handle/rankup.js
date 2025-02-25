exports.rankup = async function({ bot, wataru, msg, chatId, args, db }) {
  try {
    const userId = msg.from.id;

    // Retrieve the user; if not found, add them.
    let user = await db.getUser(userId);
    if (!user) {
      await db.upsertUser(msg.from);
      user = await db.getUser(userId);
    }

    // Increment the message counter.
    let newMessageCount = (user.message_count || 0) + 1;
    const currentLevel = user.level || 1;

    // Calculate required messages to level up:
    // Level 1 -> 10, Level 2 -> 20, Level 3 -> 40, etc.
    const threshold = 10 * Math.pow(2, currentLevel - 1);

    if (newMessageCount >= threshold) {
      // Level up: subtract the threshold (to carry over extra messages) and increase level.
      const newLevel = currentLevel + 1;
      newMessageCount = newMessageCount - threshold;

      // Update the user’s rank in the database.
      await db.updateUserRank(userId, newLevel, newMessageCount);

      // Create a display name (use first and last name if available; otherwise username).
      const displayName = (user.first_name || '') + (user.last_name ? ' ' + user.last_name : '');

      // Send congratulatory auto-response.
      await bot.sendMessage(chatId, `Congratulations ${displayName.trim() || user.username}, your keyboard has reached level ${newLevel}`);
    } else {
      // No level up; simply update the message count.
      await db.updateUserRank(userId, currentLevel, newMessageCount);
    }
  } catch (error) {
    console.error("Error in rankup function:", error);
  }
};
