const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Define a single base API URL for Hazeyyyy’s endpoints.
const BASE_API = "https://hazeyyyy-rest-apis.onrender.com/api";

const meta = {
  name: "downloader",
  keyword: [
    "https://vt.tiktok.com",
    "https://www.tiktok.com/",
    "https://vm.tiktok.com",
    "https://www.facebook.com",
    "https://fb.watch",
    "https://youtu.be/",
    "https://youtube.com/",
    "https://www.instagram.com/",
    "https://pin.it",
    "https://pinterest.com",
  ],
  aliases: [],
  version: "1.0.3",
  author: "AjiroDesu",
  description: "Auto downloads videos from supported social media platforms.",
  guide: ["[video_link]"],
  cooldown: 0,
  type: "anyone",
  category: "media",
};

async function onStart({ bot, msg, chatId }) {
  await bot.sendMessage(
    chatId,
    "Send a video link from Facebook, Pinterest, YouTube, TikTok, or Instagram, and I'll download it for you!",
    { parse_mode: "HTML" }
  );
}

async function onWord({ bot, msg, chatId, args }) {
  const messageText = msg.link_preview_options?.url || msg.text || "";
  // Check if the message contains one of the supported URL keywords
  const detectedUrl = meta.keyword.find((url) => messageText.startsWith(url));
  if (!detectedUrl) return; // Ignore unsupported media

  try {
    const messageId = msg.message_id;
    // Notify the user that processing has started
    const wait = await bot.sendMessage(
      chatId,
      "⏳ Processing your request...",
      { reply_to_message_id: messageId }
    );
    const waitMId = wait.message_id;
    const videoPath = path.join(__dirname, "..", "temp", "downloaded_video.mp4");
    const encodedUrl = encodeURIComponent(messageText);

    let apiUrl;
    let videoKey; // key to extract the video URL from the response

    if (messageText.includes("facebook.com") || messageText.includes("fb.watch")) {
      apiUrl = `${BASE_API}/facebookdl?url=${encodedUrl}`;
      videoKey = "facebook";
    } else if (messageText.includes("pin.it") || messageText.includes("pinterest.com")) {
      apiUrl = `${BASE_API}/pinterestdl?url=${encodedUrl}`;
      videoKey = "pinterest";
    } else if (messageText.includes("youtu")) {
      apiUrl = `${BASE_API}/youtubedl?url=${encodedUrl}`;
      videoKey = "youtube";
    } else if (messageText.includes("tiktok")) {
      apiUrl = `${BASE_API}/tiktokdl?url=${encodedUrl}`;
      videoKey = "tiktok";
    } else if (messageText.includes("instagram.com")) {
      apiUrl = `${BASE_API}/instadl?url=${encodedUrl}`;
      videoKey = "instagram";
    } else {
      // Should never reach here since unsupported media are ignored
      return;
    }

    // Fetch the download link using the chosen endpoint
    const { data } = await axios.get(apiUrl);
    const videoUrl = data[videoKey];
    if (!videoUrl) {
      throw new Error("Video URL not found in response.");
    }

    // Download the video data
    const videoBuffer = (
      await axios.get(videoUrl, { responseType: "arraybuffer" })
    ).data;
    fs.writeFileSync(videoPath, Buffer.from(videoBuffer));

    // Remove the "processing" message
    await bot.deleteMessage(chatId, waitMId);

    // Use the cp field as caption if available
    const caption = data.cp || "";
    // Send the downloaded video file
    await bot.sendVideo(
      chatId,
      videoPath,
      {
        caption: `${caption} ✅`,
        reply_to_message_id: messageId,
      },
      {
        filename: "video.mp4",
        contentType: "video/mp4",
      }
    );

    fs.unlinkSync(videoPath);
  } catch (error) {
    await bot.sendMessage(chatId, `❎ Error: ${error.message}`);
  }
}

module.exports = { meta, onStart, onWord };
