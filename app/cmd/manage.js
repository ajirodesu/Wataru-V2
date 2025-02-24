const meta = {
  name: "manage",
  version: "1.0.0",
  aliases: ["mg"],
  description: "List and manage users and groups. Without a subcommand, shows a paginated list (20 per page). For both users and groups, use 'ban' or 'unban' as a subcommand with an optional reason for ban.",
  author: "AjiroDesu",
  prefix: "both",
  category: "management",
  type: "admin",  // adjust as needed
  cooldown: 5,
  guide: `
  user [page]  
    - Lists users (20 per page; default page = 1).

  user ban <user_id> [reason]  
    - Bans the specified user with an optional reason.

  user unban <user_id>  
    - Unbans the specified user.

  group [page]  
    - Lists groups (20 per page; default page = 1).

  group ban <group_id> [reason]
    - Bans the specified group with an optional reason.

  group unban <group_id>
    - Unbans the specified group.
`
};

async function onStart({ bot, args, wataru, msg, db, usages }) {
  try {
    if (!args[0]) {
      return usages();
    }
    const targetType = args[0].toLowerCase();

    // ---- User Management ----
    if (targetType === "user") {
      if (args[1] && ["ban", "unban"].includes(args[1].toLowerCase())) {
        const subCommand = args[1].toLowerCase();
        const userIdArg = args[2];
        if (!userIdArg || isNaN(userIdArg)) {
          return wataru.reply("Please provide a valid user ID for the ban/unban command.");
        }
        const userId = parseInt(userIdArg);
        if (subCommand === "ban") {
          const reason = args.slice(3).join(" ") || "No reason provided";
          const result = await db.banUser(userId);
          if (result === false) {
            return wataru.reply(`Failed to ban user ${userId}. They might already be banned or the ID is invalid.`);
          }
          return wataru.reply(`User ${userId} has been banned.\nReason: ${reason}`);
        } else if (subCommand === "unban") {
          await db.removeBanUser(userId);
          return wataru.reply(`User ${userId} has been unbanned.`);
        }
      } else {
        // List users with pagination.
        let page = 1;
        if (args[1] && !isNaN(args[1])) {
          page = parseInt(args[1]);
        }
        const users = await db.getAllUsers();
        if (!users || users.length === 0) {
          return wataru.reply("No user data available.");
        }
        const itemsPerPage = 20;
        const totalPages = Math.ceil(users.length / itemsPerPage);
        if (page < 1 || page > totalPages) page = 1;
        const startIndex = (page - 1) * itemsPerPage;
        const pageUsers = users.slice(startIndex, startIndex + itemsPerPage);
        let response = `📝 *User List* (Page ${page} of ${totalPages}):\n\n`;
        pageUsers.forEach((user, idx) => {
          // Build a full name based on available data.
          let fullName = "";
          if (user.username) {
            fullName = `@${user.username}`;
          } else if (user.first_name) {
            fullName = user.first_name;
            if (user.last_name) {
              fullName += ` ${user.last_name}`;
            }
          } else {
            fullName = "N/A";
          }
          response += `*${startIndex + idx + 1}.* [ID: ${user.user_id}] - *Name:* ${fullName}\n`;
        });
        return wataru.reply(response, { parse_mode: "Markdown"});
      }
    }

    // ---- Group Management ----
    else if (targetType === "group") {
      if (args[1] && ["ban", "unban"].includes(args[1].toLowerCase())) {
        const subCommand = args[1].toLowerCase();
        const groupIdArg = args[2];
        if (!groupIdArg || isNaN(groupIdArg)) {
          return wataru.reply("Please provide a valid group ID for the ban/unban command.");
        }
        const groupId = parseInt(groupIdArg);
        if (subCommand === "ban") {
          const reason = args.slice(3).join(" ") || "No reason provided";
          const result = await db.banGroup(groupId);
          if (result === false) {
            return wataru.reply(`Failed to ban group ${groupId}. It might already be banned or the ID is invalid.`);
          }
          return wataru.reply(`Group ${groupId} has been banned.\nReason: ${reason}`);
        } else if (subCommand === "unban") {
          await db.removeBanGroup(groupId);
          return wataru.reply(`Group ${groupId} has been unbanned.`);
        }
      } else {
        // List groups with pagination.
        let page = 1;
        if (args[1] && !isNaN(args[1])) {
          page = parseInt(args[1]);
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
        let response = `📝 *Group List* (Page ${page} of ${totalPages}):\n\n`;
        pageGroups.forEach((group, idx) => {
          let groupTitle = group.title || "N/A";
          response += `*${startIndex + idx + 1}.* [ID: ${group.group_id}] - *Title:* ${groupTitle}\n`;
        });
        return wataru.reply(response, { parse_mode: "Markdown"});
      }
    }

    // Invalid target type
    else {
      return wataru.reply("Invalid target type. Please specify 'user' or 'group'.");
    }
  } catch (error) {
    console.error(`[ manage ] » ${error}`);
    return wataru.reply(`[ manage ] » An error occurred.`);
  }
}

module.exports = { meta, onStart };
