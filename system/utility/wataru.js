// wataru.js
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
    edit: { botMethod: "editMessageText", autoReply: false}
  };

  const wataru = {};

  for (const alias in mapping) {
    const { botMethod, autoReply } = mapping[alias];
    if (typeof bot[botMethod] !== "function") continue;
    wataru[alias] = function (...args) {
      // Determine if the last argument is an options object.
      let options;
      if (args.length > 0) {
        const lastArg = args[args.length - 1];
        if (typeof lastArg === "object" && lastArg !== null && !Array.isArray(lastArg)) {
          options = lastArg;
        }
      }
      // If no options object exists, create one and push it.
      if (!options) {
        options = {};
        args.push(options);
      }
      // For autoReply-enabled methods in non-private chats, add reply_to_message_id.
      if (autoReply && msg.chat.type !== "private" && !("reply_to_message_id" in options)) {
        options.reply_to_message_id = msg.message_id;
      }
      // Add default parse_mode if provided and not already specified.
      if (defaultParseMode && !("parse_mode" in options)) {
        options.parse_mode = defaultParseMode;
      }
      return bot[botMethod](msg.chat.id, ...args);
    };
  }

  for (const key in bot) {
    if (typeof bot[key] === "function" && !wataru[key]) {
      wataru[key] = bot[key].bind(bot);
    }
  }

  return wataru;
}

module.exports = { createWataru };
