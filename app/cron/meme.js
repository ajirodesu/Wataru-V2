const fetch = require('node-fetch');
const MEME_API = 'https://meme-api.com/gimme';

exports.meta = {
  name: 'meme',
  version: '1.0.0',
  description: 'Sends a random meme with a caption to all groups',
  author: 'AjiroDesu',
  format: 'every 2 hours'
};

exports.onStart = async function({ bot, wataru, msg, chatId }) {
  try {
    // Fetch a random meme from the Meme API
    const response = await fetch(MEME_API);
    if (!response.ok) {
      throw new Error(`Meme API request failed with status: ${response.status}`);
    }
    const data = await response.json();
    const memeUrl = data.url;
    const caption = data.title || "Enjoy this meme!";
    
    // Send the meme photo with a caption to the specified chat (group)
    await bot.sendPhoto(chatId, memeUrl, { caption });
  } catch (error) {
    console.error(`Error in meme cron task for chat ${chatId}: ${error.message}`);
  }
};
