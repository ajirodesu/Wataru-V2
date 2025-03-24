const axios = require('axios');

const meta = {
  name: "whatanime",
  aliases: ["animeid", "findanime", "sauce"],
  prefix: "both",
  version: "1.0.0",
  author: "AjiroDesu and Ryzen API",
  description: "Identify anime from an image URL or a replied photo.",
  guide: ["<image_url> or reply to a photo"],
  cooldown: 5,
  type: "anyone",
  category: "anime"
};

async function onStart({ wataru, bot, chatId, msg, args, usages }) {
  let imageUrl;

  // **Step 1: Check if the command is used in reply to a photo**
  if (msg.reply_to_message && msg.reply_to_message.photo) {
    const photo = msg.reply_to_message.photo;
    const fileId = photo[photo.length - 1].file_id; // Use the highest resolution photo
    try {
      const file = await bot.getFile(fileId);
      const filePath = file.file_path;
      imageUrl = `https://api.telegram.org/file/bot${bot.token}/${filePath}`;
    } catch (error) {
      console.error("Error retrieving photo URL:", error);
      await wataru.reply("Failed to retrieve the photo URL. Please try again.");
      return;
    }
  }
  // **Step 2: Check if a URL is provided directly**
  else if (args.length > 0) {
    imageUrl = args[0];
  }
  // **Step 3: If neither is provided, show usage guide**
  else {
    return await usages();
  }

  // **Step 4: Call the anime identification API**
  try {
    const apiUrl = `${global.api.ryzen}/api/weebs/whatanime?url=${encodeURIComponent(imageUrl)}`;
    const response = await axios.get(apiUrl, { headers: { accept: 'application/json' } });
    const data = response.data;

    if (!data.judul) {
      await wataru.reply("No anime found for the provided image.");
      return;
    }

    // Format the response
    const title = data.judul;
    const episode = data.episode || "N/A";
    const similarity = data.similarity;
    const videoURL = data.videoURL;
    const videoIMG = data.videoIMG;

    const message = `Anime identified:\n**Title:** ${title}\n**Episode:** ${episode}\n**Similarity:** ${similarity}%\n[Video Preview](${videoURL})\n[Image Preview](${videoIMG})`;

    await wataru.reply(message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error fetching anime information:", error);
    await wataru.reply("An error occurred while fetching the anime information.");
  }
};
module.exports = { meta, onStart };
