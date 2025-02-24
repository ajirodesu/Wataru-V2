const axios = require('axios');
const fs = require('fs');
const path = require('path');

exports.meta = {
  name: "spotify",
  aliases: ["sp"],
  version: "1.0.0",
  author: "Jr Busaco",
  description: "Search and download songs from Spotify",
  guide: [""],
  cooldown: 5,
  type: "anyone",
  category: "music"
};

exports.onStart = async function({ bot, chatId, msg, args }) {
  const query = args.join(" ");
  if (!query) {
    return await bot.sendMessage(chatId, "Please provide a search query!");
  }

  try {
    const searchResponse = await axios.get(`https://spotidl.gleeze.com/search?query=${encodeURIComponent(query)}`);

    if (!searchResponse.data.status || !searchResponse.data.results.length) {
      return await bot.sendMessage(chatId, "No songs found!");
    }

    // Limit to the first 10 results
    const results = searchResponse.data.results.slice(0, 10);

    // Build the message text with details for each track
    let responseMsg = "🎵 *Search Results:*\n\n";
    results.forEach((track, index) => {
      responseMsg += `*${index + 1}.* ${track.title}\n`;
      responseMsg += `👤 ${track.artist}\n`;
      responseMsg += `⏱️ ${Math.floor(track.duration / 1000 / 60)}:${String(Math.floor((track.duration / 1000) % 60)).padStart(2, '0')}\n\n`;
    });
    responseMsg += "Select your song by clicking the corresponding button below:";

    // Generate a unique session ID for this command instance.
    const instanceId = Date.now().toString();

    // Build the inline keyboard with callback data as JSON.
    const inlineKeyboard = results.map((track, index) => ([
      { text: `${index + 1}`, callback_data: JSON.stringify({ command: "spotify", instanceId, choice: index }) }
    ]));

    // Send the search results message with the inline keyboard.
    const sentMsg = await bot.sendMessage(chatId, responseMsg, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: inlineKeyboard } // Corrected here
    });

    // Store session data in global.client.callbacks.
    global.client.callbacks.set(instanceId, {
      results,
      sentMsg,
      chatId,
      initiatingUserId: msg.from.id
    });

  } catch (error) {
    console.error(error);
    await bot.sendMessage(chatId, "An error occurred while searching for songs!");
  }
};

exports.onCallback = async function({ bot, callbackQuery, chatId, args, payload }) {
  const { instanceId, choice } = payload;

  if (!global.client.callbacks.has(instanceId)) {
    await bot.answerCallbackQuery(callbackQuery.id, { text: "This session has expired or is invalid.", show_alert: true });
    return;
  }

  const session = global.client.callbacks.get(instanceId);

  // Only allow the initiating user to interact with this session.
  if (callbackQuery.from.id !== session.initiatingUserId) {
    await bot.answerCallbackQuery(callbackQuery.id, { text: "You are not the person who initiated this command.", show_alert: true });
    return;
  }

  // Validate the selected index.
  const results = session.results;
  if (isNaN(choice) || choice < 0 || choice >= results.length) {
    await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid choice!", show_alert: true });
    return;
  }

  // Acknowledge the callback to stop the spinner.
  await bot.answerCallbackQuery(callbackQuery.id);

  const selectedTrack = results[choice];

  try {
    // Inform the user that the download is in progress.
    const downloadingMsg = await bot.sendMessage(chatId, "⏳ Downloading your song...");

    // Remove the inline keyboard message.
    await bot.deleteMessage(chatId, session.sentMsg.message_id);

    // Call the download endpoint using the selected track’s URL.
    const dlResponse = await axios.get(`https://spotidl.gleeze.com/spotifydl?url=${selectedTrack.url}`);

    if (!dlResponse.data.status) {
      await bot.deleteMessage(chatId, downloadingMsg.message_id);
      await bot.sendMessage(chatId, "Failed to download the song!");
      return;
    }

    const songData = dlResponse.data.song;
    const mp3Response = await axios.get(songData.mp3, { responseType: 'arraybuffer' });

    // Ensure the temporary directory exists.
    const tempDir = path.join(process.cwd(), 'app/tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save the MP3 file temporarily.
    const mp3Path = path.join(tempDir, `${selectedTrack.id}.mp3`);
    fs.writeFileSync(mp3Path, Buffer.from(mp3Response.data));

    // Send the audio file with a caption.
    await bot.sendAudio(chatId, mp3Path, {
      caption: `🎵 ${selectedTrack.title}\n👤 ${selectedTrack.artist}`
    });

    // Clean up: remove the downloading message and delete the temporary file.
    await bot.deleteMessage(chatId, downloadingMsg.message_id);
    if (fs.existsSync(mp3Path)) {
      fs.unlinkSync(mp3Path);
    }

    // Remove this session from the callbacks store.
    global.client.callbacks.delete(instanceId);
  } catch (error) {
    console.error(error);
    await bot.sendMessage(chatId, "An error occurred while downloading the song!");
  }
};
