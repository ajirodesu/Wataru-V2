const _6HOURS = 6 * 60 * 60 * 1000;
const _2HOURS = 2 * 60 * 60 * 1000;
const _3HOURS = 3 * 60 * 60 * 1000;
const _1HOURS = 1 * 60 * 60 * 1000;
const _30MINUTES = 30 * 60 * 1000;

const extra = {
  min: 20,
  max: 100,
  delay: [_30MINUTES, _1HOURS, _3HOURS, _2HOURS, _6HOURS],
};

// In-memory map to track each user's work cooldown info.
const workCooldowns = new Map();

const meta = {
  name: "work",
  aliases: ["wk"],
  prefix: "both",
  version: "1.0.0",
  author: "XaviaTeam | Liane (Adapted to Wataru)",
  description: "Work to earn money",
  guide: [""],
  cooldown: 10,
  type: "anyone",
  category: "Chance Games",
};

async function onStart ({ wataru, chatId, msg, args, usages, db }) {
  try {
    const userId = msg.from.id;

    // Retrieve user data from the database.
    const userData = await db.getUser(userId);
    if (!userData) {
      return await wataru.reply("Your data is not ready");
    }

    // Retrieve or initialize the work cooldown information for the user.
    let workInfo = workCooldowns.get(userId) || { lastWorked: 0, delay: 0 };
    const now = Date.now();

    if (now - workInfo.lastWorked < workInfo.delay) {
      const remainingTimeMs = workInfo.delay - (now - workInfo.lastWorked);
      const remainingMinutes = Math.max(1, Math.floor(remainingTimeMs / 60000));
      return await wataru.reply(
        `You have already worked, you can work again in ${remainingMinutes} minute(s).`
      );
    }

    // Set a new cooldown delay.
    const selectedDelay =
      extra.delay[Math.floor(Math.random() * extra.delay.length)];
    workInfo.lastWorked = now;
    workInfo.delay = selectedDelay;
    workCooldowns.set(userId, workInfo);

    // Determine a random coin amount.
    const amount =
      Math.floor(Math.random() * (extra.max - extra.min + 1)) + extra.min;

    // Add coins to the user's balance.
    await db.addCoin(userId, amount);

    return await wataru.reply(
      `You have worked and earned ${amount.toLocaleString()}XC`
    );
  } catch (error) {
    console.error("Error in work command:", error);
    return await wataru.reply("Failed");
  }
};
module.exports = { meta, onStart };
