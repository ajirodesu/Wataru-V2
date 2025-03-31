const meta = {
  name: "siesta",
  version: "1.0.0",
  aliases: [],
  description: "Send random Siesta photos from The Detective Is Already Dead",
  author: "Betadash API and AjiroDesu",
  prefix: "both",
  category: "media",
  type: "anyone",
  cooldown: 10,
  guide: ""
};

async function onStart({ bot, args, wataru, msg }) {
  try {
    const query = "Siesta";
    const count = 50; // Fetch 50 images
    const apiUrl = `${global.api.betadash}/pinterest?search=${encodeURIComponent(query)}&count=${count}`;

    // Fetch the image data from the API
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Failed to fetch images");

    // Parse the JSON response
    const data = await response.json();
    if (!data.data || data.data.length === 0) throw new Error("No images found");

    // Select 6 unique random images
    const selectedIndices = new Set();
    while (selectedIndices.size < 6 && selectedIndices.size < data.data.length) {
      const randomIndex = Math.floor(Math.random() * data.data.length);
      selectedIndices.add(randomIndex);
    }
    const selectedImages = Array.from(selectedIndices).map(index => data.data[index]);

    // Create media array with caption on the first item
    const media = selectedImages.map((url, index) => {
      if (index === 0) {
        return { 
          type: 'photo', 
          media: url, 
          caption: "Here are some random Siesta photos from The Detective Is Already Dead!" 
        };
      } else {
        return { type: 'photo', media: url };
      }
    });

    // Send the media group
    await wataru.mediaGroup(media);
  } catch (error) {
    console.error(`[ siesta ] » ${error.message}`);
    await wataru.reply("An error occurred while fetching the images.");
  }
}

module.exports = { meta, onStart };