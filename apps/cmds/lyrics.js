const axios = require('axios');

exports.meta = {
  name: "lyrics",
  aliases: ["songlyrics"],
  prefix: "both",
  version: "1.0.0",
  author: "Hazeyy API",
  description: "Get song lyrics",
  guide: ["<song name>"],
  cooldown: 5,
  type: "anyone",
  category: "music"
};

exports.onStart = async function({ wataru, chatId, msg, args, usages }) {
  // Check if the user provided a song name
  if (args.length === 0) {
    return await usages(); // Sends usage instructions if no input
  }

  // Combine arguments into a single song name
  const song = args.join(" ");

  // Construct the API URL with the song name
  const apiUrl = `${global.api.hazeyy}/api/lyrics?song=${encodeURIComponent(song)}`;

  try {
    // Fetch data from the API
    const response = await axios.get(apiUrl);
    const data = response.data;

    // Verify the response contains the expected 'reply' object
    if (data.reply) {
      const { title, artist, lyrics, image } = data.reply;

      // Send the song image
      await wataru.photo(image);

      // Send the lyrics with title and artist, formatted in Markdown
      const message = `**${title} by ${artist}**\n\n${lyrics}`;
      await wataru.reply(message, { parse_mode: "Markdown" });
    } else {
      // Handle case where the song is not found
      await wataru.reply("Song not found or an error occurred.");
    }
  } catch (error) {
    // Log the error and notify the user
    console.error("Error fetching lyrics:", error);
    await wataru.reply("An error occurred while fetching the lyrics.");
  }
};