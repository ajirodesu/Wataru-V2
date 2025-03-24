const axios = require('axios');

const meta = {
  name: "animepic",
  aliases: ["animephoto", "animeimg", "animeimage"],
  prefix: "both",
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Get a random anime photo.",
  guide: [],
  cooldown: 5,
  type: "anyone",
  category: "fun"
};

async function onStart({ wataru, chatId, msg }) {
  try {
    // Fetch a batch of cosplay posts from Safebooru API
    const response = await axios.get('https://safebooru.donmai.us/posts.json', {
      params: {
        tags: 'cosplay',
        limit: 100
      }
    });
    const posts = response.data;

    // Check if posts are available
    if (!posts || posts.length === 0) {
      throw new Error('No cosplay images found');
    }

    // Select a random post from the batch
    const randomPost = posts[Math.floor(Math.random() * posts.length)];
    const imageUrl = randomPost.file_url;
    const postId = randomPost.id;
    const postUrl = `https://safebooru.donmai.us/posts/${postId}`;

    // Send the photo with a caption linking to the original post
    await wataru.photo(imageUrl, {
      caption: `Here's a random anime photo! [View on Safebooru](${postUrl})`,
      parse_mode: "Markdown"
    });
  } catch (error) {
    // Log the error and inform the user if something goes wrong
    console.error("Error fetching cosplay photo:", error);
    await wataru.reply("Sorry, I couldn't fetch a cosplay photo right now. Please try again later.");
  }
};
module.exports = { meta, onStart };
