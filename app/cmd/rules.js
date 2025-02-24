const meta = {
  name: "rules",
  version: "1.0.0",
  aliases: [],
  description: "Manage group rules. List, add, remove, or reset rules.",
  author: "AjirDesu",
  prefix: "both",
  category: "management",
  type: "group",
  cooldown: 5,
  guide: `
     - Lists current rules.
    add <rule text>
     - Adds a new rule (bot admin or group admin required).
    remove <rule number>
     - Removes the rule with that number (bot admin or group admin required).
     reset
     - Resets (clears) all rules (bot admin only).
`
};

async function isGroupAdmin(bot, chatId, userId) {
  try {
    const member = await bot.getChatMember(chatId, userId);
    return (member.status === 'creator' || member.status === 'administrator');
  } catch (e) {
    return false;
  }
}

async function onStart({ bot, args, wataru, msg, db }) {
  try {
    const chatId = msg.chat.id;
    let group = await db.getGroup(chatId);
    if (!group) {
      // If the group is not recorded yet, create a new record with empty rules.
      await db.upsertGroup({
        group_id: chatId,
        title: msg.chat.title || '',
        description: msg.chat.description || '',
        rules: ''
      });
      group = await db.getGroup(chatId);
    }

    // No subcommand: list the rules.
    if (args.length === 0) {
      let rulesList = [];
      if (group.rules && group.rules.trim().length > 0) {
        rulesList = group.rules.split('\n');
      }
      if (rulesList.length === 0) {
        return wataru.reply("There are no rules set for this group.");
      }
      let response = "📜 *Group Rules:*\n\n";
      rulesList.forEach((rule, idx) => {
        response += `*${idx + 1}.* ${rule}\n`;
      });
      return wataru.reply(response, { parse_mode: "Markdown" });
    }

    // Process subcommands: add, remove, or reset.
    const subCommand = args[0].toLowerCase();
    const senderId = parseInt(msg.from.id);
    const botAdminIDs = global.config.admin.map(id => parseInt(id));
    const isBotAdmin = botAdminIDs.includes(senderId);
    let isGroupAdminUser = false;
    if (msg.chat && (msg.chat.type === 'group' || msg.chat.type === 'supergroup')) {
      isGroupAdminUser = await isGroupAdmin(bot, chatId, senderId);
    }

    // For add and remove, the user must be either a bot admin or a group admin.
    if (subCommand === "add") {
      if (!isBotAdmin && !isGroupAdminUser) {
        return wataru.reply("You do not have permission to add a rule. Only group admins or bot admins can add rules.");
      }
      const newRule = args.slice(1).join(" ").trim();
      if (!newRule) {
        return wataru.reply("Please provide the text for the new rule.");
      }
      let rulesList = [];
      if (group.rules && group.rules.trim().length > 0) {
        rulesList = group.rules.split('\n');
      }
      rulesList.push(newRule);
      const updatedRules = rulesList.join('\n');
      await db.updateGroupRules(chatId, updatedRules);
      return wataru.reply(`Rule added successfully. Total rules: ${rulesList.length}.`);

    } else if (subCommand === "remove") {
      if (!isBotAdmin && !isGroupAdminUser) {
        return wataru.reply("You do not have permission to remove a rule. Only group admins or bot admins can remove rules.");
      }
      const ruleNumber = parseInt(args[1]);
      if (isNaN(ruleNumber) || ruleNumber < 1) {
        return wataru.reply("Please provide a valid rule number to remove.");
      }
      let rulesList = [];
      if (group.rules && group.rules.trim().length > 0) {
        rulesList = group.rules.split('\n');
      }
      if (ruleNumber > rulesList.length) {
        return wataru.reply(`Rule number ${ruleNumber} does not exist. There are only ${rulesList.length} rules.`);
      }
      const removedRule = rulesList.splice(ruleNumber - 1, 1);
      const updatedRules = rulesList.join('\n');
      await db.updateGroupRules(chatId, updatedRules);
      return wataru.reply(`Removed rule ${ruleNumber}: "${removedRule}". Total rules now: ${rulesList.length}.`);

    } else if (subCommand === "reset") {
      // Reset is allowed only for bot admins.
      if (!isBotAdmin) {
        return wataru.reply("Only the bot admin can reset the rules.");
      }
      await db.updateGroupRules(chatId, '');
      return wataru.reply("All rules have been reset.");
    } else {
      return wataru.reply("Invalid subcommand. Please use 'add', 'remove', or 'reset'.");
    }

  } catch (error) {
    console.error(`[ rules ] » ${error}`);
    return wataru.reply(`[ rules ] » An error occurred.`);
  }
}

module.exports = { meta, onStart };
