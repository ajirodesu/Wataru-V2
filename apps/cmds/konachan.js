const axios = require('axios');
const cheerio = require('cheerio');

const meta = {
  name: "konachan",
  version: "1.0.0",
  description: "Fetch a random Konachan image",
  author: "YourName",
  type: "anyone",
  cooldown: 5,
  category: "anime",
  guide: [""],
};

async function fetchKonachan() {
  try {
    const { data } = await axios.get('https://konachan.net/post?tags=order%3Arandom');
    const $ = cheerio.load(data);
    let images = [];
    $('#post-list-posts a.directlink.largeimg').each((index, element) => {
      const imgUrl = $(element).attr('href');
      images.push(imgUrl);
    });
    // Select a random image from the array
    return images[Math.floor(Math.random() * images.length)];
  } catch (error) {
    console.error("Error fetching Konachan image:", error);
    return null;
  }
}

async function onStart({ bot, msg }) {
  const chatId = msg.chat.id;
  const imageUrl = await fetchKonachan();
  if (!imageUrl) return bot.sendMessage(chatId, "Error fetching image.");

  // Create inline keyboard with a refresh button (placeholder for message id)
  const inlineKeyboard = [
    [
      {
        text: "🔁",
        callback_data: JSON.stringify({
          command: "konachan",
          gameMessageId: null,
          args: ["refresh"]
        }),
      }
    ]
  ];

  let sentMessage;
  try {
    // Send the photo with inline keyboard
    sentMessage = await bot.sendPhoto(chatId, imageUrl, {
      caption: "Random Konachan image",
      reply_markup: { inline_keyboard: inlineKeyboard }
    });
  } catch (err) {
    console.error("Error sending photo:", err);
    return bot.sendMessage(chatId, "Error sending image.");
  }

  // Update the inline keyboard to include the actual message id for callback validation
  const updatedKeyboard = [
    [
      {
        text: "🔁",
        callback_data: JSON.stringify({
          command: "konachan",
          gameMessageId: sentMessage.message_id,
          args: ["refresh"]
        }),
      }
    ]
  ];

  try {
    await bot.editMessageReplyMarkup(
      { inline_keyboard: updatedKeyboard },
      { chat_id: chatId, message_id: sentMessage.message_id }
    );
  } catch (err) {
    console.error("Failed to update inline keyboard:", err.message);
  }
}

async function onCallback({ bot, callbackQuery, payload }) {
  try {
    // Validate that the callback is for the Konachan command and the message ids match.
    if (payload.command !== "konachan") return;
    if (!payload.gameMessageId || callbackQuery.message.message_id !== payload.gameMessageId) return;

    const imageUrl = await fetchKonachan();
    if (!imageUrl) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "Error fetching image." });
      return;
    }

    // Build updated inline keyboard with the same refresh button
    const updatedKeyboard = [
      [
        {
          text: "🔁",
          callback_data: JSON.stringify({
            command: "konachan",
            gameMessageId: payload.gameMessageId,
            args: ["refresh"]
          }),
        }
      ]
    ];

    // Edit the message with a new photo using editMessageMedia.
    await bot.editMessageMedia(
      {
        type: "photo",
        media: imageUrl,
        caption: "Random Konachan image"
      },
      {
        chat_id: callbackQuery.message.chat.id,
        message_id: payload.gameMessageId,
        reply_markup: { inline_keyboard: updatedKeyboard }
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error("Error in Konachan callback:", err.message);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "An error occurred. Please try again." });
    } catch (innerErr) {
      console.error("Failed to answer callback query:", innerErr.message);
    }
  }
}

module.exports = { meta, onStart, onCallback };
