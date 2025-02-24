const axios = require('axios');

exports.meta = {
  name: "wallpaper",
  aliases: ["wp", "wall"],
  prefix: "both",
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Sends a random high-quality wallpaper. Optional category: general, anime, people.",
  guide: ["[category]"],
  cooldown: 5,
  type: "anyone",
  category: "media"
};

/**
 * Handles the /wallpaper command by sending a random high-quality wallpaper.
 * @param {Object} params - Parameters provided by the Wataru bot framework.
 * @param {Object} params.wataru - The bot instance.
 * @param {string[]} params.args - Command arguments (e.g., category).
 * @param {Function} params.usages - Function to display usage guide.
 */
exports.onStart = async function({ wataru, args, usages }) {
  try {
    // Define available categories and their Wallhaven codes
    const categories = {
      general: "100",
      anime: "010",
      people: "001"
    };

    // Get the requested category from args, if provided
    const requestedCategory = args.length > 0 ? args[0].toLowerCase() : null;

    // Validate category; if invalid or absent, default to all categories
    let categoryCode;
    if (requestedCategory && categories[requestedCategory]) {
      categoryCode = categories[requestedCategory];
    } else if (requestedCategory) {
      await wataru.reply(`Invalid category. Available options: ${Object.keys(categories).join(", ")}`);
      return await usages();
    } else {
      categoryCode = "111"; // All categories enabled
    }

    // Fetch a random wallpaper from Wallhaven API
    const apiUrl = `https://wallhaven.cc/api/v1/search?sorting=random&resolutions=1920x1080&categories=${categoryCode}`;
    const response = await axios.get(apiUrl);
    const wallpapers = response.data.data;

    if (!wallpapers || wallpapers.length === 0) {
      await wataru.reply("No wallpapers found for this category.");
      return;
    }

    // Select the first wallpaper from the random results
    const wallpaper = wallpapers[0];
    const imageUrl = wallpaper.path; // Direct URL to the full-resolution image

    // Send the wallpaper as a photo using wataru.photo
    await wataru.photo(imageUrl, {
      caption: `Here's a random ${requestedCategory || "mixed"} wallpaper!`
    });
  } catch (error) {
    console.error("Error fetching wallpaper:", error);
    await wataru.reply("An error occurred while fetching the wallpaper.");
  }
};