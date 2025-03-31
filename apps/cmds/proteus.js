const fetch = require('node-fetch');

const meta = {
  name: "proteus",
  version: "1.0.0",
  aliases: [],
  description: "Generate a proteus image using the Hazeyy API Proteus endpoint",
  author: "Hazeyy API",
  prefix: "both",
  category: "image generation",
  type: "anyone",
  cooldown: 5,
  guide: "<prompt>"
};

async function onStart({ bot, args, wataru, msg, usages }) {
  try {
    // Use provided prompt; if no prompt is provided, show usage
    const prompt = args.join(" ");
    if (!prompt) return usages();

    // Use the global API endpoint
    const url = `${global.api.hazeyy}/api/proteus?prompt=${encodeURIComponent(prompt)}`;

    // Fetch the JSON response from the proteus API
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Expected response structure:
    // {
    //   "creator": "Hazeyy",
    //   "author": "Hazeyy",
    //   "proteus": {
    //     "image": [
    //       "url1",
    //       "url2"
    //     ],
    //     "model": "proteus"
    //   }
    // }
    const proteusData = data.proteus;
    if (!proteusData || !proteusData.image || proteusData.image.length === 0) {
      throw new Error("No images returned from the proteus API");
    }

    // Select the first image from the array
    const imageUrl = proteusData.image[0];
    const caption = `Proteus result for '${prompt}' using ${proteusData.model} model`;

    // Send the image using the bot framework's image sending method.
    return wataru.photo(imageUrl, { caption });
  } catch (error) {
    console.error(`[ proteus ] » ${error}`);
    return wataru.reply(`[ proteus ] » An error occurred while generating the proteus image.`);
  }
}

module.exports = { meta, onStart };
