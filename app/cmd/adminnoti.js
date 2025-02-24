const moment = require("moment-timezone");

exports.meta = {
  name: "adminnoti",
  aliases: ["sendnoti", "notify", "noti"],
  version: "1.0.0",
  author: "ryuko",
  description: "Send a notification to all groups",
  guide: ["[msg]"],
  cooldown: 5,
  type: "admin",
  category: "admin"
};

exports.onStart = async function({ bot, chatId, args, msg, db }) {
  try {
    if (!args.length) {
      return await bot.sendMessage(chatId, "Please input message");
    }

    const timeStr = moment.tz("Asia/Manila").format("DD/MM/YYYY - HH:mm:ss");
    let adminName = msg.from.first_name;
    if (msg.from.last_name) adminName += " " + msg.from.last_name;

    let text = `Message from admins\n\nTime: ${timeStr}\nAdmin: ${adminName}\nMessage: ${args.join(" ")}\n\nReply to this message if you want to respond.`;

    // Retrieve all groups from the database.
    const groups = await db.getAllGroups();
    let successCount = 0, failCount = 0;

    for (const group of groups) {
      try {
        const sentMsg = await bot.sendMessage(group.group_id, text);
        successCount++;

        // Store a reply context so that if someone in the group replies,
        // we can forward it back to the admin.
        global.client.replies.set(sentMsg.message_id, {
          meta: exports.meta,
          type: "sendnoti", // indicates that a group reply will be forwarded to admin
          adminChat: chatId,
          groupChat: group.group_id
        });
      } catch (err) {
        failCount++;
      }
    }

    await bot.sendMessage(
      chatId,
      `Sent to ${successCount} groups, failed to send to ${failCount} groups.`
    );
  } catch (error) {
    await bot.sendMessage(chatId, `An error occurred: ${error.message}`);
  }
};

exports.onReply = async function({ bot, chatId, msg, db }) {
  try {
    const replyToId = msg.reply_to_message?.message_id;
    if (!replyToId || !global.client.replies.has(replyToId)) return;

    const context = global.client.replies.get(replyToId);

    // If a group member replies to the broadcast, forward it to the admin.
    if (context.type === "sendnoti") {
      const timeStr = moment.tz("Asia/Manila").format("DD/MM/YYYY - HH:mm:ss");
      const senderName = msg.from.first_name + (msg.from.last_name ? " " + msg.from.last_name : "");

      // Retrieve group info from the database.
      const groupInfo = await db.getGroup(context.groupChat);
      const groupTitle = groupInfo ? groupInfo.title : "Unknown Group";

      const forwardText = `${senderName} from group "${groupTitle}" replied at ${timeStr}:\n\n${msg.text || ""}`;

      const sentMsg = await bot.sendMessage(context.adminChat, forwardText);

      // Set a new reply context with type "reply" so that when admin replies, it goes back to group.
      global.client.replies.set(sentMsg.message_id, {
        meta: context.meta,
        type: "reply",
        adminChat: context.adminChat,
        groupChat: context.groupChat,
        originalGroupMessageId: msg.message_id
      });

      // Remove the old context.
      global.client.replies.delete(replyToId);
    }
    // If the admin replies back to the forwarded message, send it to the group.
    else if (context.type === "reply") {
      const replyText = `Admin replied:\n\n${msg.text || ""}`;
      const sentMsg = await bot.sendMessage(context.groupChat, replyText, {
        reply_to_message_id: context.originalGroupMessageId
      });

      // Set a new reply context with type "sendnoti" so that if a group member replies again, it'll be forwarded.
      global.client.replies.set(sentMsg.message_id, {
        meta: context.meta,
        type: "sendnoti",
        adminChat: context.adminChat,
        groupChat: context.groupChat
      });

      // Remove the previous admin reply context.
      global.client.replies.delete(replyToId);
    }
  } catch (error) {
    await bot.sendMessage(chatId, `Error processing your reply: ${error.message}`);
  }
};
