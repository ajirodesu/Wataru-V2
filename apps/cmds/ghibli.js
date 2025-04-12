const fetch = require('node-fetch');

const meta = {
  name: "ghibli",
  version: "1.0.0",
  aliases: [],
  description:
    "Transforms an image to a Ghibli art style using a remote API that returns the transformed image.",
  author: "Hazeyy API",
  prefix: "both",
  category: "image",
  type: "anyone",
  cooldown: 10,
  guide: "[optional imageUrl] - Provide an image URL to transform; if omitted and no reply with an image, usage instructions are shown."
};

async function onStart({ bot, args, wataru, msg, db, usages }) {
  try {
    let imageUrl = "";

    // If the command is sent as a reply and the replied message contains a photo,
    // get the photo URL from the Telegram API.
    if (msg.reply_to_message && msg.reply_to_message.photo) {
      // Telegram sends an array of photos with increasing resolution.
      const photos = msg.reply_to_message.photo;
      const fileId = photos[photos.length - 1].file_id; // Use the best quality
      imageUrl = await bot.getFileLink(fileId);
    } else {
      // Else, use the provided image URL from arguments.
      imageUrl = args.join(" ");
    }

    // If there's no image URL available, show the usage instructions.
    if (!imageUrl) return usages();

    // Build the API endpoint using URL encoding for the image URL parameter.
    const apiEndpoint = `${global.api.hazeyy}/api/ghibliv3?imageUrl=${encodeURIComponent(imageUrl)}`;

    // Fetch the transformed image data from the API.
    const res = await fetch(apiEndpoint);
    if (!res.ok) throw new Error("Failed to fetch the transformed image.");

    // Since the API responds with an actual image, get it as a Buffer.
    const buffer = await res.buffer();

    // Send the transformed image back to the user.
    return bot.sendPhoto(msg.chat.id, buffer, { 
      caption: "Here is your Ghibli-styled image!" 
    });
  } catch (error) {
    console.error(`[ghibli] » ${error}`);
    return wataru.reply(`[ghibli] » An error occurred while processing your request.`);
  }
}

module.exports = { meta, onStart };
