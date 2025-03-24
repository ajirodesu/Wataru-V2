const axios = require('axios');

const meta = {
  name: "manga",
  aliases: ["mangainfo", "comic"],
  prefix: "both",
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Get information about a manga.",
  guide: ["<manga_name>"],
  cooldown: 5,
  type: "anyone",
  category: "anime"
};

async function onStart({ wataru, chatId, msg, args, usages }) {
  const query = args.join(" ").trim();
  if (!query) {
    return await wataru.reply('Please provide a manga name.');
  }

  try {
    const apiUrl = `${global.api.ryzen}/api/weebs/manga-info?query=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl, { headers: { accept: 'application/json' } });
    const data = response.data;

    if (!data.title) {
      await wataru.reply("No manga found with that name.");
      return;
    }

    let message = `*${data.title}*\n`;
    if (data.chapters) message += `*Chapters:* ${data.chapters}\n`;
    if (data.type) message += `*Type:* ${data.type}\n`;
    if (data.status) message += `*Status:* ${data.status}\n`;
    if (data.genre) message += `*Genre:* ${data.genre}\n`;
    if (data.volumes) message += `*Volumes:* ${data.volumes}\n`;
    if (data.score && data.scored_by) message += `*Score:* ${data.score} (by ${data.scored_by} users)\n`;
    if (data.rank) message += `*Rank:* ${data.rank}\n`;
    if (data.popularity) message += `*Popularity:* ${data.popularity}\n`;
    if (data.members) message += `*Members:* ${data.members}\n`;
    if (data.favorites) message += `*Favorites:* ${data.favorites}\n`;

    const synopsis = data.synopsis || 'No synopsis available.';
    const maxSynopsisLength = 500;
    const truncatedSynopsis = synopsis.length > maxSynopsisLength 
      ? synopsis.substring(0, maxSynopsisLength) + "..." 
      : synopsis;
    
    message += `\n*Synopsis:*\n${truncatedSynopsis}\n\n[More info](${data.url || ''})`;

    await wataru.reply(message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error fetching manga information:", error);
    await wataru.reply("An error occurred while fetching manga information.");
  }
};
module.exports = { meta, onStart };
