const meta = {
  name: "requestvip",
  aliases: [],
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Request premium access",
  guide: ["[message]"],
  cooldown: 100,
  type: "anyone",
  category: "system"
};

async function onStart({ bot, wataru, chatId, msg, args }) {
  try {
    // Extract the message from the command arguments
    const message = args.slice(1).join(" ");
    if (!message) {
      await wataru.reply("Please enter a message.");
      return;
    }

    // Get the user's full name from Telegram's msg.from object
    const username = `${msg.from.first_name} ${msg.from.last_name || ''}`.trim();

    // Construct the request message for operators
    const requestMessage = `${username} is requesting for premium\n\nuser id: ${msg.from.id}\nmessage: ${message}`;

    // Send the request to each operator
    global.config.admin.forEach(async (adminChatId) => {
      try {
        await bot.sendMessage(adminChatId, requestMessage);
      } catch (error) {
        console.error(`Failed to send message to operator ${adminChatId}:`, error);
      }
    });

    // Confirm to the user that the request was sent
    await wataru.reply("Your request has been sent to the bot operators.");
  } catch (error) {
    // Handle any errors that occur during execution
    await wataru.reply(`An error occurred: ${error.message}`);
  }
}

module.exports = { meta, onStart };