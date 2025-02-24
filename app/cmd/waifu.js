const axios = require('axios');

// Custom fetch function to get a random waifu image.
async function fetchWaifu() {
  try {
    const response = await axios.get('https://api.waifu.pics/sfw/waifu');
    return response.data; // Expected to return an object like { url: "..." }
  } catch (error) {
    throw new Error('Error fetching waifu: ' + error.message);
  }
}

exports.meta = {
  name: 'waifu',
  version: '1.0.0',
  description: 'Random waifu',
  author: 'Converted by ChatGPT',
  type: 'anyone',
  cooldown: 5,
  category: 'anime',
  guide: ['']
};

exports.onStart = async function({ bot, msg, db }) {
  const chatId = msg.chat.id;

  // Send a temporary loading message.
  const loadingMsg = await bot.sendMessage(chatId, '⏳ Please wait...');

  try {
    // Use the custom fetch function to get the waifu image.
    const data = await fetchWaifu();

    // Delete the loading message.
    await bot.deleteMessage(chatId, loadingMsg.message_id);

    // Send the image with a caption.
    await bot.sendPhoto(chatId, data.url, {
      caption: 'Random Waifu-!!'
    });
  } catch (error) {
    console.error(error);
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    await bot.sendMessage(chatId, '❌ Failed to fetch a waifu. Please try again.');
  }
};
