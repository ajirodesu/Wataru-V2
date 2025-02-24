exports.meta = {
  name: 'start',
  version: '1.0.0',
  description: 'Welcome message and instructions',
  author: 'AjiroDesu',
  type: 'anyone',
  cooldown: 5,
  category: 'info',
  guide: []
};

exports.onStart = async function({ bot, msg, chatId }) {
  const firstName = msg.from.first_name;

  const welcomeMessage = `
👋 Hello ${firstName}!

I am your friendly bot, ready to assist you. Here's how you can get started:

📜 To view all available commands, just type \`${global.config.prefix}help\`.

💡 Need assistance with a specific feature? Just ask!

If you experience any issues, feel free to use \`${global.config.prefix}callad\` to report the problem.

If you have any questions, feel free to reach out. Let's get started!

✨ Created by \`${global.config.owner}\`
  `;

  await bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown'
  });
};
