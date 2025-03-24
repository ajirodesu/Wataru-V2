const meta = {
  name: "userinfo",
  aliases: ["profile"],
  prefix: "both",
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Displays detailed information about a user.",
  guide: ["userinfo", "userinfo <user_id>"],
  cooldown: 3,
  type: "anyone",
  category: "Utility"
};

async function onStart({ wataru, msg, chatId, args, db }) {
  try {
    // Use provided user ID or default to the sender's ID.
    let userId = args[0] ? parseInt(args[0]) : msg.from.id;
    if (isNaN(userId)) {
      await wataru.reply("**Invalid user ID provided.**", { parse_mode: "Markdown" });
      return;
    }

    // Retrieve user data from the database.
    const user = await db.getUser(userId);
    if (!user) {
      await wataru.reply("**User not found in the database.**", { parse_mode: "Markdown" });
      return;
    }

    // Build full name.
    const fullName = user.first_name + (user.last_name ? ` ${user.last_name}` : "");
    let response = `**User Information**\n\n` +
                   `**Name:** ${fullName}\n` +
                   `**Username:** ${user.username || "N/A"}\n` +
                   `**Level:** ${user.level}\n` +
                   `**Messages:** ${user.message_count}\n` +
                   `**Coins:** ${user.coin_balance}\n` +
                   `**Banned:** ${user.banned ? "Yes" : "No"}`;

    await wataru.reply(response, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error in userinfo command:", error);
    await wataru.reply("**An error occurred while retrieving user info.**", { parse_mode: "Markdown" });
  }
}

module.exports = { meta, onStart };
