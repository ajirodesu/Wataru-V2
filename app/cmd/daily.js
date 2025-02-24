const meta = {
  name: "daily",
  version: "1.0.0",
  aliases: [],
  description: "Claim your daily reward of lycoris coin",
  author: "leiamnash",
  prefix: "both",
  category: "economy",
  type: "anyone",
  cooldown: 600,
  guide: ""
};

async function onStart({ bot, args, wataru, msg, db }) {
  try {
    const coinReward = Math.floor(Math.random() * 10000);
    await db.addCoin(msg.from.id, coinReward);
    return wataru.reply(`You receive ˖۪⸙͎${coinReward} lycoris coin 🪙`);
  } catch (error) {
    console.error(`[ daily ] » ${error}`);
    return wataru.reply(`[ daily ] » An error occurred.`);
  }
}

module.exports = { meta, onStart };
