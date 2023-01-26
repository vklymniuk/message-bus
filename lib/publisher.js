const connection = require('./connection');
const context = require('./context');
const config = require('./config');
const logger = require('vklymniuk-logger');

/**
 * @typedef { Object } Publisher
 */
module.exports = {
  /**
   * @param { String } queue
   * @param { Object } message
   * @returns { Promise<*> }
   */
  publish: function (queue, message) {
    let channel = connection.createChannel({
        json: true,
    });

    //log
    logger.info(`[message-bus][publisher] publish a new message to the queue ${config.prefix + queue}`, {
        queue: queue,
        message: message,
    });

    let traceId = context.get('trace_id');
    let options = {}

    if (typeof traceId !== 'undefined' && null !== traceId) {
      options = {
        'headers': {
          'x-trace-id': traceId,
        }
      }
    }

    return channel.sendToQueue(config.prefix + queue, message, options);
  },

  /**
   * @param { String } routingKey
   * @param { Object } message
   * @param { Object } options
   * 
   * @returns { Promise<*> }
   */
  publishToExchange: function (routingKey, message, options = {}) {
    routingKey = config.prefix + routingKey;
    let exchange = config.exchange;
    let channel = connection.createChannel({
      json: true,
    });

    logger.info(`message-bus publisher: publish a new message to the exchange with routing key ${routingKey}`, {
      exchange: exchange,
      routingKey: routingKey,
      message: message,
    });

    let traceId = context.get('trace_id');

    if (typeof traceId !== 'undefined' && null !== traceId) {
      options.headers = options.headers || {};
      options.headers['x-trace-id'] = traceId;
    }

    return channel.publish(exchange, routingKey, message, options);
  }
};