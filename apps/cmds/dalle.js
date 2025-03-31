const fetch = require('node-fetch');

const meta = {
  name: "dalle",
  version: "1.0.0",
  aliases: [],
  description: "Generate an image using the Hazeyy API DALL·E endpoint",
  author: "Hazeyy API",
  prefix: "both",
  category: "image generation",
  type: "anyone",
  cooldown: 600,
  guide: "<prompt>"
};

async function onStart({ bot, args, wataru, msg, usages }) {
  try {
    // Use provided prompt; if no prompt is provided, show usage
    const prompt = args.join(" ");
    if (!prompt) return usages();

    const url = `${global.api.hazeyy}/api/dalle?prompt=${encodeURIComponent(prompt)}`;

    // Fetch the image from the endpoint
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // Get the image as a buffer
    const imageBuffer = await response.buffer();

    // Send the image using the bot framework's image sending method.
    return wataru.photo(imageBuffer, { caption: `Results for '${prompt}'` });
  } catch (error) {
    console.error(`[ dalle ] » ${error}`);
    return wataru.reply(`[ dalle ] » An error occurred while generating the image.`);
  }
}

module.exports = { meta, onStart };
