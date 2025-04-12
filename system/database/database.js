const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the path for the database file
const dbFilePath = path.join(__dirname, 'wataru.db');

// Open (or create) the SQLite database
const db = new sqlite3.Database(dbFilePath, (err) => {
  if (err) console.error("Error opening database:", err);
  else console.log("Connected to Wataru database.");
});

// Create the required tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      username TEXT,
      language_code TEXT,
      is_bot INTEGER,
      coin_balance INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      message_count INTEGER DEFAULT 0,
      banned INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS groups (
      group_id INTEGER PRIMARY KEY,
      title TEXT,
      description TEXT,
      rules TEXT,
      prefix TEXT DEFAULT '',
      banned INTEGER DEFAULT 0,
      onlyAdminBox INTEGER DEFAULT 0,
      hideNotiMessageOnlyAdminBox INTEGER DEFAULT 0,
      badwords_enabled INTEGER DEFAULT 0,
      badwords_words TEXT,
      badwords_violations TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS warns (
      group_id INTEGER,
      user_id INTEGER,
      reason TEXT,
      dateTime TEXT,
      warnBy INTEGER,
      PRIMARY KEY (group_id, user_id, dateTime)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS busy (
      user_id INTEGER PRIMARY KEY,
      reason TEXT
    )
  `);
});

// Helper functions using Promises
function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (error) {
      if (error) reject(error);
      else resolve(this);
    });
  });
}

function getQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (error, row) => {
      if (error) reject(error);
      else resolve(row);
    });
  });
}

function allQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });
}

/*============================
  BAN FUNCTIONS (USERS & GROUPS)
============================*/

async function banUser(userId) {
  try {
    if (!userId || isNaN(userId)) return false;
    const user = await getQuery("SELECT banned FROM users WHERE user_id = ?", [userId]);
    if (user && user.banned == 1) return false; // Already banned
    if (user) {
      await runQuery("UPDATE users SET banned = 1 WHERE user_id = ?", [userId]);
    } else {
      await runQuery(
        "INSERT INTO users (user_id, first_name, last_name, username, language_code, is_bot, banned) VALUES (?, '', '', '', '', 0, 1)",
        [userId]
      );
    }
    return true;
  } catch (error) {
    console.error("Error banning user:", error);
  }
}

async function banGroup(groupId) {
  try {
    if (!groupId || isNaN(groupId)) return false;
    const group = await getQuery("SELECT banned FROM groups WHERE group_id = ?", [groupId]);
    if (group && group.banned == 1) return false; // Already banned
    if (group) {
      await runQuery("UPDATE groups SET banned = 1 WHERE group_id = ?", [groupId]);
    } else {
      await runQuery(
        "INSERT INTO groups (group_id, title, description, rules, prefix, banned) VALUES (?, '', '', '', '', 1)",
        [groupId]
      );
    }
    return true;
  } catch (error) {
    console.error("Error banning group:", error);
  }
}

async function removeBanUser(userId) {
  try {
    if (!userId || isNaN(userId)) return;
    await runQuery("UPDATE users SET banned = 0 WHERE user_id = ?", [userId]);
  } catch (error) {
    console.error("Error removing banned user:", error);
  }
}

async function removeBanGroup(groupId) {
  try {
    if (!groupId || isNaN(groupId)) return;
    await runQuery("UPDATE groups SET banned = 0 WHERE group_id = ?", [groupId]);
  } catch (error) {
    console.error("Error removing banned group:", error);
  }
}

async function banUserData() {
  try {
    const rows = await allQuery("SELECT user_id FROM users WHERE banned = 1", []);
    return rows.map(row => row.user_id);
  } catch (error) {
    console.error("Error retrieving banned user data:", error);
  }
}

async function banGroupData() {
  try {
    const rows = await allQuery("SELECT group_id FROM groups WHERE banned = 1", []);
    return rows.map(row => row.group_id);
  } catch (error) {
    console.error("Error retrieving banned group data:", error);
  }
}

/*============================
  COIN FUNCTIONS
============================*/

async function addCoin(userId, coinAmount) {
  try {
    if (!userId || isNaN(userId) || isNaN(coinAmount)) return;
    const user = await getQuery("SELECT coin_balance FROM users WHERE user_id = ?", [userId]);
    if (user) {
      await runQuery("UPDATE users SET coin_balance = coin_balance + ? WHERE user_id = ?", [coinAmount, userId]);
    } else {
      await runQuery(
        "INSERT INTO users (user_id, first_name, last_name, username, language_code, is_bot, coin_balance) VALUES (?, '', '', '', '', 0, ?)",
        [userId, coinAmount]
      );
    }
  } catch (error) {
    console.error("Error adding coin:", error);
  }
}

async function removeCoin(userId, coinAmount) {
  try {
    if (!userId || isNaN(userId) || isNaN(coinAmount)) return;
    const user = await getQuery("SELECT coin_balance FROM users WHERE user_id = ?", [userId]);
    if (!user) return;
    await runQuery("UPDATE users SET coin_balance = coin_balance - ? WHERE user_id = ?", [coinAmount, userId]);
  } catch (error) {
    console.error("Error removing coin:", error);
  }
}

async function coinData() {
  try {
    return await allQuery("SELECT user_id, coin_balance FROM users", []);
  } catch (error) {
    console.error("Error retrieving coin data:", error);
  }
}

/*============================
  RANK FUNCTIONS
============================*/

async function rankData() {
  try {
    return await allQuery("SELECT user_id, level, message_count FROM users", []);
  } catch (error) {
    console.error("Error retrieving rank data:", error);
  }
}

async function updateUserRank(userId, newLevel, newMessageCount) {
  try {
    await runQuery("UPDATE users SET level = ?, message_count = ? WHERE user_id = ?", [newLevel, newMessageCount, userId]);
  } catch (error) {
    console.error("Error updating user rank:", error);
  }
}

async function incrementMessageCount(userId) {
  try {
    await runQuery("UPDATE users SET message_count = message_count + 1 WHERE user_id = ?", [userId]);
  } catch (error) {
    console.error(`Error incrementing message count for user ${userId}:`, error);
  }
}

/*============================
  USER FUNCTIONS
============================*/

async function upsertUser(userData) {
  try {
    const existing = await getQuery("SELECT user_id FROM users WHERE user_id = ?", [userData.user_id]);
    if (existing) {
      await runQuery(
        "UPDATE users SET first_name = ?, last_name = ?, username = ?, language_code = ?, is_bot = ? WHERE user_id = ?",
        [
          userData.first_name || '',
          userData.last_name || '',
          userData.username || '',
          userData.language_code || '',
          userData.is_bot ? 1 : 0,
          userData.user_id
        ]
      );
    } else {
      await runQuery(
        "INSERT INTO users (user_id, first_name, last_name, username, language_code, is_bot, coin_balance, level, message_count, banned) VALUES (?, ?, ?, ?, ?, ?, 0, 1, 0, 0)",
        [
          userData.user_id,
          userData.first_name || '',
          userData.last_name || '',
          userData.username || '',
          userData.language_code || '',
          userData.is_bot ? 1 : 0
        ]
      );
    }
  } catch (error) {
    console.error("Error upserting user data:", error);
  }
}

async function getUser(userId) {
  try {
    return await getQuery("SELECT * FROM users WHERE user_id = ?", [userId]);
  } catch (error) {
    console.error("Error retrieving user data:", error);
  }
}

async function getAllUsers() {
  try {
    return await allQuery("SELECT * FROM users", []);
  } catch (error) {
    console.error("Error retrieving all users:", error);
  }
}

async function getUserByUsername(username) {
  try {
    return await getQuery("SELECT * FROM users WHERE username = ?", [username]);
  } catch (error) {
    console.error("Error retrieving user by username:", error);
  }
}

/*============================
  GROUP FUNCTIONS
============================*/

async function upsertGroup(groupData) {
  try {
    const existing = await getQuery("SELECT group_id FROM groups WHERE group_id = ?", [groupData.group_id]);
    if (existing) {
      await runQuery(
        "UPDATE groups SET title = ?, description = ?, rules = ?, prefix = ?, banned = ?, onlyAdminBox = ?, hideNotiMessageOnlyAdminBox = ?, badwords_enabled = ?, badwords_words = ?, badwords_violations = ? WHERE group_id = ?",
        [
          groupData.title || '',
          groupData.description || '',
          groupData.rules || '',
          groupData.prefix || '',
          groupData.banned || 0,
          groupData.onlyAdminBox || 0,
          groupData.hideNotiMessageOnlyAdminBox || 0,
          groupData.badwords_enabled || 0,
          groupData.badwords_words || '[]',
          groupData.badwords_violations || '{}',
          groupData.group_id
        ]
      );
    } else {
      await runQuery(
        "INSERT INTO groups (group_id, title, description, rules, prefix, banned, onlyAdminBox, hideNotiMessageOnlyAdminBox, badwords_enabled, badwords_words, badwords_violations) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          groupData.group_id,
          groupData.title || '',
          groupData.description || '',
          groupData.rules || '',
          groupData.prefix || '',
          groupData.banned || 0,
          groupData.onlyAdminBox || 0,
          groupData.hideNotiMessageOnlyAdminBox || 0,
          groupData.badwords_enabled || 0,
          groupData.badwords_words || '[]',
          groupData.badwords_violations || '{}'
        ]
      );
    }
  } catch (error) {
    console.error("Error upserting group data:", error);
  }
}

async function getGroup(groupId) {
  try {
    return await getQuery("SELECT * FROM groups WHERE group_id = ?", [groupId]);
  } catch (error) {
    console.error("Error retrieving group data:", error);
  }
}

async function updateGroupRules(groupId, rules) {
  try {
    await runQuery("UPDATE groups SET rules = ? WHERE group_id = ?", [rules, groupId]);
  } catch (error) {
    console.error("Error updating group rules:", error);
  }
}

async function updateGroupPrefix(groupId, newPrefix) {
  try {
    await runQuery("UPDATE groups SET prefix = ? WHERE group_id = ?", [newPrefix, groupId]);
  } catch (error) {
    console.error("Error updating group prefix:", error);
  }
}

async function getAllGroups() {
  try {
    return await allQuery("SELECT * FROM groups", []);
  } catch (error) {
    console.error("Error retrieving all groups:", error);
  }
}

/*============================
  WARN FUNCTIONS
============================*/

async function addWarn(groupId, userId, reason, dateTime, warnBy) {
  try {
    await runQuery(
      "INSERT INTO warns (group_id, user_id, reason, dateTime, warnBy) VALUES (?, ?, ?, ?, ?)",
      [groupId, userId, reason, dateTime, warnBy]
    );
  } catch (error) {
    console.error("Error adding warn:", error);
  }
}

async function getWarnsForUser(groupId, userId) {
  try {
    return await allQuery(
      "SELECT * FROM warns WHERE group_id = ? AND user_id = ? ORDER BY dateTime ASC",
      [groupId, userId]
    );
  } catch (error) {
    console.error("Error getting warns for user:", error);
  }
}

async function getWarnsForGroup(groupId) {
  try {
    return await allQuery(
      "SELECT * FROM warns WHERE group_id = ? ORDER BY user_id, dateTime ASC",
      [groupId]
    );
  } catch (error) {
    console.error("Error getting warns for group:", error);
  }
}

async function removeWarnForUser(groupId, userId, warnIndex) {
  try {
    const warns = await getWarnsForUser(groupId, userId);
    if (!warns || warns.length === 0 || warnIndex < 0 || warnIndex >= warns.length) return false;
    const target = warns[warnIndex];
    await runQuery(
      "DELETE FROM warns WHERE group_id = ? AND user_id = ? AND dateTime = ?",
      [groupId, userId, target.dateTime]
    );
    return true;
  } catch (error) {
    console.error("Error removing warn for user:", error);
  }
}

async function removeAllWarnsForUser(groupId, userId) {
  try {
    await runQuery("DELETE FROM warns WHERE group_id = ? AND user_id = ?", [groupId, userId]);
  } catch (error) {
    console.error("Error removing all warns for user:", error);
  }
}

async function resetWarnsForGroup(groupId) {
  try {
    await runQuery("DELETE FROM warns WHERE group_id = ?", [groupId]);
  } catch (error) {
    console.error("Error resetting warns for group:", error);
  }
}

/*============================
  BUSY FUNCTIONS
============================*/

async function setBusy(userId, reason) {
  try {
    await runQuery(
      "INSERT OR REPLACE INTO busy (user_id, reason) VALUES (?, ?)",
      [userId, reason]
    );
  } catch (error) {
    console.error("Error setting busy status:", error);
  }
}

async function removeBusy(userId) {
  try {
    await runQuery("DELETE FROM busy WHERE user_id = ?", [userId]);
  } catch (error) {
    console.error("Error removing busy status:", error);
  }
}

async function getBusy(userId) {
  try {
    return await getQuery("SELECT reason FROM busy WHERE user_id = ?", [userId]);
  } catch (error) {
    console.error("Error retrieving busy status:", error);
  }
}

module.exports = {
  banUser,
  banGroup,
  removeBanUser,
  removeBanGroup,
  banUserData,
  banGroupData,
  addCoin,
  removeCoin,
  coinData,
  rankData,
  updateUserRank,
  incrementMessageCount,
  upsertUser,
  getUser,
  getAllUsers,
  getUserByUsername,
  upsertGroup,
  getGroup,
  updateGroupRules,
  updateGroupPrefix,
  getAllGroups,
  addWarn,
  getWarnsForUser,
  getWarnsForGroup,
  removeWarnForUser,
  removeAllWarnsForUser,
  resetWarnsForGroup,
  setBusy,
  removeBusy,
  getBusy,
  runQuery,
  getQuery,
  allQuery
};