const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');
const loadAll = require('./system/utility/utils');
const { install } = require('./system/install');

// JSON file paths
const JSON_FILES = {
  api: './json/api.json',
  config: './json/config.json',
  vip: './json/vip.json'
};

// Create a function to watch JSON files for changes
function watchJSONFile(filename, globalKey) {
  const absolutePath = path.join(__dirname, filename);

  // Initial load
  try {
    global[globalKey] = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
  }

  // Watch for changes
  fs.watch(path.dirname(absolutePath), (eventType, file) => {
    if (eventType === 'change' && file === path.basename(filename)) {
      try {
        const newData = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
        global[globalKey] = newData;
        console.log(`Reloaded ${filename} successfully`);
      } catch (error) {
        console.error(`Error reloading ${filename}:`, error);
      }
    }
  });
}

// Initialize global client object
global.client = {
  commands: new Map(),
  replies: new Map(),
  cooldowns: new Map(),
  events: new Map(),
  callbacks: new Map()
};

const { commands, replies, cooldowns, events } = global.client;

global.utils = loadAll;

// Setup JSON file watching
Object.entries(JSON_FILES).forEach(([key, filepath]) => {
  watchJSONFile(filepath, key);
});

// Initialize the bot
const bot = new TelegramBot(global.config.token, { polling: true });

// Main bot initialization
(async () => {
  try {
    // Load commands and events
    const errors = await loadAll();
    if (errors) {
      console.error('Errors loading commands:', errors);
    } else {
      console.log('All commands loaded successfully.');
    }

    // Set up message listener
    bot.on('message', async (msg) => {
      try {
        const { listen } = require('./system/listen');
        const chatId = msg.chat.id;
        await listen({ bot, msg, chatId });
        await install();
      } catch (err) {
        console.error('Error handling message:', err);
      }
    });

    console.log('Bot is up and running...');
  } catch (error) {
    console.error('Failed to start the bot:', error);
  }
})();

// Error handling for the file watcher
process.on('uncaughtException', (error) => {
  if (error.code === 'EPERM' || error.code === 'ENOENT') {
    console.error('File watcher error:', error);
  } else {
    throw error;
  }
}); 