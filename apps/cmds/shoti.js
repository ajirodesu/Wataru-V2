const meta = {
  name: "shoti",
  version: "1.0.0",
  aliases: [],
  description: "Get a random short video",
  author: "Liby Shoti API",
  prefix: "both",
  category: "media",
  type: "anyone",
  cooldown: 10,
  guide: ""
};

async function onStart({ bot, args, wataru, msg }) {
  try {
    // Fetch data from the API
    const response = await fetch('https://shoti.fbbot.org/api/get-shoti');
    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    if (data.code !== 200) throw new Error('API returned non-200 code');

    // Extract video URL and username
    const videoUrl = data.result.content;
    const username = data.result.user.username;

    // Send the video with a plain text caption
    await wataru.video(videoUrl, {
      caption: `Shoti from @${username}`,
      parse_mode: false // Ensure caption is plain text
    });
  } catch (error) {
    console.error(`[ shoti ] » ${error}`);
    await wataru.reply('An error occurred while fetching the video.');
  }
}

module.exports = { meta, onStart };