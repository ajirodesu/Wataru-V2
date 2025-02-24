const { exec } = require("child_process");

exports.meta = {
  name: "shell",
  version: "1.0.0",
  description: "Execute shell commands via the bot.",
  author: "AjiroDesu",
  type: "admin",
  cooldown: 0,
  category: "system",
  guide: ["<command>"],
};

exports.onStart = async function ({ bot, msg, args, chatId, usages }) {
  const command = args.join(" ");

  if (!command) {
    return usages();
  }

  exec(command, (error, stdout, stderr) => {
    let response = "";

    if (error) {
      response = `❎ Error: ${error.message}`;
    } else if (stderr) {
      response = `⚠️ Stderr: ${stderr}`;
    } else {
      response = `✅ Output:\n${stdout}`;
    }

    bot.sendMessage(chatId, response.slice(0, 4000)); // Limit to prevent overflow
  });
};