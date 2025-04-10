const axios = require("axios");

const meta = {
  name: "translate",
  version: "1.0.0",
  aliases: ["trans"],
  description: "Translate text to a target language (default: English). Use by replying to a message or by providing text directly.",
  author: "AjiroDesu",
  prefix: "both",
  category: "utility",
  type: "anyone",
  cooldown: 5,
  guide: `Example:
target_language (optional): fr
Input: Hello, how are you?`
};

async function onStart({ bot, args, wataru, msg, db }) {
  try {
    let targetLang = "en"; // default target language
    let textToTranslate = "";

    // If the command is used as a reply, translate the replied message's text.
    if (msg.reply_to_message && msg.reply_to_message.text) {
      if (args.length > 0) {
        targetLang = args[0];
      }
      textToTranslate = msg.reply_to_message.text;
    } else {
      if (args.length === 0) {
        return wataru.reply("Please provide text to translate.");
      }
      // Use a heuristic: if the first argument is short (e.g., 'fr' or 'es'),
      // treat it as the language code.
      if (args[0].length <= 3) {
        targetLang = args[0];
        args.shift();
      }
      if (args.length === 0) {
        return wataru.reply("Please provide text to translate.");
      }
      textToTranslate = args.join(" ");
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      targetLang
    )}&dt=t&q=${encodeURIComponent(textToTranslate)}`;

    const response = await axios.get(url);
    const data = response.data;
    // The API returns an array of translation segments.
    const translatedText = data[0].map(segment => segment[0]).join("");

    return wataru.reply(`Translated (${targetLang}):\n${translatedText}`);
  } catch (error) {
    console.error(`[ translate ] » ${error}`);
    return wataru.reply(`[ translate ] » An error occurred during translation.`);
  }
}

module.exports = { meta, onStart };
