const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

exports.meta = {
  name: "genart",
  aliases: [],
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Generates AI art from a given prompt.",
  guide: ["<prompt>"],
  cooldown: 5,
  type: "anyone",
  category: "fun"
};

exports.onStart = async function({ msg, bot, chatId, args, cwd }) {
  if (!args.length) {
    return bot.sendMessage(chatId, "⚠️ Please provide a prompt to generate an image.");
  }

  // Ensure cwd is defined, fallback to process.cwd()
  cwd = cwd || process.cwd();
  const tempDir = path.join(cwd, "app/tmp");

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const prompt = args.join(" ");
  const url = "https://ai-api.magicstudio.com/api/ai-art-generator";
  const form = new FormData();

  form.append("prompt", prompt);
  form.append("output_format", "bytes");
  form.append("user_profile_id", "null");
  form.append("anonymous_user_id", "8e79d4c4-801b-4908-858b-4afbee282b3e");
  form.append("request_timestamp", Date.now() / 1000);
  form.append("user_is_subscribed", "false");
  form.append("client_id", "pSgX7WgjukXCBoYwDM8G8GLnRRkvAoJlqa5eAVvj95o");

  try {
    const waitMsg = await bot.sendMessage(chatId, "🎨 Generating AI art... Please wait.");

    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
        "Origin": "https://magicstudio.com",
        "Referer": "https://magicstudio.com/ai-art-generator/"
      },
      responseType: "arraybuffer"
    });

    if (response.data) {
      const filePath = path.join(tempDir, `${Date.now()}.png`);
      fs.writeFileSync(filePath, response.data);

      await bot.deleteMessage(chatId, waitMsg.message_id); // Delete the wait message
      await bot.sendPhoto(chatId, filePath, { caption: `🖼️ AI-generated art for: *${prompt}*`, parse_mode: "Markdown" });

      fs.unlinkSync(filePath);
    } else {
      await bot.deleteMessage(chatId, waitMsg.message_id);
      await bot.sendMessage(chatId, "❌ Failed to generate an image. Please try again.");
    }
  } catch (error) {
    console.error("AI Art Generation Error:", error);
    await bot.sendMessage(chatId, "❌ An error occurred while generating the image. Try again later.");
  }
};