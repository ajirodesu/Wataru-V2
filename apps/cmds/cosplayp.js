const meta = {
  name: "cosplayp",
  version: "1.0.0",
  aliases: [],
  description: "Send random girl cosplay photos",
  author: "Betadash API and AjiroDesu",
  prefix: "both",
  category: "media",
  type: "anyone",
  cooldown: 10,
  guide: ""
};

async function onStart({ bot, args, wataru, msg }) {
  try {
    const query = "cosplay girl";
    const count = 50; // Fetch 50 images for variety
    const apiUrl = `${global.api.betadash}/pinterest?search=${encodeURIComponent(query)}&count=${count}`;

    // Fetch image data from the API
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('API request failed');

    // Parse the JSON response
    const data = await response.json();
    if (!data.data || data.data.length === 0) throw new Error('No images found');

    // Select 6 unique random images
    const selectedIndices = new Set();
    while (selectedIndices.size < 6 && selectedIndices.size < data.data.length) {
      const randomIndex = Math.floor(Math.random() * data.data.length);
      selectedIndices.add(randomIndex);
    }
    const selectedImages = Array.from(selectedIndices).map(index => data.data[index]);

    // Create media array for sending as a group
    const media = selectedImages.map(url => ({ type: 'photo', media: url }));

    // Send the media group
    await wataru.mediaGroup(media);
  } catch (error) {
    console.error(`[ cosplayp ] » ${error.message}`);
    await wataru.reply('An error occurred while fetching the images.');
  }
}

module.exports = { meta, onStart };