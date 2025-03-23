exports.meta = {
  name: "prefix",
  aliases: [],
  prefix: "both", // Command recognized with or without the normal prefix.
  version: "1.0.0",
  author: "AjiroDesu",
  type: "anyone",
  description: "Set or view the bot's prefix for this group.",
  guide: [
    "<new_prefix>  : Change the group prefix (requires confirmation).",
    "Without any arguments, it displays the current global and group prefixes."
  ],
  cooldown: 5,
  category: "settings"
};

exports.onStart = async function({ bot, chatId, msg, args, wataru, db }) {
  // In a private chat, only display the global prefix.
  if (msg.chat.type === "private") {
    return await wataru.reply(
      `🔹 Global prefix: ${global.config.prefix}`,
      { reply_to_message_id: msg.message_id }
    );
  }

  // In a group chat, if no new prefix is provided, display the current prefixes.
  if (!args[0]) {
    const globalPrefix = global.config.prefix;
    let groupPrefix = globalPrefix; // Default to global prefix.
    const group = await db.getGroup(chatId);
    if (group && group.prefix && group.prefix.trim() !== "") {
      groupPrefix = group.prefix;
    }
    return await wataru.reply(
      `✨ Global prefix: ${globalPrefix}\n✨ Group prefix: ${groupPrefix}`,
      { reply_to_message_id: msg.message_id }
    );
  }

  // A new prefix is provided in a group chat.
  const newPrefix = args[0];
  const senderId = msg.from.id;

  // Check permission: Only bot admins or group admins can change the prefix.
  const globalAdmins = (global.config && global.config.admin)
    ? (Array.isArray(global.config.admin) ? global.config.admin : [global.config.admin])
    : [];
  let isAllowed = false;
  if (globalAdmins.includes(String(senderId))) {
    isAllowed = true;
  } else {
    try {
      const chatMember = await bot.getChatMember(chatId, senderId);
      if (chatMember && (chatMember.status === "administrator" || chatMember.status === "creator")) {
        isAllowed = true;
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
    }
  }

  if (!isAllowed) {
    return await bot.sendMessage(
      chatId,
      "🚫 Only bot admins and group admins can change the prefix.",
      { reply_to_message_id: msg.message_id }
    );
  }

  // Build an inline confirmation button using the new prefix.
  const confirmButton = {
    text: `Confirm "${newPrefix}"`,
    callback_data: JSON.stringify({
      command: "prefix",
      action: "confirm",
      newPrefix: newPrefix
    })
  };

  // Send a confirmation message.
  return await bot.sendMessage(
    chatId,
    `Are you sure you want to change the group prefix to "${newPrefix}"?`,
    {
      reply_to_message_id: msg.message_id,
      reply_markup: { inline_keyboard: [[confirmButton]] }
    }
  );
};

exports.onCallback = async function({ bot, callbackQuery, chatId, wataru, db }) {
  // Parse the callback data.
  let payload;
  try {
    payload = JSON.parse(callbackQuery.data);
  } catch (err) {
    console.error("Error parsing callback data:", err);
    return await bot.editMessageText(
      `❌ Invalid callback data.`,
      { chat_id: chatId, message_id: callbackQuery.message.message_id }
    );
  }

  // Validate that the newPrefix is provided.
  if (!payload.newPrefix || payload.newPrefix.trim() === "") {
    return await bot.editMessageText(
      `❌ Invalid prefix provided.`,
      { chat_id: chatId, message_id: callbackQuery.message.message_id }
    );
  }
  const newPrefix = payload.newPrefix.trim();

  // Retrieve the current group record.
  let group = await db.getGroup(chatId);
  if (!group) {
    // If the group is not registered, create a new record with the new prefix.
    group = {
      group_id: chatId,
      title: "",
      description: "",
      rules: "",
      prefix: newPrefix,
      banned: 0
    };
    await db.upsertGroup(group);
  } else {
    // Otherwise, update the group's prefix.
    await db.updateGroupPrefix(chatId, newPrefix);
  }

  // Edit the original confirmation message to show the updated result.
  await bot.editMessageText(
    `✅ Group prefix has been updated to "${newPrefix}".`,
    {
      chat_id: chatId,
      message_id: callbackQuery.message.message_id
    }
  );
};