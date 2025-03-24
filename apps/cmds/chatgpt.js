const axios = require('axios');

exports.meta = {
  name: "gpt",
  aliases: ["gpt4o"],
  prefix: "both",
  version: "1.0.0",
  author: "Hazeyy API",
  description: "Ask ChatGPT",
  guide: ["<query>"],
  cooldown: 5,
  type: "anyone",
  category: "ai"
};

exports.onStart = async function({ wataru, chatId, msg, args, usages }) {
  // Combine all arguments into a single query string
  const query = args.join(" ");

  // Check if the user provided a query; if not, send usage instructions
  if (!query) {
    return await usages();
  }

  try {
    // Build the API URL with the user's query, properly encoded
    const apiUrl = `${global.api.hazeyy}/api/gpt4o?message=${encodeURIComponent(query)}`;

    // Send a GET request to the API using Axios
    const response = await axios.get(apiUrl);

    // Extract the GPT-4 response from the API data, with a fallback message if none is returned
    const gptResponse = response.data.chat || "Sorry, no response was received from the API.";

    // Reply to the user with the GPT-4 response
    await wataru.reply(gptResponse, { parse_mode: "Markdown" });
  } catch (error) {
    // Handle any errors that occur during the API request
    console.error("Error fetching ChatGPT response:", error);
    await wataru.reply("An error occurred while trying to fetch the ChatGPT response. Please try again later.");
  }
};