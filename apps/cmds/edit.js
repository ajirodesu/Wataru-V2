const axios = require('axios');
const dipto = `${global.api.dipto}/dipto`;

const meta = {
  name: "edit",
  aliases: [],
  version: "6.9",
  author: "dipto",
  description: "Edit images using Edit AI",
  guide: ["Reply to an image with prompt"],
  cooldown: 5,
  type: "anyone",
  category: "AI"
};

async function handleEdit({ bot, chatId, msg, args = [] }) {
  // Ensure the message is a reply to another message containing a photo.
  const reply = msg.reply_to_message;
  if (!reply || !reply.photo || reply.photo.length === 0) {
    return bot.sendMessage(chatId, "❌ Please reply to an image to edit it.");
  }

  // Telegram returns multiple sizes; use the highest resolution.
  const photoSizes = reply.photo;
  const fileId = photoSizes[photoSizes.length - 1].file_id;

  // Retrieve the image URL using bot.getFileLink (assumed to be available).
  let fileUrl;
  try {
    fileUrl = await bot.getFileLink(fileId);
  } catch (error) {
    return bot.sendMessage(chatId, "❌ Unable to retrieve the image file.");
  }

  // Use the provided prompt or a default one.
  const prompt = args.join(" ") || "What is this";

  try {
    const response = await axios.get(
      `${dipto}/edit?url=${encodeURIComponent(fileUrl)}&prompt=${encodeURIComponent(prompt)}`,
      {
        responseType: 'stream',
        validateStatus: () => true
      }
    );

    // If the API returns an image, send it as a photo.
    if (response.headers['content-type'] && response.headers['content-type'].startsWith('image/')) {
      const sentMsg = await bot.sendPhoto(chatId, response.data);
      // Save the sent message so the user can reply to this edited photo for further edits.
      global.client.replies.set(sentMsg.message_id, {
        meta: meta,
        command: meta.name,
        author: msg.from.id
      });
      return;
    }

    // Otherwise, attempt to read the stream as text and parse as JSON.
    let responseData = '';
    for await (const chunk of response.data) {
      responseData += chunk.toString();
    }

    const jsonData = JSON.parse(responseData);
    if (jsonData && jsonData.response) {
      const sentMsg = await bot.sendMessage(chatId, jsonData.response);
      global.client.replies.set(sentMsg.message_id, {
        meta: meta,
        command: meta.name,
        author: msg.from.id
      });
      return;
    }

    return bot.sendMessage(chatId, "❌ No valid response from the API");

  } catch (error) {
    console.error("Edit command error:", error);
    return bot.sendMessage(chatId, "❌ Failed to process your request. Please try again later.");
  }
}

async function onStart({ bot, chatId, msg, args }) {
  // Ensure the command message is a reply to an image.
  if (!msg.reply_to_message) {
    return bot.sendMessage(chatId, "❌ Please reply to an image to edit it.");
  }
  await handleEdit({ bot, chatId, msg, args });
}

async function onReply({ bot, chatId, msg, args = [] }) {
  // When the user replies to the bot's edited photo, run the edit again.
  await handleEdit({ bot, chatId, msg, args });
}

module.exports = { meta, onStart, onReply };
