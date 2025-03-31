const fetch = require('node-fetch');

const meta = {
  name: "dream",
  version: "1.0.0",
  aliases: [],
  description: "Generate a dream image using the Hazeyy API Dream endpoint",
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

    // Build the API URL using the global endpoint variable
    const url = `${global.api.hazeyy}/api/dream?prompt=${encodeURIComponent(prompt)}`;

    // Fetch the JSON response from the dream API
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Extract the dream data; the expected structure:
    // {
    //   "creator": "Hazeyy",
    //   "author": "Hazeyy",
    //   "Dream": {
    //     "image": [ "url1", "url2" ],
    //     "model": "dreamshaper"
    //   }
    // }
    const dreamData = data.Dream;
    if (!dreamData || !dreamData.image || !dreamData.image.length) {
      throw new Error("No images returned from the dream API");
    }

    // Select the first image from the array
    const imageUrl = dreamData.image[0];
    const caption = `Dream result for '${prompt}' using ${dreamData.model} model`;

    // Send the image using the bot framework's photo method.
    return wataru.photo(imageUrl, { caption });
  } catch (error) {
    console.error(`[ dream ] » ${error}`);
    return wataru.reply(`[ dream ] » An error occurred while generating the dream image.`);
  }
}

module.exports = { meta, onStart };
