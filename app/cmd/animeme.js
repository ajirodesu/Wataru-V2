const axios = require('axios');

exports.meta = {
  name: "animeme",
  aliases: ["animememe"],
  prefix: "both",
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Sends a random anime meme.",
  guide: [],
  cooldown: 5,
  type: "anyone",
  category: "fun"
};

exports.onStart = async function({ wataru, chatId, msg, args, usages }) {
  try {
    // Define the API URL to fetch a random anime meme from r/animemes
    const apiUrl = "https://meme-api.com/gimme/animemes";
    
    // Make the API request
    const response = await axios.get(apiUrl);
    const meme = response.data;

    // Send the meme image to the chat with its title as the caption
    await wataru.photo(meme.url, { caption: meme.title });
  } catch (error) {
    // Log the error and inform the user if something goes wrong
    console.error("Error fetching anime meme:", error);
    await wataru.reply("An error occurred while fetching the anime meme.");
  }
};