const axios = require('axios');
const fs = require('fs');
const path = require('path');

const meta = {
  name: "video",
  version: "1.0.0",
  aliases: [],
  description: "Download a YouTube video by search query",
  author: "Mostakim",
  prefix: "both",
  category: "Youtube Video Downloader",
  type: "anyone",
  cooldown: 10,
  guide: ""
};

async function onStart({ bot, args, wataru, msg, db }) {
  try {
    const query = args.join(' ');
    if (!query) return wataru.reply("Please provide a search query!");

    // Search for the YouTube video using the external API
    const searchResponse = await axios.get(`https://www.x-noobs-apis.42web.io/mostakim/ytSearch?search=${encodeURIComponent(query)}`);
    const video = searchResponse.data[0];
    if (!video || !video.url) return wataru.reply("No video found!");

    // Fetch the video download URL from the API
    const videoApi = await axios.get(`https://www.x-noobs-apis.42web.io/m/ytdl?url=${video.url}`);
    if (!videoApi.data.url) throw new Error("No video URL found in API response.");

    // Download the video to a temporary file
    const tempFilePath = path.join(__dirname, "..", "temp", "temp_video.mp4");
    const writer = fs.createWriteStream(tempFilePath);

    const videoStream = await axios({
      url: videoApi.data.url,
      method: 'GET',
      responseType: 'stream'
    });

    videoStream.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Prepare caption text
    const caption = `📽️ Now playing: ${video.title}\nDuration: ${video.timestamp}`;

    // Send the video using wataru.video with a caption (plain text)
    await wataru.video(fs.createReadStream(tempFilePath), {
      caption: caption,
      parse_mode: false // Ensure the caption is sent as plain text
    });

    // Remove the temporary file
    fs.unlink(tempFilePath, (err) => {
      if (err) wataru.reply(`Error deleting temp file: ${err.message}`);
    });

  } catch (error) {
    return wataru.reply(`Error: ${error.message}`);
  }
}

module.exports = { meta, onStart };
