const axios = require('axios');
const cheerio = require('cheerio');

async function fetchKonachanImage() {
  try {
    const { data } = await axios.get('https://konachan.net/post?tags=order%3Arandom');
    const $ = cheerio.load(data);
    const imgLinks = [];

    $('#post-list-posts a.directlink.largeimg').each((_, el) => {
      const link = $(el).attr('href');
      if (link) imgLinks.push(link);
    });

    return imgLinks.length ? imgLinks[Math.floor(Math.random() * imgLinks.length)] : null;
  } catch (error) {
    console.error("Error fetching Konachan image:", error);
    return null;
  }
}

exports.meta = {
  name: 'konachan',
  version: '1.0.0',
  description: 'Fetches a random anime image from Konachan.',
  author: 'Converted by ChatGPT',
  type: 'anyone',
  cooldown: 5,
  category: 'anime',
  guide: ['']
};

exports.onStart = async function({ bot, msg, db }) {
  const chatId = msg.chat.id;

  // Send a loading message
  const loadingMsg = await bot.sendMessage(chatId, '🔄 Fetching a random anime image...');

  // Fetch the image
  const imageUrl = await fetchKonachanImage();
  if (!imageUrl) {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    return bot.sendMessage(chatId, '❌ Failed to fetch an image. Please try again.');
  }

  // Delete the loading message.
  await bot.deleteMessage(chatId, loadingMsg.message_id);

  // Send the photo without an inline button.
  await bot.sendPhoto(chatId, imageUrl, {
    caption: "<b>🎴 Random Konachan Image</b>",
    parse_mode: 'HTML'
  });
};
