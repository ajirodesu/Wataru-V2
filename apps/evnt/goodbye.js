const meta = {
  name: "goodbye",
  description: "Handles members leaving the group and sends goodbye messages.",
  type: "leave",
  author: "AjiroDesu"
};

async function onStart({ bot, msg }) {
  const chatId = msg.chat.id;
  const leftMember = msg.left_chat_member;

  try {
    if (!leftMember) return;

    const { first_name, last_name, id: userId } = leftMember;
    const fullName = `${first_name}${last_name ? ' ' + last_name : ''}`;

    // Get bot info to check if bot was removed
    const botInfo = await bot.getMe();

    // Handle bot removal
    if (userId === botInfo.id) {
      const chatInfo = await bot.getChat(chatId);
      const title = chatInfo.title || 'the group';
      const actionBy = `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}`;

      console.log(`Bot was removed from ${title} by ${actionBy}.`);
      return;
    }

    // Get current member count
    const memberCount = (await bot.getChatMemberCount(chatId)) - 1;

    // Prepare goodbye message
    const goodbyeMessage = msg.from.id === userId
      ? `${fullName} has left the group. We'll miss you!`
      : `Goodbye, ${fullName}. You were removed by an admin.`;

    // Send goodbye text message only
    await bot.sendMessage(chatId, goodbyeMessage);

  } catch (error) {
    console.log('Error in goodbye handler:', error);
    if (global.config?.admin) {
      await bot.sendMessage(
        global.config.admin,
        `Error in goodbye handler:\n${error.message}`
      );
    }
  }
};

module.exports = { meta, onStart };