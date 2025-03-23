const axios = require("axios");

class Imgur {
  constructor() {
    this.clientId = "fc9369e9aea767c";
    this.client = axios.create({
      baseURL: "https://api.imgur.com/3/",
      headers: {
        Authorization: `Client-ID ${this.clientId}`,
      },
    });
  }

  async uploadImage(url) {
    try {
      const response = await this.client.post("image", { image: url });
      return response.data.data.link;
    } catch (error) {
      console.error("Imgur Upload Error:", error.response ? error.response.data : error);
      return null;
    }
  }
}

exports.meta = {
  name: "imgur",
  aliases: [],
  version: "1.0.0",
  author: "JohnDev19",
  description: "Uploads a replied photo to Imgur",
  guide: [""],
  cooldown: 0,
  type: "anyone",
  category: "utility",
};

exports.onStart = async function ({ msg, bot }) {
  try {
    // Ensure the message is a reply with a photo
    if (!msg.reply_to_message || !msg.reply_to_message.photo || msg.reply_to_message.photo.length === 0) {
      return bot.sendMessage(msg.chat.id, "Please reply to a photo you want to upload.");
    }

    // Telegram returns an array of PhotoSize objects (in ascending order of size).
    // For optimal quality, select the last one.
    const photoArray = msg.reply_to_message.photo;
    const bestPhoto = photoArray[photoArray.length - 1];
    const fileId = bestPhoto.file_id;

    // Retrieve file information from Telegram
    const file = await bot.getFile(fileId);
    const imageUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

    // Upload the image to Imgur
    const imgur = new Imgur();
    const uploadedLink = await imgur.uploadImage(imageUrl);

    if (!uploadedLink) {
      return bot.sendMessage(msg.chat.id, "Failed to upload the image to Imgur.");
    }

    // Respond with the uploaded image link
    const message = `
✅ <b>Upload Complete</b>
- Image Link: ${uploadedLink}
    `;
    return bot.sendMessage(msg.chat.id, message, { parse_mode: "HTML" });
  } catch (error) {
    console.error("Error in Imgur upload command:", error);
    return bot.sendMessage(msg.chat.id, "An error occurred while uploading the image.");
  }
};