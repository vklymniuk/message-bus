const connection = require('../connection');
const config = require('../config');
const logger = require('vklymniuk-logger');

/**
 * @type {{ name: string, description: string }}
 */
module.exports.metadata = {
  name: 'message-bus:setup',
  description: 'Setup RabbitMQ queues'
};

/**
 * @param { Object } args
 * 
 * @returns { Promise<*> }
 */
module.exports.run = function(args) {
  let channelWrapper = connection.createChannel({
    json: true,
    setup: function (channel) {
      let promises = [];
      Object.keys(config.channels).forEach((name) => {
        let queueName = config.prefix + name;
        let channelConfig = config.channels[name];

        promises.push(channel.assertQueue(queueName, channelConfig.queues_options));

        /**
         * In case queue has own exchange binding
         */
        if (typeof channelConfig.exchange !== 'undefined') {
          let exchangeName = channelConfig.exchange.name;
          let exchangeType = channelConfig.exchange.type;
          let routingKeys = channelConfig.exchange.routing_keys;
          promises.push(channel.assertExchange(exchangeName, exchangeType));

          logger.info(`[message-bus] exchange ${name} is created`);

          for (let key in routingKeys) {
            promises.push(channel.bindQueue(queueName, exchangeName, routingKeys[key]));

            logger.info(`[message-bus] channel ${name} binding to ${exchangeName} exchange with routing key ${routingKeys[key]} success`);
          }
        }

        logger.info(`[message-bus] channel ${name} is created`);
      });

      return Promise.all(promises)
        .then(() => {
          process.exit(0);
        });
    }
  });

  return channelWrapper.waitForConnect();
}