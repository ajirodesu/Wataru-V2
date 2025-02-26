/**
 * Cron handler that schedules and executes cron modules based on their meta.format property.
 * It retrieves all groups from the provided database and sends the cron job output to each group.
 *
 * Expected cron format: "every X [second(s)|minute(s)|hour(s)|day(s)]"
 */
exports.cron = async function({ bot, wataru, msg, db }) {
  // Ensure that there is at least one cron module loaded in global.client.crons
  if (!global.client.crons || global.client.crons.size === 0) {
    console.error("No cron modules found to schedule.");
    return;
  }

  // Iterate through each cron module
  for (const [name, cronModule] of global.client.crons) {
    const format = cronModule.meta.format;
    const parts = format.split(' ');

    // Validate that the format starts with "every"
    if (parts[0] !== 'every') {
      console.error(`Unsupported cron format in module "${name}": ${format}`);
      continue;
    }

    const intervalValue = parseInt(parts[1]);
    if (isNaN(intervalValue)) {
      console.error(`Invalid interval value in cron format of module "${name}": ${format}`);
      continue;
    }

    // Determine the time unit and calculate the interval in milliseconds
    const unit = parts[2].toLowerCase();
    let intervalMs;
    if (unit.startsWith('second')) {
      intervalMs = intervalValue * 1000;
    } else if (unit.startsWith('minute')) {
      intervalMs = intervalValue * 60 * 1000;
    } else if (unit.startsWith('hour')) {
      intervalMs = intervalValue * 60 * 60 * 1000;
    } else if (unit.startsWith('day')) {
      intervalMs = intervalValue * 24 * 60 * 60 * 1000;
    } else {
      console.error(`Unsupported time unit in cron format of module "${name}": ${format}`);
      continue;
    }

    console.log(`Scheduling cron job "${name}" to run every ${intervalMs} ms`);

    // Schedule the cron job using setInterval
    setInterval(async () => {
      try {
        // Retrieve all group IDs from the database
        const groups = await db.getAllGroups();
        // Send the cron job to all groups concurrently using each group's group_id
        await Promise.all(groups.map(async (group) => {
          try {
            await cronModule.onStart({ bot, wataru, msg, chatId: group.group_id });
          } catch (err) {
            console.error(`Failed to execute cron job "${name}" for group ${group.group_id}: ${err.message}`);
          }
        }));
      } catch (error) {
        console.error(`Error executing cron job "${name}": ${error.message}`);
      }
    }, intervalMs);
  }
};
