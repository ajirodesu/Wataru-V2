const axios = require('axios');

const meta = {
  name: "cosplay",
  aliases: [],
  version: "0.0.1",
  author: "Lance Cochangco",
  description: "Get a random cosplay video.",
  guide: [""],
  prefix: "both",
  cooldown: 0,
  type: "vip",
  category: "anime"
};

async function fetchCosplayVideo() {
  try {
    // Define GitHub repository details
    const owner = 'ajirodesu';
    const repo = 'cosplay';
    const branch = 'main';
    const repoUrl = `https://github.com/${owner}/${repo}/tree/${branch}/`;
    const response = await axios.get(repoUrl);
    const html = response.data;

    // Use regex to extract .mp4 filenames from the HTML
    const videoFileRegex = /href="\/ajirodesu\/cosplay\/blob\/main\/([^"]+\.mp4)"/g;
    const videoFiles = [];
    let match;
    while ((match = videoFileRegex.exec(html)) !== null) {
      videoFiles.push(match[1]);
    }

    if (videoFiles.length === 0) return null;

    // Select a random video and construct the raw URL
    const randomVideo = videoFiles[Math.floor(Math.random() * videoFiles.length)];
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${randomVideo}`;
  } catch (error) {
    throw error;
  }
}

async function onStart({ msg, bot, chatId, log }) {
  try {
    const videoUrl = await fetchCosplayVideo();
    if (!videoUrl) return bot.sendMessage(chatId, "No cosplay videos found in the repository.");

    // Build inline keyboard with a refresh button (placeholder for message id)
    const inlineKeyboard = [
      [
        {
          text: "🔁",
          callback_data: JSON.stringify({
            command: "cosplay",
            gameMessageId: null,
            args: ["refresh"]
          }),
        },
      ],
    ];

    let sentMessage;
    try {
      // Send the video with inline keyboard attached
      sentMessage = await bot.sendVideo(chatId, videoUrl, {
        caption: "Here's a random cosplay video!",
        reply_markup: { inline_keyboard: inlineKeyboard }
      });
    } catch (err) {
      log.error("Error sending video: " + err);
      return bot.sendMessage(chatId, "Error sending video.");
    }

    // Update the inline keyboard with the actual message id for callback validation
    const updatedKeyboard = [
      [
        {
          text: "🔁",
          callback_data: JSON.stringify({
            command: "cosplay",
            gameMessageId: sentMessage.message_id,
            args: ["refresh"]
          }),
        },
      ],
    ];

    try {
      await bot.editMessageReplyMarkup(
        { inline_keyboard: updatedKeyboard },
        { chat_id: chatId, message_id: sentMessage.message_id }
      );
    } catch (err) {
      log.error("Failed to update inline keyboard: " + err.message);
    }
  } catch (error) {
    log.error("Error fetching random video: " + error);
    return bot.sendMessage(chatId, `An error occurred while fetching a cosplay video: ${error.message}`);
  }
}

async function onCallback({ bot, callbackQuery, payload, log }) {
  try {
    // Validate that the callback is for the cosplay command and the message id matches.
    if (payload.command !== "cosplay") return;
    if (!payload.gameMessageId || callbackQuery.message.message_id !== payload.gameMessageId) return;

    const videoUrl = await fetchCosplayVideo();
    if (!videoUrl) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "No cosplay videos found." });
      return;
    }

    // Build the updated inline keyboard (retaining the refresh button)
    const updatedKeyboard = [
      [
        {
          text: "🔁",
          callback_data: JSON.stringify({
            command: "cosplay",
            gameMessageId: payload.gameMessageId,
            args: ["refresh"]
          }),
        },
      ],
    ];

    // Edit the message media to update the video and caption
    await bot.editMessageMedia(
      {
        type: "video",
        media: videoUrl,
        caption: "Here's a random cosplay video!"
      },
      {
        chat_id: callbackQuery.message.chat.id,
        message_id: payload.gameMessageId,
        reply_markup: { inline_keyboard: updatedKeyboard }
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    log.error("Error in cosplay callback: " + err.message);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "An error occurred. Please try again." });
    } catch (innerErr) {
      log.error("Failed to answer callback query: " + innerErr.message);
    }
  }
}

module.exports = { meta, onStart, onCallback };
