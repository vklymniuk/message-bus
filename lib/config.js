const fs = require('fs');
const logger = require('vklymniuk-logger');

if (false === fs.statSync('config/message-bus.js')) {
  logger.error(`[message-bus] please add the MessageBus configuration into 'config/message-bus.js' of your project`);
  process.exit(1);
}

module.exports = require('../../../config/message-bus');