const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');
const loadAll = require('./system/utility/utils');
const { install } = require('./system/utility/install');
const db = require('./system/database/database');
const { database } = require('./system/database/handler');

// Configuration constants
const JSON_FILES = {
  api: './json/api.json',
  config: './json/config.json',
  vip: './json/vip.json'
};

// Initialize global client object
global.client = {
  commands: new Map(),
  replies: new Map(),
  cooldowns: new Map(),
  events: new Map(),
  callbacks: new Map()
};

global.utils = loadAll;

/**
 * Watch JSON file for changes and update global state
 * @param {string} filename - Relative path to JSON file
 * @param {string} globalKey - Global variable key to update
 */
function watchJSONFile(filename, globalKey) {
  const absolutePath = path.resolve(__dirname, filename);
  const directory = path.dirname(absolutePath);
  const baseFilename = path.basename(filename);

  // Initial load with error handling
  try {
    global[globalKey] = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    console.log(`Loaded ${baseFilename} successfully`);
  } catch (error) {
    console.error(`Error loading ${baseFilename}:`, error);
    global[globalKey] = {}; // Set default empty object to prevent crashes
  }

  // Use a debounce mechanism to prevent multiple rapid reloads
  let debounceTimer;
  const watcher = fs.watch(directory, (eventType, file) => {
    if (eventType === 'change' && file === baseFilename) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          const newData = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
          global[globalKey] = newData;
          console.log(`Reloaded ${baseFilename} successfully`);
        } catch (error) {
          console.error(`Error reloading ${baseFilename}:`, error);
          // Don't update global object if JSON is invalid
        }
      }, 100); // 100ms debounce
    }
  });

  // Store watchers to close them properly if needed
  if (!global.fileWatchers) global.fileWatchers = [];
  global.fileWatchers.push(watcher);
}

/**
 * Initialize and start the Telegram bot
 */
async function initBot() {
  try {
    // Setup JSON file watching
    Object.entries(JSON_FILES).forEach(([key, filepath]) => {
      watchJSONFile(filepath, key);
    });

    // Wait to ensure config is loaded before creating bot
    if (!global.config || !global.config.token) {
      console.error('Bot token not found in config. Please check your configuration.');
      process.exit(1);
    }

    // Initialize the bot with proper error handling
    const bot = new TelegramBot(global.config.token, { 
      polling: true,
      // Add polling options for stability
      pollingOptions: {
        timeout: 10, // Shorter timeout for more responsive error handling
        limit: 100   // Limit number of updates per polling
      }
    });

    // Add error handling for polling errors
    bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
      // Implement exponential backoff for reconnection if needed
    });

    // Load commands and events
    const errors = await loadAll();
    if (errors && errors.length > 0) {
      console.error('Errors loading commands and events:', errors);
    } else {
      console.log('All commands and events loaded successfully.');
    }

    // Set up message listener with better error handling
    bot.on('message', async (msg) => {
      try {
        const { listen } = require('./system/listen');
        const chatId = msg.chat.id;

        // Process each handler with individual try/catch blocks
        try {
          await listen({ bot, msg, chatId, db });
        } catch (err) {
          console.error('Error in message listener:', err);
        }

        try {
          await install();
        } catch (err) {
          console.error('Error in install process:', err);
        }

        try {
          await database({ bot, msg, chatId, db });
        } catch (err) {
          console.error('Error in database handler:', err);
        }
      } catch (outerErr) {
        console.error('Critical error handling message:', outerErr);
        // Try to send an error message to the chat if possible
        try {
          if (msg && msg.chat && msg.chat.id) {
            await bot.sendMessage(msg.chat.id, 'Sorry, an error occurred while processing your message.');
          }
        } catch (sendErr) {
          console.error('Could not send error message:', sendErr);
        }
      }
    });

    console.log('Bot is up and running...');

    return bot;
  } catch (error) {
    console.error('Failed to start the bot:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
function setupGracefulShutdown(bot) {
  const shutdown = async (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);

    // Close file watchers
    if (global.fileWatchers) {
      global.fileWatchers.forEach(watcher => watcher.close());
    }

    // Stop polling
    if (bot) {
      try {
        await bot.stopPolling();
        console.log('Bot polling stopped.');
      } catch (err) {
        console.error('Error stopping bot polling:', err);
      }
    }

    // Close database connections if needed
    if (db && typeof db.close === 'function') {
      try {
        await db.close();
        console.log('Database connections closed.');
      } catch (err) {
        console.error('Error closing database:', err);
      }
    }

    console.log('Shutdown complete.');
    process.exit(0);
  };

  // Listen for termination signals
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Improved error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
    // Log critical errors but don't crash for file system errors
    console.error('Critical error occurred:', error);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the bot
(async () => {
  const bot = await initBot();
  setupGracefulShutdown(bot);
})();
