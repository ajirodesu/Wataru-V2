const meta = {
  name: "balance",
  version: "1.0.0",
  aliases: ["bal", "coin", "coins", "money", "wallet"],
  description: "Check your balance",
  author: "AjiroDesu",
  prefix: "both",
  category: "economy",
  type: "anyone",
  cooldown: 5,
  guide: ""
};

async function onStart({ bot, args, wataru, msg, db }) {
  try {
    // Retrieve all coin records from the database.
    const coinRecords = await db.coinData();
    const userId = msg.from.id;
    // Find the coin record for the current user.
    const userCoinRecord = coinRecords.find(record => record.user_id === userId);

    if (!userCoinRecord) {
      return wataru.reply(`Sorry, but your account doesn't have data in the Wataru database. Please try ⟨ ${global.config.prefix}daily ⟩ to earn some lycoris coin 🪙`);
    }

    return wataru.reply(`Your lycoris coin balance is ˖۪⸙͎${userCoinRecord.coin_balance} 🪙`);
  } catch (error) {
    console.error(`[ balance ] » ${error}`);
    return wataru.reply(`[ balance ] » An error occurred.`);
  }
}

module.exports = { meta, onStart };