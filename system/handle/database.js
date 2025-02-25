exports.database = async function({ msg, db }) {
  try {
    // Record user data only if not already recorded.
    if (msg.from) {
      const existingUser = await db.getUser(msg.from.id);
      if (!existingUser) {
        const userData = {
          user_id: msg.from.id,
          first_name: msg.from.first_name || '',
          last_name: msg.from.last_name || '',
          username: msg.from.username || '',
          language_code: msg.from.language_code || '',
          is_bot: msg.from.is_bot ? 1 : 0
        };
        await db.upsertUser(userData);
        console.log(
          `[User] Recorded new user: ID ${msg.from.id}, Username: ${msg.from.username || msg.from.first_name}`
        );
      }
    }

    // Record group data only if not already recorded.
    if (msg.chat && (msg.chat.type === 'group' || msg.chat.type === 'supergroup')) {
      const existingGroup = await db.getGroup(msg.chat.id);
      if (!existingGroup) {
        const groupData = {
          group_id: msg.chat.id,
          title: msg.chat.title || '',
          description: msg.chat.description || '',
          rules: ''
        };
        await db.upsertGroup(groupData);
        console.log(
          `[Group] Recorded new group: ID ${msg.chat.id}, Title: ${msg.chat.title}`
        );
      }
    }
  } catch (error) {
    console.error("Error recording user/group data:", error);
  }
};
