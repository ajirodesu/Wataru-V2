const meta = {
  name: "user",
  version: "1.0.0",
  aliases: ["u"],
  description:
    "Manage users: list, ban, and unban. Without a subcommand, shows a paginated list (20 per page).",
  author: "AjiroDesu",
  prefix: "both",
  category: "management",
  type: "admin", // adjust as needed
  cooldown: 5,
  guide: `
[page]
  - Lists users (20 per page; default page = 1).

ban [user_id] [reason]
  - Bans the specified user by replying/mentioning their message or providing a user ID, with an optional reason.

unban [user_id]
  - Unbans the specified user by replying/mentioning their message or providing a user ID.
`
};

async function onStart({ bot, args, wataru, msg, db, usages }) {
  try {
    // Check for ban/unban subcommands.
    if (args[0] && ["ban", "unban"].includes(args[0].toLowerCase())) {
      const subCommand = args[0].toLowerCase();

      // Try to get the target user from a replied-to message first.
      let userId, fullName;
      if (msg.reply_to_message && msg.reply_to_message.from) {
        userId = msg.reply_to_message.from.id;
        const sender = msg.reply_to_message.from;
        if (sender.first_name) {
          fullName = sender.first_name + (sender.last_name ? ` ${sender.last_name}` : '');
        } else {
          fullName = "N/A";
        }
      } else if (args[1] && !isNaN(args[1])) {
        userId = parseInt(args[1]);
        // Attempt to fetch user details from the database.
        const users = await db.getAllUsers();
        const found = users.find(u => u.user_id === userId);
        if (found) {
          if (found.first_name) {
            fullName = found.first_name + (found.last_name ? ` ${found.last_name}` : '');
          } else {
            fullName = "N/A";
          }
        } else {
          fullName = `ID: ${userId}`;
        }
      }

      if (!userId) {
        return wataru.reply(
          "Please reply to or mention a user's message or provide a valid user ID for the ban/unban command."
        );
      }

      if (subCommand === "ban") {
        const reason = args.slice(2).join(" ") || "No reason provided";
        const result = await db.banUser(userId);
        if (result === false) {
          return wataru.reply(
            `Failed to ban user ${fullName} (ID: ${userId}). They might already be banned or the ID is invalid.`
          );
        }
        return wataru.reply(`User ${fullName} (ID: ${userId}) has been banned.\nReason: ${reason}`);
      } else if (subCommand === "unban") {
        await db.removeBanUser(userId);
        return wataru.reply(`User ${fullName} (ID: ${userId}) has been unbanned.`);
      }
    } else {
      // List users with pagination.
      let page = 1;
      if (args[0] && !isNaN(args[0])) {
        page = parseInt(args[0]);
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

      let response = `📝 User List\n\n`;
      pageUsers.forEach((user, idx) => {
        let fullName = "";
        if (user.first_name) {
          fullName = user.first_name + (user.last_name ? ` ${user.last_name}` : '');
        } else {
          fullName = "N/A";
        }
        response += `*${startIndex + idx + 1}.* ${fullName} - ${user.user_id}\n`;
      });
      response += `\nPage ${page} of ${totalPages}`;

      return wataru.reply(response, { parse_mode: "Markdown" });
    }
  } catch (error) {
    console.error(`[ user ] » ${error}`);
    return wataru.reply(`[ user ] » An error occurred.`);
  }
}

module.exports = { meta, onStart };