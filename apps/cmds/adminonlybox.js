exports.meta = {
  name: "onlyadminbox",
  aliases: ["onlyadbox", "adboxonly", "adminboxonly"],
  prefix: true, // triggered by text
  type: "administrator",
  version: "1.3",
  author: "NTKhang",
  description: "Turn on/off the mode that only group admins can use the bot",
  category: "group settings",
  guide: [
    "[on | off]: Turn on/off the mode that only group admins can use the bot",
    "noti [on | off]: Turn on/off the notification when a non-admin uses the bot"
  ]
};

exports.onStart = async function({ wataru, chatId, msg, args, db }) {
  // Determine which setting is being updated.
  let isSettingNoti = false;
  let value;
  let keyToUpdate = "onlyAdminBox"; // default setting key
  let argIndex = 0;

  if (args[0] && args[0].toLowerCase() === "noti") {
    isSettingNoti = true;
    keyToUpdate = "hideNotiMessageOnlyAdminBox";
    argIndex = 1;
  }

  if (!args[argIndex]) {
    return wataru.reply("Syntax error: please specify 'on' or 'off'.");
  }

  const input = args[argIndex].toLowerCase();
  if (input === "on") {
    value = true;
  } else if (input === "off") {
    value = false;
  } else {
    return wataru.reply("Syntax error: only 'on' or 'off' are allowed.");
  }

  // For the notification setting, reverse the value.
  const finalValue = isSettingNoti ? (!value) : value;

  // Retrieve the current group record using the chatId.
  let groupRecord = await db.getGroup(chatId);
  if (!groupRecord) {
    // Create a new record for this group.
    groupRecord = {
      group_id: chatId,
      title: "", // Unknown at this point.
      description: "",
      rules: "",
      prefix: "", // Default prefix remains global.
      banned: 0,
      onlyAdminBox: keyToUpdate === "onlyAdminBox" ? (finalValue ? 1 : 0) : 0,
      hideNotiMessageOnlyAdminBox: keyToUpdate === "hideNotiMessageOnlyAdminBox" ? (finalValue ? 1 : 0) : 0
    };
    await db.upsertGroup(groupRecord);
  } else {
    // Update the setting.
    groupRecord.onlyAdminBox = keyToUpdate === "onlyAdminBox" ? (finalValue ? 1 : 0) : groupRecord.onlyAdminBox;
    groupRecord.hideNotiMessageOnlyAdminBox = keyToUpdate === "hideNotiMessageOnlyAdminBox" ? (finalValue ? 1 : 0) : groupRecord.hideNotiMessageOnlyAdminBox;
    await db.upsertGroup(groupRecord);
  }

  if (isSettingNoti) {
    return wataru.reply(
      value
        ? "Notification enabled when a non-admin uses the bot."
        : "Notification disabled when a non-admin uses the bot."
    );
  } else {
    return wataru.reply(
      value ? "Only admin mode enabled." : "Only admin mode disabled."
    );
  }
};