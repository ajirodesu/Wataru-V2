/**
 * Handles Telegram bot callback queries
 * @param {Object} options - The options object
 * @param {TelegramBot} options.bot - The Telegram bot instance
 * @param {Object} options.msg - The message object
 * @param {number|string} options.chatId - The chat ID
 * @param {Object} options.wataru - The wataru instance
 */
exports.callback = function({ bot, msg, chatId, wataru, db }) {
  // Store the existing listener to avoid duplicate registrations
  if (bot._callbackHandler) {
    bot.removeListener('callback_query', bot._callbackHandler);
  }

  // Create the callback handler
  bot._callbackHandler = async (callbackQuery) => {
    if (!callbackQuery || !callbackQuery.data) {
      console.error('Invalid callback query received:', callbackQuery);
      return;
    }

    let payload;
    try {
      // Attempt to parse the callback data as JSON
      payload = JSON.parse(callbackQuery.data);
    } catch (err) {
      // Fallback to colon-separated data
      const parts = callbackQuery.data.split(':');
      if (!parts.length) {
        console.error('Invalid callback data format:', callbackQuery.data);
        return;
      }
      payload = { command: parts[0], args: parts.slice(1) };
    }

    if (!payload.command) {
      console.error('No command found in payload:', payload);
      try {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Invalid callback format."
        });
      } catch (error) {
        console.error('Failed to answer invalid callback query:', error);
      }
      return;
    }

    const { commands } = global.client;
    if (!commands) {
      console.error('Global client commands not initialized');
      return;
    }

    const command = commands.get(payload.command);

    if (!command || typeof command.onCallback !== 'function') {
      console.error(`No valid onCallback handler found for command: ${payload.command}`);
      try {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Command not found.",
          show_alert: true
        });
      } catch (error) {
        console.error('Failed to answer callback query:', error);
      }
      return;
    }

    try {
      // Ensure message exists before accessing chat.id
      const messageId = callbackQuery.message?.message_id;
      const chatId = callbackQuery.message?.chat?.id;

      if (!chatId) {
        throw new Error('Chat ID not found in callback query');
      }

      await command.onCallback({
        bot,
        callbackQuery,
        chatId,
        messageId,
        args: payload.args || [],
        payload,
        db
      });

      // Answer the callback query if not already answered
      if (!callbackQuery.answered) {
        await bot.answerCallbackQuery(callbackQuery.id);
      }
    } catch (error) {
      console.error(`Error executing onCallback for command "${payload.command}":`, error);
      try {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "An error occurred. Please try again.",
          show_alert: true
        });
      } catch (innerError) {
        console.error('Failed to answer error callback:', innerError);
      }
    }
  };

  // Register the new handler
  bot.on('callback_query', bot._callbackHandler);
};