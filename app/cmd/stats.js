const meta = {
  name: "stats",
  version: "1.0.0",
  aliases: ["statistics"],
  description: "Display bot statistics.",
  author: "AjiroDesu",
  prefix: "both",
  category: "system",
  type: "everyone",
  cooldown: 5,
  guide: `- Displays statistics about the bot.`
};

async function onStart({ bot, args, wataru, msg, db }) {
  try {
    // Retrieve all user and group records from the database.
    const users = await db.getAllUsers();
    const groups = await db.getAllGroups();

    // Calculate total coins distributed and average coins per user.
    let totalCoins = 0;
    users.forEach(user => {
      totalCoins += Number(user.coin_balance) || 0;
    });
    const avgCoins = users.length > 0 ? (totalCoins / users.length).toFixed(2) : 0;

    // Count banned users and banned groups.
    const bannedUsersCount = users.filter(user => user.banned == 1).length;
    const bannedGroupsCount = groups.filter(group => group.banned == 1).length;

    // Build the response message using Markdown formatting.
    let response = "📊 *Bot Statistics:*\n\n";
    response += `*Total Users:* ${users.length}\n`;
    response += `*Total Groups:* ${groups.length}\n`;
    response += `*Total Coins Distributed:* ${totalCoins}\n`;
    response += `*Average Coins per User:* ${avgCoins}\n`;
    response += `*Banned Users:* ${bannedUsersCount}\n`;
    response += `*Banned Groups:* ${bannedGroupsCount}\n`;

    return wataru.reply(response, { parse_mode: "Markdown" });
  } catch (error) {
    console.error(`[ stats ] » ${error}`);
    return wataru.reply(`[ stats ] » An error occurred.`);
  }
}

module.exports = { meta, onStart };
