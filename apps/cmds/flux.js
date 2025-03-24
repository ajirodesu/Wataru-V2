const meta = {
  name: "flux",
  aliases: ["fluxai"],
  prefix: "both",
  version: "1.0.0",
  author: "Hazeyy API",
  description: "Generate images using Flux AI",
  guide: ["<prompt>"],
  cooldown: 5,
  type: "anyone",
  category: "ai"
};

async function onStart({ wataru, chatId, msg, args, usages }) {
  // Check if a prompt is provided
  if (args.length === 0) {
    return await usages();
  }

  // Combine arguments into a single prompt string
  const prompt = args.join(" ");

  // Construct the API URL with the encoded prompt
  const apiUrl = `${global.api.hazeyy}/api/fluxp1?prompt=${encodeURIComponent(prompt)}`;

  try {
    // Send the generated image to the chat
    await wataru.photo(apiUrl);
  } catch (error) {
    // Log the error and inform the user
    console.error("Error sending photo:", error);
    await wataru.reply("An error occurred while generating the image.");
  }
};
module.exports = { meta, onStart };
