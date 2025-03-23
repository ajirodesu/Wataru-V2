exports.meta = {
  name: "ask",
  aliases: [],
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Asks the user for their favorite color and processes the reply.",
  guide: [""],
  cooldown: 10,
  type: "anyone",
  category: "misc"
};

exports.onStart = async function({ bot, chatId }) {
  try {
    // Send the question and store the actual sent message object.
    const sentMsg = await bot.sendMessage(
      chatId,
      "What's your favorite color? Please reply to this message."
    );

    // Save the entire sent message (not just a copy of its text) so that
    // the onReply handler can reference the original message by its ID.
    global.client.replies.set(sentMsg.message_id, {
      meta: exports.meta,
      question: sentMsg // Storing the actual sent message object
    });
  } catch (error) {
    await bot.sendMessage(chatId, `An error occurred: ${error.message}`);
  }
};

exports.onReply = async function({ bot, chatId, msg }) {
  try {
    // Extract the user's answer from the reply message.
    const answer = msg.text?.trim();
    if (!answer) {
      return await bot.sendMessage(chatId, "Please provide a valid response.");
    }

    // Process the answer (store it, run additional logic, etc.).
    // Here we simply send an acknowledgment.
    await bot.sendMessage(
      chatId,
      `Thanks for your reply! Your favorite color is ${answer}.`
    );
  } catch (error) {
    await bot.sendMessage(chatId, `Error processing your reply: ${error.message}`);
  }
};
