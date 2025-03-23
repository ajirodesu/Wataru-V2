const axios = require('axios');

exports.meta = {
  name: "weather",
  aliases: ["w"],
  prefix: "both",
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Get the current weather for a city (no API key required).",
  guide: ["<city_name>"],
  cooldown: 5,
  type: "anyone",
  category: "utility"
};

exports.onStart = async function({ wataru, msg, args, usages }) {
  // Check if a city name was provided
  if (args.length === 0) {
    return await usages();
  }

  // Join arguments to form the city name (e.g., "New York")
  const city = args.join(" ").replace(/ /g, "+"); // Replace spaces with "+" for URL

  // Construct the wttr.in API URL with JSON format
  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;

  try {
    // Fetch weather data
    const response = await axios.get(url);
    const data = response.data;

    // Check if the API returned valid data
    if (!data.current_condition || data.current_condition.length === 0) {
      throw new Error("City not found or invalid response");
    }

    // Extract weather details from the first current condition
    const condition = data.current_condition[0];
    const temp = condition.temp_C; // Temperature in Celsius
    const description = condition.weatherDesc[0].value; // Weather description
    const humidity = condition.humidity; // Humidity percentage
    const windSpeed = condition.windspeedKmph; // Wind speed in km/h

    // Map weather descriptions to emojis
    const weatherEmojis = {
      "clear": "☀️",
      "sunny": "☀️",
      "partly cloudy": "🌤️",
      "cloudy": "☁️",
      "overcast": "☁️",
      "rain": "🌧️",
      "light rain": "🌧️",
      "shower": "🌧️",
      "thunder": "⛈️",
      "snow": "❄️",
      "mist": "🌫️",
      "fog": "🌫️"
    };
    const emoji = weatherEmojis[description.toLowerCase()] || "🌍";

    // Format the response message using Markdown
    const message = `*Weather in ${city.replace(/\+/g, " ")}:*\n${emoji} ${description}\nTemperature: ${temp}°C\nHumidity: ${humidity}%\nWind Speed: ${windSpeed} km/h`;

    // Send the formatted message
    await wataru.reply(message, { parse_mode: "Markdown" });
  } catch (error) {
    // Handle errors
    console.error("Error fetching weather:", error);
    await wataru.reply("City not found or an error occurred while fetching the weather.");
  }
};