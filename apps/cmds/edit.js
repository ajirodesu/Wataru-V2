const axios = require('axios');

const meta = {
  name: "edit",
  aliases: [],
  version: "6.9",
  author: "dipto",
  description: "Edit images using Edit AI",
  guide: "Reply to an image with [prompt]",
  cooldown: 5,
  type: "anyone",
  category: "AI"
};

/**
 * Handles the image editing process by making an API call and sending the response.
 * @param {Object} bot - The Telegram bot instance.
 * @param {number} chatId - The chat ID where the message is sent.
 * @param {number} messageId - The message ID to reply to.
 * @param {string} fileUrl - The URL of the image to edit.
 * @param {string} prompt - The prompt for editing the image.
 */
async function handleEdit(bot, chatId, messageId, fileUrl, prompt) {
  try {
    const apiUrl = `${global.api.dipto}/dipto/edit?url=${encodeURIComponent(fileUrl)}&prompt=${encodeURIComponent(prompt)}`;
    const response = await axios.get(apiUrl, {
      responseType: 'stream',
      validateStatus: () => true
    });

    const contentType = response.headers['content-type'];

    if (contentType.startsWith('image/')) {
      const sentMsg = await bot.sendPhoto(chatId, response.data, { reply_to_message_id: messageId });
      global.client.replies.set(sentMsg.message_id, { meta: meta, type: "edit" });
    } else if (contentType.startsWith('application/json')) {
      let responseData = '';
      for await (const chunk of response.data) {
        responseData += chunk.toString();
      }
      const jsonData = JSON.parse(responseData);
      if (jsonData?.response) {
        const sentMsg = await bot.sendMessage(chatId, jsonData.response, { reply_to_message_id: messageId });
        global.client.replies.set(sentMsg.message_id, { meta: meta, type: "edit" });
      } else {
        await bot.sendMessage(chatId, "❌ No valid response from the API", { reply_to_message_id: messageId });
      }
    } else {
      await bot.sendMessage(chatId, "❌ Unexpected response type", { reply_to_message_id: messageId });
    }
  } catch (error) {
    console.error("Edit command error:", error);
    await bot.sendMessage(chatId, "❌ Failed to process your request. Please try again later.", { reply_to_message_id: messageId });
  }
}

/**
 * Handles the initial command execution when a user invokes /edit2.
 */
async function onStart({ bot, msg, chatId, args }) {
  if (!msg.reply_to_message || !msg.reply_to_message.photo) {
    return await bot.sendMessage(chatId, "❌ Please reply to an image to edit it.", { reply_to_message_id: msg.message_id });
  }

  const fileId = msg.reply_to_message.photo[msg.reply_to_message.photo.length - 1].file_id;
  const fileUrl = await bot.getFileLink(fileId);
  const prompt = args.join(" ") || "What is this";

  await handleEdit(bot, chatId, msg.message_id, fileUrl, prompt);
}

/**
 * Handles replies to the bot's messages for further image edits.
 */
async function onReply({ bot, msg, chatId, data }) {
  if (data.type === "edit") {
    if (!msg.reply_to_message || !msg.reply_to_message.photo) {
      return await bot.sendMessage(chatId, "❌ Please reply to an image to edit it.", { reply_to_message_id: msg.message_id });
    }

    const fileId = msg.reply_to_message.photo[msg.reply_to_message.photo.length - 1].file_id;
    const fileUrl = await bot.getFileLink(fileId);
    const prompt = msg.text || "What is this";

    await handleEdit(bot, chatId, msg.message_id, fileUrl, prompt);
  }
}

module.exports = { meta, onStart, onReply };