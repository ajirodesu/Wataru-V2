const axios = require('axios');

const meta = {
  name: "anime",
  aliases: ["animeinfo", "mal"],
  prefix: "both",
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Get information about an anime.",
  guide: ["<anime_name>"],
  cooldown: 5,
  type: "anyone",
  category: "anime"
};

async function onStart({ wataru, chatId, msg, args, usages }) {
  // Combine arguments into a single query and trim whitespace
  const query = args.join(" ").trim();

  // If no query is provided, send usage guide
  if (!query) {
    return await wataru.reply('Please provide an anime name.');
  }

  try {
    // Construct API URL with encoded query
    const apiUrl = `${global.api.ryzen}/api/weebs/anime-info?query=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl, { headers: { accept: 'application/json' } });
    const data = response.data;

    // Check if anime data is valid
    if (!data.title) {
      await wataru.reply("No anime found with that name.");
      return;
    }

    // Build the caption with Markdown formatting
    let caption = `*${data.title || 'Unknown'}*\n`;
    if (data.type) caption += `*Type:* ${data.type}\n`;
    if (data.score) caption += `*Score:* ${data.score}\n`;
    if (data.status) caption += `*Status:* ${data.status}\n`;
    if (data.genres) caption += `*Genres:* ${data.genres}\n`;

    // Truncate synopsis if too long
    const synopsis = data.synopsis || 'No synopsis available.';
    const maxSynopsisLength = 700;
    const truncatedSynopsis = synopsis.length > maxSynopsisLength 
      ? synopsis.substring(0, maxSynopsisLength) + "..." 
      : synopsis;

    caption += `\n${truncatedSynopsis}\n\n[More info](${data.url || ''})`;

    // Get image URL if available
    const imageUrl = data.images?.jpg?.large_image_url;

    // Send photo with caption if image exists, otherwise send text
    if (imageUrl) {
      await wataru.photo(imageUrl, { caption: caption, parse_mode: "Markdown" });
    } else {
      await wataru.reply(caption, { parse_mode: "Markdown" });
    }
  } catch (error) {
    // Log error and inform user
    console.error("Error fetching anime information:", error);
    await wataru.reply("An error occurred while fetching anime information.");
  }
};
module.exports = { meta, onStart };
