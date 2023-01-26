const config = require('./config');
const amqp = require('amqp-connection-manager');
const logger = require('vklymniuk-logger');
let connection = amqp.connect([config.uri], config.options);

connection.on('connect', () => {
  logger.debug('[message-bus] connected to rabbitmq');
});

connection.on('disconnect', params => {
  logger.debug('[message-bus] disconnected from rabbitmq.', params.err);
});

process.on('SIGINT', function () {
  connection.close(function () {
    logger.info('[message-bus] connection closed through app termination');
    process.exit(0);
  });
});

module.exports = connection;