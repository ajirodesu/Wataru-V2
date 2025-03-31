const axios = require('axios');

const meta = {
  name: "animeme",
  aliases: ["animememe"],
  prefix: "both",
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Sends a random anime meme.",
  guide: [],
  cooldown: 5,
  type: "anyone",
  category: "anime"
};

async function fetchAnimeme() {
  const apiUrl = "https://meme-api.com/gimme/animemes";
  const response = await axios.get(apiUrl);
  return response.data;
}

async function onStart({ bot, msg, chatId, log }) {
  try {
    const meme = await fetchAnimeme();
    // Build inline keyboard with a refresh button (placeholder for message id)
    const inlineKeyboard = [
      [
        {
          text: "🔁",
          callback_data: JSON.stringify({
            command: "animeme",
            gameMessageId: null,
            args: ["refresh"]
          }),
        },
      ],
    ];

    let sentMessage;
    try {
      sentMessage = await bot.sendPhoto(chatId, meme.url, {
        caption: meme.title,
        reply_markup: { inline_keyboard: inlineKeyboard }
      });
    } catch (err) {
      log.error("Error sending photo: " + err);
      return bot.sendMessage(chatId, "Error sending meme.");
    }

    // Update inline keyboard with actual message id
    const updatedKeyboard = [
      [
        {
          text: "🔁",
          callback_data: JSON.stringify({
            command: "animeme",
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
    log.error("Error fetching anime meme: " + error);
    return bot.sendMessage(chatId, "An error occurred while fetching the anime meme.");
  }
}

async function onCallback({ bot, callbackQuery, payload, log }) {
  try {
    if (payload.command !== "animeme") return;
    if (!payload.gameMessageId || callbackQuery.message.message_id !== payload.gameMessageId) return;

    const meme = await fetchAnimeme();
    if (!meme) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "Error fetching meme." });
      return;
    }

    // Build updated inline keyboard retaining the refresh button
    const updatedKeyboard = [
      [
        {
          text: "🔁",
          callback_data: JSON.stringify({
            command: "animeme",
            gameMessageId: payload.gameMessageId,
            args: ["refresh"]
          }),
        },
      ],
    ];

    await bot.editMessageMedia(
      {
        type: "photo",
        media: meme.url,
        caption: meme.title
      },
      {
        chat_id: callbackQuery.message.chat.id,
        message_id: payload.gameMessageId,
        reply_markup: { inline_keyboard: updatedKeyboard }
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    log.error("Error in animeme callback: " + err.message);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "An error occurred. Please try again." });
    } catch (innerErr) {
      log.error("Failed to answer callback query: " + innerErr.message);
    }
  }
}

module.exports = { meta, onStart, onCallback };
