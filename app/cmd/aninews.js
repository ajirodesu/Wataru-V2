const axios = require('axios');
const xml2js = require('xml2js');

exports.meta = {
  name: "aninews",
  aliases: ["animenews", "news"],
  prefix: "both",
  version: "1.0.0",
  author: "Your Name",
  description: "Fetches the latest anime news from Anime News Network.",
  guide: [],
  cooldown: 5,
  type: "anyone",
  category: "media"
};

/**
 * Fetches and displays the latest anime news.
 * @param {Object} params - Wataru bot framework parameters.
 */
exports.onStart = async function({ wataru, chatId }) {
  try {
    // Fetch the RSS feed from Anime News Network
    const rssUrl = "https://www.animenewsnetwork.com/newsfeed/rss.xml";
    const response = await axios.get(rssUrl);
    const xmlData = response.data;

    // Parse the XML to JSON
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlData);

    // Extract news items from the RSS feed
    const items = result.rss.channel.item.slice(0, 5); // Limit to top 5

    if (!items || items.length === 0) {
      return wataru.reply("No recent anime news found.");
    }

    // Format the news list with numbers and clickable links
    const newsText = [
      "**Latest Anime News:**",
      "",
      ...items.map((item, index) => `${index + 1}. [${item.title}](${item.link})`),
      "",
      "Source: Anime News Network"
    ].join("\n");

    // Send the formatted message
    await wataru.reply(newsText, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error fetching anime news:", error.message);
    await wataru.reply("An error occurred while fetching anime news.");
  }
};