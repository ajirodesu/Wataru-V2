const axios = require('axios');

exports.meta = {
  name: "ai",
  aliases: ["chatgpt", "openai"],
  prefix: "both",
  version: "1.0.0",
  author: "Kaiz API",
  description: "Start a continuous conversation with GPT-4o. Keep replying to continue.",
  guide: ["<query>"],
  cooldown: 5,
  type: "anyone",
  category: "ai"
};

/**
 * Starts the AI conversation with the initial query.
 * @param {Object} params - Wataru bot framework parameters.
 */
exports.onStart = async function({ wataru, chatId, msg, args, usages }) {
  const query = args.join(" ");
  if (!query) return usages();

  const userId = msg.from.id;

  try {
    // Initialize conversation with the user's first message
    const conversation = [{ role: "user", content: query }];

    // Build the API URL with the initial query
    const context = conversation.map(msg => `${msg.role}: ${msg.content}`).join("\n");
    const apiUrl = `${global.api.kaiz}/api/gpt-4o?ask=${encodeURIComponent(context)}&uid=${userId}&webSearch=off`;
    const response = await axios.get(apiUrl);

    const aiResponse = response.data.response || "No response was returned from the API.";

    // Add AI response to conversation
    conversation.push({ role: "assistant", content: aiResponse });

    // Send response and store conversation with the new message ID
    const sentMessage = await wataru.reply(aiResponse, { parse_mode: "Markdown" });
    global.client.replies.set(sentMessage.message_id, {
      meta: exports.meta,
      conversation,
      userId
    });
  } catch (error) {
    console.error("Error starting AI conversation:", error.message);
    await wataru.reply("An error occurred while starting the conversation.");
  }
};

/**
 * Continues the AI conversation based on user replies to any bot message.
 * @param {Object} params - Reply handler parameters.
 */
exports.onReply = async function({ wataru, chatId, msg, args, data }) {
  const userInput = (Array.isArray(args) && args.length ? args.join(" ") : msg.text || "").trim();
  if (!userInput) {
    return wataru.reply("Please reply with a message to continue the conversation.");
  }

  const userId = msg.from.id;
  if (userId !== data.userId) {
    return wataru.reply("This conversation belongs to another user.");
  }

  // Retrieve conversation history from the replied message
  const conversation = Array.isArray(data.conversation) ? [...data.conversation] : [];
  conversation.push({ role: "user", content: userInput });

  try {
    // Build the API URL with the full conversation context
    const context = conversation.map(msg => `${msg.role}: ${msg.content}`).join("\n");
    const apiUrl = `${global.api.kaiz}/api/gpt-4o?ask=${encodeURIComponent(context)}&uid=${userId}&webSearch=off`;
    const response = await axios.get(apiUrl);

    const aiResponse = response.data.response || "No response was returned from the API.";

    // Add AI response to conversation
    conversation.push({ role: "assistant", content: aiResponse });

    // Limit conversation history to 10 messages
    if (conversation.length > 10) {
      conversation.splice(0, conversation.length - 10);
    }

    // Send the AI response and store updated conversation with the new message ID
    const sentMessage = await wataru.reply(aiResponse, { parse_mode: "Markdown" });
    global.client.replies.set(sentMessage.message_id, {
      meta: exports.meta,
      conversation,
      userId
    });

    // Optionally, clear the old reply context (if not needed for multiple branches)
    // global.client.replies.delete(msg.reply_to_message.message_id);
  } catch (error) {
    console.error("Error continuing AI conversation:", error.message);
    await wataru.reply("An error occurred while continuing the conversation.");
  }
};