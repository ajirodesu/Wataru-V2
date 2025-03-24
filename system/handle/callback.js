/**
 * Handles Telegram bot callback queries
 * @param {Object} options - The options object
 * @param {TelegramBot} options.bot - The Telegram bot instance
 * @param {Object} options.msg - The message object
 * @param {number|string} options.chatId - The chat ID
 * @param {Object} options.wataru - The wataru instance
 */
exports.callback = function({ bot, msg, chatId, wataru, db }) {
  // Remove existing handler if present to avoid duplicates.
  if (bot._callbackHandler) {
    bot.removeListener('callback_query', bot._callbackHandler);
  }

  // Helper to parse callback data.
  const parsePayload = (data) => {
    try {
      return JSON.parse(data);
    } catch (err) {
      const parts = data.split(':');
      return parts.length ? { command: parts[0], args: parts.slice(1) } : null;
    }
  };

  // Centralized callback handler.
  bot._callbackHandler = async (callbackQuery) => {
    if (!callbackQuery?.data) {
      console.error('Invalid callback query received:', callbackQuery);
      return;
    }

    const payload = parsePayload(callbackQuery.data);
    if (!payload || !payload.command) {
      console.error('No command found in payload:', payload);
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "Invalid callback format."
      }).catch(console.error);
    }

    const { commands } = global.client;
    if (!commands) {
      console.error('Global client commands not initialized');
      return;
    }

    const command = commands.get(payload.command);
    if (!command || typeof command.onCallback !== 'function') {
      console.error(`No valid onCallback handler found for command: ${payload.command}`);
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "Command not found.",
        show_alert: true
      }).catch(console.error);
    }

    try {
      const messageId = callbackQuery.message?.message_id;
      const chatId = callbackQuery.message?.chat?.id;
      if (!chatId) throw new Error('Chat ID not found in callback query');

      await command.onCallback({
        bot,
        callbackQuery,
        chatId,
        messageId,
        args: payload.args || [],
        payload,
        db
      });

      if (!callbackQuery.answered) {
        await bot.answerCallbackQuery(callbackQuery.id);
      }
    } catch (error) {
      console.error(`Error executing onCallback for command "${payload.command}":`, error);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "An error occurred. Please try again.",
        show_alert: true
      }).catch(console.error);
    }
  };

  // Register the new handler.
  bot.on('callback_query', bot._callbackHandler);
};
