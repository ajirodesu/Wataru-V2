function createWataru(bot, msg, defaultParseMode) {
  const mapping = {
    reply: { botMethod: "sendMessage", autoReply: true },
    photo: { botMethod: "sendPhoto", autoReply: true },
    audio: { botMethod: "sendAudio", autoReply: true },
    document: { botMethod: "sendDocument", autoReply: true },
    sticker: { botMethod: "sendSticker", autoReply: true },
    video: { botMethod: "sendVideo", autoReply: true },
    voice: { botMethod: "sendVoice", autoReply: true },
    videoNote: { botMethod: "sendVideoNote", autoReply: true },
    mediaGroup: { botMethod: "sendMediaGroup", autoReply: true },
    location: { botMethod: "sendLocation", autoReply: true },
    venue: { botMethod: "sendVenue", autoReply: true },
    contact: { botMethod: "sendContact", autoReply: true },
    poll: { botMethod: "sendPoll", autoReply: true },
    forward: { botMethod: "forwardMessage", autoReply: false },
    copy: { botMethod: "copyMessage", autoReply: false },
    chatAction: { botMethod: "sendChatAction", autoReply: false },
    invoice: { botMethod: "sendInvoice", autoReply: false },
    game: { botMethod: "sendGame", autoReply: false },
    edit: { botMethod: "editMessageText", autoReply: false }
  };

  const wataru = {};

  for (const alias in mapping) {
    const { botMethod, autoReply } = mapping[alias];
    if (typeof bot[botMethod] !== "function") continue;

    wataru[alias] = function (content, options = {}) {
      // Ensure options is an object
      if (typeof options !== "object" || options === null || Array.isArray(options)) {
        options = {};
      }

      // Handle parse_mode for captions
      if (options.parse_mode === false) {
        delete options.parse_mode; // Remove parse_mode to send caption as plain text
      } else if (defaultParseMode && !("parse_mode" in options)) {
        options.parse_mode = defaultParseMode; // Apply default if parse_mode isn’t specified
      }

      // Apply autoReply in non-private chats
      if (autoReply && msg.chat.type !== "private" && !("reply_to_message_id" in options)) {
        options.reply_to_message_id = msg.message_id;
      }

      // Call the bot method with chat ID, content, and options
      return bot[botMethod](msg.chat.id, content, options);
    };
  }

  // Bind other bot methods not in mapping
  for (const key in bot) {
    if (typeof bot[key] === "function" && !wataru[key]) {
      wataru[key] = bot[key].bind(bot);
    }
  }

  return wataru;
}

module.exports = { createWataru };