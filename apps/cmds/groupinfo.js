const meta = {
  name: "groupinfo",
  aliases: ["chatinfo"],
  prefix: "both",
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Displays detailed group information.",
  guide: ["groupinfo"],
  cooldown: 3,
  type: "anyone",
  category: "Utility"
};

async function onStart({ wataru, msg, chatId, args, db }) {
  try {
    // Ensure the command is run in a group or supergroup.
    if (msg.chat && (msg.chat.type === 'group' || msg.chat.type === 'supergroup')) {
      const group = await db.getGroup(msg.chat.id);
      if (!group) {
        await wataru.reply("**Group not found in the database.**", { parse_mode: "Markdown" });
        return;
      }
      let response = `**Group Information**\n\n` +
                     `**Title:** ${group.title}\n` +
                     `**Description:** ${group.description || "N/A"}\n` +
                     `**Rules:** ${group.rules || "N/A"}\n` +
                     `**Prefix:** ${group.prefix || "N/A"}\n` +
                     `**Banned:** ${group.banned ? "Yes" : "No"}`;
      await wataru.reply(response, { parse_mode: "Markdown" });
    } else {
      await wataru.reply("**This command can only be used in a group chat.**", { parse_mode: "Markdown" });
    }
  } catch (error) {
    console.error("Error in groupinfo command:", error);
    await wataru.reply("**An error occurred while retrieving group info.**", { parse_mode: "Markdown" });
  }
}

module.exports = { meta, onStart };
