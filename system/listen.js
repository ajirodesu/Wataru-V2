const fs = require('fs');
const path = require('path');
const { createWataru } = require('./utility/wataru');

// Cache for handlers to avoid repeated filesystem operations
let handlersCache = null;
let handlersCacheTimestamp = 0;
const CACHE_LIFETIME = 60000; // 1 minute cache lifetime

/**
 * Load handlers from the handlers directory with caching
 * @returns {Array} Array of handler objects with name and function
 */
async function loadHandlers() {
  const currentTime = Date.now();
  const handlersPath = path.join(__dirname, 'handle');

  // Check if we need to refresh the cache
  if (
    !handlersCache || 
    currentTime - handlersCacheTimestamp > CACHE_LIFETIME || 
    !handlersCache.length
  ) {
    try {
      const files = await fs.promises.readdir(handlersPath);
      const handlers = [];

      for (const file of files) {
        if (file.endsWith('.js')) {
          try {
            const handlerPath = path.join(handlersPath, file);
            // Clear require cache to ensure we get fresh modules if they've changed
            delete require.cache[require.resolve(handlerPath)];

            const handlerModule = require(handlerPath);
            const handlerName = path.basename(file, '.js');
            const handler = handlerModule[handlerName];

            if (typeof handler === 'function') {
              handlers.push({
                name: handlerName,
                handler
              });
            } else {
              console.warn(`Handler ${file} does not export a function named "${handlerName}".`);
            }
          } catch (handlerError) {
            console.error(`Error loading handler ${file}:`, handlerError);
            // Continue with other handlers instead of failing completely
          }
        }
      }

      handlersCache = handlers;
      handlersCacheTimestamp = currentTime;
    } catch (error) {
      console.error('Error reading handlers directory:', error);
      // If we can't load new handlers but have cached ones, use those
      if (!handlersCache) {
        handlersCache = [];
      }
    }
  }

  return handlersCache;
}

/**
 * Check if user is a bot admin
 * @param {Object} msg - Telegram message object
 * @returns {Boolean} true if sender is admin
 */
function isBotAdmin(msg) {
  if (!msg.from || !global.config || !global.config.admin) return false;

  const adminIDs = global.config.admin.map(id => parseInt(id));
  const senderId = parseInt(msg.from.id);

  return adminIDs.includes(senderId);
}

/**
 * Check if a chat is a group chat
 * @param {Object} chat - Telegram chat object
 * @returns {Boolean} true if chat is a group
 */
function isGroup(chat) {
  return chat && (chat.type === 'group' || chat.type === 'supergroup');
}

/**
 * Main listen function to process messages
 * @param {Object} options - Object containing bot, msg, and db
 */
exports.listen = async function ({ bot, msg, db }) {
  if (!msg || !msg.chat || !msg.from) {
    console.warn('Received invalid message object');
    return;
  }

  const chatId = msg.chat.id;
  const senderId = parseInt(msg.from.id);
  const botAdmin = isBotAdmin(msg);

  try {
    // Initialize Wataru helper only if we pass initial checks
    // to avoid unnecessary object creation
    let wataru = null;

    // Global admin-only mode check
    if (global.config && global.config.adminOnly && !botAdmin) {
      console.log(`[Global AdminOnly] Ignoring message from non-admin user: ${senderId}`);
      return;
    }

    // Group admin-only mode check
    if (isGroup(msg.chat)) {
      try {
        const groupRecord = await db.getGroup(chatId);

        if (groupRecord && groupRecord.onlyAdminBox == 1 && !botAdmin) {
          let isGroupAdmin = false;

          try {
            const member = await bot.getChatMember(chatId, senderId);
            isGroupAdmin = (member.status === "administrator" || member.status === "creator");
          } catch (error) {
            console.error(`Error checking group admin status for user ${senderId} in chat ${chatId}:`, error);
          }

          if (!isGroupAdmin) {
            console.log(`[Group AdminOnly] Ignoring message from non-admin in group ${chatId}: ${senderId}`);

            // Only initialize wataru if we need to send a message
            if (groupRecord.hideNotiMessageOnlyAdminBox != 1) {
              wataru = createWataru(bot, msg);
              await wataru.reply("This group is in admin-only mode. Only group admins can use the bot.");
            }

            return;
          }
        }
      } catch (groupError) {
        console.error(`Error checking group settings for ${chatId}:`, groupError);
        // Continue processing even if group check fails
      }
    }

    // Banned user check - load once and use for both checks
    let bannedUsers = [];
    try {
      bannedUsers = await db.banUserData() || [];
    } catch (userBanError) {
      console.error('Error fetching banned users:', userBanError);
    }

    if (Array.isArray(bannedUsers) && bannedUsers.includes(msg.from.id) && !botAdmin) {
      console.log(`[Banned] Ignoring message from banned user: ${msg.from.id}`);
      return;
    }

    // Banned group check
    if (isGroup(msg.chat)) {
      try {
        const bannedGroups = await db.banGroupData() || [];

        if (Array.isArray(bannedGroups) && bannedGroups.includes(chatId) && !botAdmin) {
          console.log(`[Banned] Ignoring message from banned group: ${chatId}`);
          return;
        }
      } catch (groupBanError) {
        console.error('Error fetching banned groups:', groupBanError);
        // Continue processing even if group ban check fails
      }
    }

    // Initialize Wataru here if it wasn't initialized earlier
    // and will be needed for handlers
    if (!wataru) {
      wataru = createWataru(bot, msg);
    }

    // Load and process handlers
    const handlers = await loadHandlers();

    // Process handlers in parallel with proper error handling
    await Promise.all(
      handlers.map(async ({ name, handler }) => {
        try {
          await handler({ bot, msg, chatId, wataru, db });
        } catch (handlerError) {
          console.error(`Error in handler "${name}":`, handlerError);
          // Individual handler errors shouldn't affect other handlers
        }
      })
    );

  } catch (error) {
    console.error(`Critical error processing message from ${senderId} in chat ${chatId}:`, error);
  }
};

// Export function to manually invalidate handlers cache (useful for testing or manual reloading)
exports.invalidateHandlersCache = function() {
  handlersCache = null;
  handlersCacheTimestamp = 0;
  console.log('Handlers cache invalidated, will reload on next request');
};