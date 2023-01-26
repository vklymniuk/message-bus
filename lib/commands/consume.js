const connection = require('../connection');
const config = require('../config');
const logger = require('vklymniuk-logger');
const context = require('../context');

/**
 * @type {{ name: string, description: string, args: { consumer: { describe: string }} }}
 */
module.exports.metadata = {
  name: 'message-bus:consume <consumer>',
  description: 'Consume messages from RabbitMQ',
  args: {
    consumer: {
      describe: 'Consumer name',
    }
  }
};

/**
 * @param { Object } args
 * 
 * @returns { Promise<*> }
 */
module.exports.run = function (args) {
  let consumer;
  let consumerName = args.consumer;

  let pwd = process.env.PWD || process.cwd();
  let file = pwd + config.consumers + '/' + consumerName + '.js'

  try {
    consumer = require(file);
  } catch (err) {
    logger.error(`[message-bus] "${consumerName} (${file})" doesn't exist`);
    process.exit(1);
  }

  let queueName = config.prefix + consumer.queue;
  let channelConfig = config.channels[consumer.queue];

  // Set up a channel listening for messages in the queue.
  let channelWrapper = connection.createChannel({
    json: true,
    setup: (channel) => {
      let count = 0;
      let max = channelConfig.messages || 99999999;
      let pause = channelConfig.pause || 1000;

      return Promise.all([
        channel.prefetch(1),
        channel.assertQueue(queueName, channelConfig.queues_options),
        channel.consume(queueName, async function (message) {
          let body = JSON.parse(message.content.toString());

          // set logger context
          logger.context.clear();
          context.clear();

          let traceId = message.properties.headers['x-trace-id'] || null;

          if(null !== traceId){
            logger.context.set('trace_id', traceId);
            context.set('trace_id', traceId)
          }

          //log
          logger.info(`[message-bus][consumer:${consumerName}] start consuming message`, body);

          try {
            let startedAt = new Date();
            await consumer.onMessage(body, channelWrapper);
            channel.ack(message);

            let endedAt = new Date();
            // log
            logger.info(`[message-bus][consumer:${consumerName}] successfully finished`, body, {
              exec_time: (endedAt.getTime() - startedAt.getTime())/1000,
              routing_key: message.fields.routingKey
            });
          } catch (err) {
            channel.nack(message);

            // log
            logger.error(`[message-bus][consumer:${consumerName}] failed with error: ${err.message}`, err, body);
          }

          count++;

          if (count >= max) {
              // log
              logger.info(`[message-bus][consumer:${consumerName}] exiting`, body);
              await new Promise((resolve) => setTimeout(resolve, pause));
              process.exit(0);
          }
          
        })
      ]);
    }
  });

  return channelWrapper.waitForConnect()
    .then(() => {
      logger.debug(`[message-bus][consumer:${consumerName}] listening for new messages`);
      return new Promise((resolve, reject) => {
        //prevent process.stop
      });
    });
}