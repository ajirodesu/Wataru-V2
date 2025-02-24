const fs = require('fs-extra');
const path = require('path');
const { create, clear } = require('./cache.js');

/**
 * Initialize and clear the cache
 */
const cacheReady = (async () => {
  await create();
  await clear();
})();

/**
 * Validates a module has required properties
 * @param {Object} module - The module to validate
 * @throws {Error} If module is invalid
 */
function validateModule(module) {
  if (!module) {
    throw new Error('No export found in module');
  }
  if (!module.meta) {
    throw new Error('Missing meta property in module');
  }
  if (!module.onStart) {
    throw new Error('Missing onStart method in module');
  }
}

/**
 * Loads modules from a directory into a collection
 * @param {string} directory - Directory path to load from
 * @param {string} moduleType - Type of modules being loaded
 * @param {Map} collection - Collection to store loaded modules
 * @returns {Object} Object containing any errors encountered
 */
async function loadDirectory(directory, moduleType, collection) {
  const errors = {};

  try {
    const files = await fs.readdir(directory);
    const jsFiles = files.filter(file => file.endsWith('.js'));

    for (const file of jsFiles) {
      try {
        const modulePath = path.join(directory, file);
        const module = require(modulePath);
        const moduleExport = module.default || module;

        validateModule(moduleExport);
        collection.set(moduleExport.meta.name, moduleExport);
      } catch (error) {
        console.error(`Error loading ${moduleType} "${file}": ${error.message}`);
        errors[file] = error;
      }
    }
  } catch (error) {
    console.error(`Error reading ${moduleType} directory "${directory}": ${error.message}`);
    errors.directory = error;
  }

  return errors;
}

/**
 * Loads all commands and events from their respective directories
 * @returns {Object|false} Object containing errors if any occurred, false otherwise
 */
async function loadAll() {
  await cacheReady;

  const errors = {};
  const commandsPath = path.join(__dirname, '..', '..', 'app', 'cmd');
  const eventsPath = path.join(__dirname, '..', '..', 'app', 'evt');

  const [commandErrors, eventErrors] = await Promise.all([
    loadDirectory(commandsPath, 'command', global.client.commands),
    loadDirectory(eventsPath, 'event', global.client.events)
  ]);

  Object.assign(errors, commandErrors, eventErrors);

  return Object.keys(errors).length === 0 ? false : errors;
}

module.exports = loadAll;