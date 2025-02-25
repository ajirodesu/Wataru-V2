exports.meta = {
  name: "active",
  aliases: [],
  prefix: "both",
  version: "1.0.0",
  author: "Liane Cagara",
  description: "Lists the top 10 most active users.",
  guide: ["<page>"],
  cooldown: 3,
  type: "anyone",
  category: "User Management"
};

exports.onStart = async function({ wataru, chatId, msg, args, usages, db }) {
  try {
    const startTime = Date.now();
    // Retrieve all users from the database using wataru db functionality.
    const allUsers = await db.getAllUsers();

    // Sort users by message_count in descending order.
    const sortedUsers = allUsers.sort((a, b) => (b.message_count || 0) - (a.message_count || 0));

    // Determine the requested page number (default is page 1).
    const page = isNaN(parseInt(args[0])) ? 1 : parseInt(args[0]);
    const indexStart = (page - 1) * 10;
    let rankIndex = indexStart;

    // Get the 10 users for the current page.
    const pageUsers = sortedUsers.slice(indexStart, indexStart + 10);

    let result = `Top 10 Most Active Users: (${Date.now() - startTime}ms)\n\n`;

    for (const user of pageUsers) {
      rankIndex++;
      // Use username if available; otherwise, combine first and last name or fallback to "Unknown".
      const userName = user.username || (user.first_name ? user.first_name + (user.last_name ? ` ${user.last_name}` : '') : "Unknown");
      result += `${rankIndex}. **${userName}**\n📨 Messages: **${user.message_count || 0}**\n\n`;
    }

    result += `${global.config.prefix}active <page> - View a specific page.`;
    await wataru.reply(result, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error in active command:", error);
    await wataru.reply("An error occurred while listing active users.", { parse_mode: "Markdown" });
  }
};
