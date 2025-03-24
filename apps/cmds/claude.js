const axios = require('axios');

const meta = {
  name: "claude",
  aliases: ["claudeai"],
  prefix: "both",
  version: "1.0.0",
  author: "Hazeyy API",
  description: "Ask Claude AI",
  guide: ["<query>"],
  cooldown: 5,
  type: "anyone",
  category: "ai"
};

async function onStart({ wataru, chatId, msg, args, usages }) {
  // Combine arguments into a single query string
  const question = args.join(" ");

  // If no query is provided, return usage instructions
  if (!question) {
    return await usages();
  }

  try {
    // Construct the API URL with the encoded query
    const apiUrl = `${global.api.hazeyy}/api/claude?message=${encodeURIComponent(question)}`;

    // Make the GET request to the Claude API
    const response = await axios.get(apiUrl);

    // Extract the Claude response, fallback if not present
    const claudeResponse = response.data.claude || "No response was returned from the API.";

    // Send the response back to the user
    await wataru.reply(claudeResponse, { parse_mode: "Markdown" });
  } catch (error) {
    // Log the error and inform the user
    console.error("Error fetching Claude response:", error);
    await wataru.reply("An error occurred while fetching the Claude response.");
  }
};
module.exports = { meta, onStart };
