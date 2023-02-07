## ManageTeam Message Bus Integration

## install

```
npm i vklymniuk-message-bus --save
```


## how to use

Add config into your project root: config/message-bus.js
```
module.exports = {
  uri: process.env.MESSAGE_BUS__URL,
  retries: 3,
  options: {
    json: true
  },
  exchange: 'messages-exchange',
  prefix: 'analytics.csgo.demo-file-parser.',    //project queue prefix
  consumers: './src/consumers',                  //path to consumers
  channels: {
    'replays': {
      queues_options: {
        durable: true,
        auto_delete: false,
        type: 'direct'
      },
      exchange: {
        name: 'messages-exchange',
        type: 'direct',
        routing_keys: [
          'analytics.csgo.core-service.replay.created'
        ]
      }
    }
  }
}
```

if you want to handle several messages you can set

```
  consumers: './src/consumers',
  channels: {
    'replays': {
      messages: 10,  //max messages
      pause: 1000,   //delay before exit
      queues_options: {
        durable: true,
        auto_delete: false,
        type: 'direct'
      },
    }
  }
```


Configure Message Bus

```
  vklymniuk-console message-bus:setup
```

Consume for the new messages

```
  vklymniuk-console message-bus:consume <name>
```