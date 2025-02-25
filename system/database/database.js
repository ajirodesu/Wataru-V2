const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the path for the database file (for example, "wataru.db")
const dbFilePath = path.join(__dirname, 'wataru.db');

// Open (or create) the SQLite database.
const db = new sqlite3.Database(dbFilePath, (err) => {
  if (err) console.error("Error opening database:", err);
  else console.log("Connected to Wataru database.");
});

// Create 2 tables: one for users and one for groups.
db.serialize(() => {
  // Users table: now includes level and message_count for rankup.
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

  // Groups table.
  db.run(`
    CREATE TABLE IF NOT EXISTS groups (
      group_id INTEGER PRIMARY KEY,
      title TEXT,
      description TEXT,
      rules TEXT,
      prefix TEXT DEFAULT '',
      banned INTEGER DEFAULT 0,
      onlyAdminBox INTEGER DEFAULT 0,
      hideNotiMessageOnlyAdminBox INTEGER DEFAULT 0
    )
  `);
});

// Helper functions to run queries using Promises.
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

// Ban a user by setting banned = 1.
async function banUser(userId) {
  try {
    if (!userId || isNaN(userId)) return false;
    const user = await getQuery("SELECT * FROM users WHERE user_id = ?", [userId]);
    if (user && user.banned == 1) return false; // already banned
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

// Ban a group by setting banned = 1.
async function banGroup(groupId) {
  try {
    if (!groupId || isNaN(groupId)) return false;
    const group = await getQuery("SELECT * FROM groups WHERE group_id = ?", [groupId]);
    if (group && group.banned == 1) return false; // already banned
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

// Remove a banned user.
async function removeBanUser(userId) {
  try {
    if (!userId || isNaN(userId)) return;
    await runQuery("UPDATE users SET banned = 0 WHERE user_id = ?", [userId]);
  } catch (error) {
    console.error("Error removing banned user:", error);
  }
}

// Remove a banned group.
async function removeBanGroup(groupId) {
  try {
    if (!groupId || isNaN(groupId)) return;
    await runQuery("UPDATE groups SET banned = 0 WHERE group_id = ?", [groupId]);
  } catch (error) {
    console.error("Error removing banned group:", error);
  }
}

// Retrieve all banned user IDs.
async function banUserData() {
  try {
    const rows = await allQuery("SELECT user_id FROM users WHERE banned = 1", []);
    return rows.map(row => row.user_id);
  } catch (error) {
    console.error("Error retrieving banned user data:", error);
  }
}

// Retrieve all banned group IDs.
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
// Add coins to a user's balance.
async function addCoin(userId, coinAmount) {
  try {
    if (!userId || isNaN(userId) || isNaN(coinAmount)) return;
    const user = await getQuery("SELECT * FROM users WHERE user_id = ?", [userId]);
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

// Remove coins from a user's balance.
async function removeCoin(userId, coinAmount) {
  try {
    if (!userId || isNaN(userId) || isNaN(coinAmount)) return;
    const user = await getQuery("SELECT * FROM users WHERE user_id = ?", [userId]);
    if (!user) return;
    await runQuery("UPDATE users SET coin_balance = coin_balance - ? WHERE user_id = ?", [coinAmount, userId]);
  } catch (error) {
    console.error("Error removing coin:", error);
  }
}

// Retrieve coin data.
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
// Retrieve rank data (returns user_id, level, and message_count).
async function rankData() {
  try {
    return await allQuery("SELECT user_id, level, message_count FROM users", []);
  } catch (error) {
    console.error("Error retrieving rank data:", error);
  }
}

// Helper: update a user’s level and message count.
async function updateUserRank(userId, newLevel, newMessageCount) {
  try {
    await runQuery("UPDATE users SET level = ?, message_count = ? WHERE user_id = ?", [newLevel, newMessageCount, userId]);
  } catch (error) {
    console.error("Error updating user rank:", error);
  }
}

/*============================
  USER FUNCTIONS (COMPLETE DATA)
============================*/
// Upsert (insert or update) user data.
async function upsertUser(userData) {
  try {
    const existing = await getQuery("SELECT * FROM users WHERE user_id = ?", [userData.user_id]);
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

// Retrieve a single user's data.
async function getUser(userId) {
  try {
    return await getQuery("SELECT * FROM users WHERE user_id = ?", [userId]);
  } catch (error) {
    console.error("Error retrieving user data:", error);
  }
}

// Retrieve all users.
async function getAllUsers() {
  try {
    return await allQuery("SELECT * FROM users", []);
  } catch (error) {
    console.error("Error retrieving all users:", error);
  }
}

/*============================
  GROUP FUNCTIONS (COMPLETE DATA & RULES)
============================*/
// Upsert (insert or update) group data.
async function upsertGroup(groupData) {
  try {
    const existing = await getQuery("SELECT * FROM groups WHERE group_id = ?", [groupData.group_id]);
    if (existing) {
      await runQuery(
        "UPDATE groups SET title = ?, description = ?, rules = ?, prefix = ?, banned = ?, onlyAdminBox = ?, hideNotiMessageOnlyAdminBox = ? WHERE group_id = ?",
        [
          groupData.title || '',
          groupData.description || '',
          groupData.rules || '',
          groupData.prefix || '',
          groupData.banned || 0,
          groupData.onlyAdminBox || 0,
          groupData.hideNotiMessageOnlyAdminBox || 0,
          groupData.group_id
        ]
      );
    } else {
      await runQuery(
        "INSERT INTO groups (group_id, title, description, rules, prefix, banned, onlyAdminBox, hideNotiMessageOnlyAdminBox) VALUES (?, ?, ?, ?, ?, 0, ?, ?)",
        [
          groupData.group_id,
          groupData.title || '',
          groupData.description || '',
          groupData.rules || '',
          groupData.prefix || '',
          groupData.onlyAdminBox || 0,
          groupData.hideNotiMessageOnlyAdminBox || 0
        ]
      );
    }
  } catch (error) {
    console.error("Error upserting group data:", error);
  }
}

// Retrieve a single group's data.
async function getGroup(groupId) {
  try {
    return await getQuery("SELECT * FROM groups WHERE group_id = ?", [groupId]);
  } catch (error) {
    console.error("Error retrieving group data:", error);
  }
}

// Update a group's rules.
async function updateGroupRules(groupId, rules) {
  try {
    await runQuery("UPDATE groups SET rules = ? WHERE group_id = ?", [rules, groupId]);
  } catch (error) {
    console.error("Error updating group rules:", error);
  }
}

// Update a group's prefix.
async function updateGroupPrefix(groupId, newPrefix) {
  try {
    await runQuery("UPDATE groups SET prefix = ? WHERE group_id = ?", [newPrefix, groupId]);
  } catch (error) {
    console.error("Error updating group prefix:", error);
  }
}

// Retrieve all groups.
async function getAllGroups() {
  try {
    return await allQuery("SELECT * FROM groups", []);
  } catch (error) {
    console.error("Error retrieving all groups:", error);
  }
}

/*============================
  MODULE EXPORTS
============================*/
module.exports = {
  // Ban functions
  banUser,
  banGroup,
  removeBanUser,
  removeBanGroup,
  banUserData,
  banGroupData,
  // Coin functions
  addCoin,
  removeCoin,
  coinData,
  // Rank functions
  rankData,
  updateUserRank,
  // User functions
  upsertUser,
  getUser,
  getAllUsers,
  // Group functions
  upsertGroup,
  getGroup,
  updateGroupRules,
  updateGroupPrefix,
  getAllGroups
};
