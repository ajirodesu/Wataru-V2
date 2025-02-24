const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");

exports.meta = {
  name: "shoti",
  aliases: [],
  version: "1.0.0",
  author: "Jonell Magallanes",
  description: "Random video from Shoti API By Lib API",
  guide: [""],
  cooldown: 10,
  type: "anyone",
  category: "media"
};

exports.onStart = async function({ wataru, chatId, msg, args }) {
  try {
    // Fetch random video data from the API.
    const response = await axios.get("https://kaiz-apis.gleeze.com/api/shoti");
    const data = response.data.shoti;
    const { videoUrl, title, username, nickname, region } = data;

    // Prepare a temporary file path based on the msg.message_id.
    const fileName = `${msg.message_id}.mp4`;
    const filePath = path.join(__dirname, "..", "tmp", fileName);

    // Download the video using a stream.
    const downloadResponse = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "stream"
    });
    const writer = fs.createWriteStream(filePath);
    downloadResponse.data.pipe(writer);

    // Wait until the file has been fully written.
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Construct a caption with video details.
    const caption = `Title: ${title}\nUsername: ${username}\nNickname: ${nickname}\nRegion: ${region}`;

    // Send the video message with the caption using wataru.video (no chatId required).
    await wataru.video(filePath, { caption });

    // Remove the temporary file.
    fs.unlinkSync(filePath);
  } catch (error) {
    await wataru.reply(error.message);
  }
};
