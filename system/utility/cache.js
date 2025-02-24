const fs = require('fs');
const path = require('path');

const cacheDir = path.join(process.cwd(), 'app/tmp');

const create = async () => {
  try {
    await fs.promises.mkdir(cacheDir, { recursive: true });
  } catch (err) {
    console.error(`Error creating cache directory: ${err.message}`);
  }
};

const clear = async () => {
  try {
    const files = await fs.promises.readdir(cacheDir);
    if (files.length) {
      const deletePromises = files.map(async (file) => {
        const filePath = path.join(cacheDir, file);
        try {
          await fs.promises.unlink(filePath);
          return file;
        } catch (err) {
          console.error(`Error deleting file: ${filePath} - ${err.message}`);
          return null;
        }
      });

      const deletedFiles = (await Promise.all(deletePromises)).filter(Boolean);
      if (deletedFiles.length) {
        console.log(`${deletedFiles.length} cache files have been cleared: ${deletedFiles.join(', ')}`);
      }
    }
  } catch (err) {
    console.error(`Error clearing cache: ${err.message}`);
  }
};

const watch = async () => {
  try {
    await create(); // Ensure cache directory exists before watching
    fs.watch(cacheDir, (eventType, filename) => {
      if (eventType === 'rename' && filename) {
        setTimeout(async () => {
          try {
            const files = await fs.promises.readdir(cacheDir);
            if (files.length) {
              console.log(`${files.length} cache files detected. Clearing cache now.`);
              await clear();
            }
          } catch (err) {
            console.error(`Error reading cache directory: ${err.message}`);
          }
        }, 5000); // 5-second delay before detecting
      }
    });
  } catch (err) {
    console.error(`Error watching cache directory: ${err.message}`);
  }
};

// Immediately initialize the cache and start watching
(async () => {
  await create();
  await watch();
})();

// Export the functions so they can be used elsewhere if needed.
module.exports = {
  create,
  clear,
  watch,
};
