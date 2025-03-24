const fs = require('fs');
const path = require('path');

const cacheDir = path.join(process.cwd(), 'apps/temp');

// Store timeout ID for debouncing
let clearTimeoutId = null;

/**
 * Creates the cache directory if it doesn’t exist.
 * Throws an error if creation fails critically.
 */
const create = async () => {
  try {
    await fs.promises.mkdir(cacheDir, { recursive: true });
  } catch (err) {
    console.error(`Error creating cache directory: ${err.message}`);
    // Check if directory exists despite the error (e.g., it already existed)
    try {
      await fs.promises.access(cacheDir);
    } catch {
      throw new Error(`Failed to ensure cache directory exists: ${err.message}`);
    }
  }
};

/**
 * Clears all files in the cache directory.
 * Recreates the directory if it’s missing.
 */
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
          console.error(`Error deleting file ${filePath}: ${err.message}`);
          return null;
        }
      });

      const deletedFiles = (await Promise.all(deletePromises)).filter(Boolean);
      if (deletedFiles.length) {
        console.log(`${deletedFiles.length} cache files cleared`);
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('Cache directory missing. Recreating it.');
      await create();
    } else {
      console.error(`Error clearing cache: ${err.message}`);
    }
  }
};

/**
 * Watches the cache directory for changes and clears it after a 5-second debounce.
 * Retries on watcher errors.
 */
const watch = async () => {
  try {
    await create(); // Ensure directory exists
    const watcher = fs.watch(cacheDir, (eventType, filename) => {
      if (eventType === 'rename' && filename) {
        // Debounce: clear existing timeout and set a new one
        if (clearTimeoutId) {
          clearTimeout(clearTimeoutId);
        }
        clearTimeoutId = setTimeout(async () => {
          try {
            const files = await fs.promises.readdir(cacheDir);
            if (files.length) {
              console.log(`${files.length} cache files detected. Clearing now.`);
              await clear();
            }
          } catch (err) {
            console.error(`Error reading cache directory: ${err.message}`);
          }
        }, 5000);
      }
    });

    watcher.on('error', (err) => {
      console.error(`Watcher error: ${err.message}. Restarting watcher.`);
      watcher.close();
      setTimeout(watch, 5000); // Restart after delay
    });
  } catch (err) {
    console.error(`Error setting up watcher: ${err.message}`);
    setTimeout(watch, 5000); // Retry after delay
  }
};

// Initialize cache and start watching
(async () => {
  try {
    await create();
    await watch();
  } catch (err) {
    console.error(`Initialization failed: ${err.message}`);
    process.exit(1); // Exit on critical failure
  }
})();

// Export functions for external use
module.exports = {
  create,
  clear,
  watch,
}; 