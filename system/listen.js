const fs = require('fs');
const path = require('path');
const db = require('./database/database');
const { createWataru } = require("./utility/wataru");

exports.listen = async function ({ bot, msg }) {
  try {
    const wataru = createWataru(bot, msg);

    // Use global.config.admin as the list of bot admin IDs.
    const adminIDs = global.config.admin.map(id => parseInt(id));

    // Check if the sender is a bot admin.
    const senderId = msg.from && parseInt(msg.from.id);
    const isBotAdmin = senderId && adminIDs.includes(senderId);

    // Global admin-only mode: if enabled, ignore messages from non-admins.
    if (global.config.adminOnly && !isBotAdmin) {
      console.log(`[Global AdminOnly] Ignoring message from non-admin user: ${senderId}`);
      return;
    }

    // In group chats, check group-specific admin-only mode.
    if (msg.chat && (msg.chat.type === 'group' || msg.chat.type === 'supergroup')) {
      const groupRecord = await db.getGroup(msg.chat.id);
      if (groupRecord && groupRecord.onlyAdminBox == 1) {
        // Check if the sender is a group admin.
        let isGroupAdmin = false;
        try {
          const member = await bot.getChatMember(msg.chat.id, senderId);
          isGroupAdmin = (member.status === "administrator" || member.status === "creator");
        } catch (error) {
          console.error("Error checking group admin status:", error);
        }
        if (!isBotAdmin && !isGroupAdmin) {
          console.log(`[Group AdminOnly] Ignoring message from non-admin in group ${msg.chat.id}: ${senderId}`);
          // Optionally send a notification if not hidden.
          if (groupRecord.hideNotiMessageOnlyAdminBox != 1) {
            await wataru.reply("This group is in admin-only mode. Only group admins can use the bot.");
          }
          return;
        }
      }
    }

    // Existing banned user/group checks.
    if (msg.from) {
      const bannedUsers = await db.banUserData();
      if (Array.isArray(bannedUsers) && bannedUsers.includes(msg.from.id)) {
        console.log(`[Banned] Ignoring message from banned user: ${msg.from.id}`);
        return;
      }
    }

    if (msg.chat && (msg.chat.type === 'group' || msg.chat.type === 'supergroup')) {
      const bannedGroups = await db.banGroupData();
      if (Array.isArray(bannedGroups) && bannedGroups.includes(msg.chat.id)) {
        console.log(`[Banned] Ignoring message from banned group: ${msg.chat.id}`);
        return;
      }
    }

    // Process all handlers.
    const handlersPath = path.join(__dirname, 'handle');
    const files = fs.readdirSync(handlersPath);
    for (const file of files) {
      if (file.endsWith('.js')) {
        const handlerModule = require(path.join(handlersPath, file));
        const handlerName = path.basename(file, '.js');
        const handler = handlerModule[handlerName];
        if (typeof handler === 'function') {
          await handler({ bot, msg, chatId: msg.chat.id, wataru, db });
        } else {
          console.warn(`Handler ${file} does not export a function named "${handlerName}".`);
        }
      }
    }
  } catch (error) {
    console.error('Error reading handlers directory:', error);
  }
};
