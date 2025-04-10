const meta = {
  name: 'id',
  version: '1.0.0',
  description: 'Get user ID information',
  author: 'JohnDev19',
  type: 'anyone',
  cooldown: 0,
  category: 'utility',
  guide: [
    '[username]',
  ]
};

async function onStart({ bot, msg, args, chatId, db }) {
  try {
    let targetUser;

    // Case 1: Command is a reply to another message
    if (msg.reply_to_message && msg.reply_to_message.from) {
      targetUser = msg.reply_to_message.from;
    }
    // Case 2: Command includes a username argument (e.g., /id @username)
    else if (args[0] && args[0].startsWith('@')) {
      const username = args[0].slice(1); // Remove '@' from the username
      const users = await db.getAllUsers(); // Get all users from the database
      // Find user with matching username (case-insensitive)
      const targetUserData = users.find(user => 
        user.username && user.username.toLowerCase() === username.toLowerCase()
      );

      if (!targetUserData) {
        return bot.sendMessage(chatId, `❌ User @${username} not found.`);
      }

      const userId = targetUserData.user_id;
      // Verify the user is in the group
      try {
        const chatMember = await bot.getChatMember(chatId, userId);
        targetUser = chatMember.user;
      } catch (error) {
        if (error.response && error.response.statusCode === 400) {
          return bot.sendMessage(chatId, `❌ User @${username} is not in this group.`);
        }
        throw error; // Re-throw other errors
      }
    }
    // Case 3: No arguments or reply, use the sender's ID
    else {
      targetUser = msg.from;
    }

    // Retrieve user profile photos
    let userPhotos;
    try {
      userPhotos = await bot.getUserProfilePhotos(targetUser.id);
    } catch (photoError) {
      console.error('Profile photo error:', photoError);
      userPhotos = null;
    }

    // Construct user details message
    const userDetails = `
📋 *User Information*

👤 Name: ${targetUser.first_name || ''} ${targetUser.last_name || ''}
🆔 User ID: \`${targetUser.id}\`
👥 Username: ${targetUser.username ? '@' + targetUser.username : 'No username'}

🌐 *Chat Details:*
💬 Chat ID: \`${msg.chat.id}\`
📊 Chat Type: ${msg.chat.type}
    `;

    // Send response with photo if available, otherwise just the text
    if (userPhotos && userPhotos.photos.length > 0) {
      await bot.sendPhoto(chatId, userPhotos.photos[0][0].file_id, {
        caption: userDetails,
        parse_mode: 'Markdown'
      });
    } else {
      await bot.sendMessage(chatId, userDetails, {
        parse_mode: 'Markdown'
      });
    }

  } catch (error) {
    console.error('ID Command Error:', error);
    await bot.sendMessage(chatId, '❌ An error occurred while retrieving ID information.');
  }
};

module.exports = { meta, onStart };