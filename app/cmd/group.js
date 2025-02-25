const meta = {
  name: "group",
  version: "1.0.0",
  aliases: ["grp"],
  description:
    "Manage groups: list, ban, and unban. Without a subcommand, shows a paginated list (20 per page).",
  author: "AjiroDesu",
  prefix: "both",
  category: "management",
  type: "admin", // adjust as needed
  cooldown: 5,
  guide: `
[page]
  - Lists groups (20 per page; default page = 1).
ban [reason]
  - Bans the current group with an optional reason.
unban
  - Unbans the current group.
`
};

async function onStart({ bot, args, wataru, msg, db, usages }) {
  try {
    // Extract the group's title, if available.
    const groupId = msg.chat.id;
    const groupName = msg.chat.title || `ID: ${groupId}`;

    // Check for ban/unban subcommands.
    if (args[0] && ["ban", "unban"].includes(args[0].toLowerCase())) {
      const subCommand = args[0].toLowerCase();
      if (subCommand === "ban") {
        const reason = args.slice(1).join(" ") || "No reason provided";
        const result = await db.banGroup(groupId);
        if (result === false) {
          return wataru.reply(
            `Failed to ban group ${groupName} (ID: ${groupId}). It might already be banned or the group is invalid.`
          );
        }
        return wataru.reply(
          `Group ${groupName} (ID: ${groupId}) has been banned.\nReason: ${reason}`
        );
      } else if (subCommand === "unban") {
        await db.removeBanGroup(groupId);
        return wataru.reply(
          `Group ${groupName} (ID: ${groupId}) has been unbanned.`
        );
      }
    } else {
      // List groups with pagination.
      let page = 1;
      if (args[0] && !isNaN(args[0])) {
        page = parseInt(args[0]);
      }

      const groups = await db.getAllGroups();
      if (!groups || groups.length === 0) {
        return wataru.reply("No group data available.");
      }

      const itemsPerPage = 20;
      const totalPages = Math.ceil(groups.length / itemsPerPage);
      if (page < 1 || page > totalPages) page = 1;

      const startIndex = (page - 1) * itemsPerPage;
      const pageGroups = groups.slice(startIndex, startIndex + itemsPerPage);

      let response = `📝 Group List\n\n`;
      pageGroups.forEach((group, idx) => {
        let groupTitle = group.title || "N/A";
        response += `*${startIndex + idx + 1}.* ${groupTitle} - ${group.group_id}\n`;
      });
      response += `\nPage ${page} of ${totalPages}`;

      return wataru.reply(response, { parse_mode: "Markdown" });
    }
  } catch (error) {
    console.error(`[ group ] » ${error}`);
    return wataru.reply(`[ group ] » An error occurred.`);
  }
}

module.exports = { meta, onStart };