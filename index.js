const wssConfig = Object.assign({
    host: '127.0.0.1',
    port: 8010
}, options);

const wsPingInterval = 30 * 1000;

const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer(wssConfig);
wss.on('connection', function(ws, request) {
  ws.isAlive = true;
  ws.on('pong', function heartbeat() { this.isAlive = true; });

  const ip = request.connection.remoteAddress;
  const headersOfInterest = Object.keys(request.headers).filter(h => {
    const name = h.toLowerCase();
    return ['x-forwarded-for', 'host'].some(x => x === name);
  });
  log(`New connection from ${ip}`, headersOfInterest.map(k => `${k} => ${request.headers[k]}`));
  //log(`connection (HTTP request headers = ${JSON.stringify(request.headers)})`);

  const send = (message) => {
    const isLongMessage = typeof message === 'string' && message.length > 256;
    log(`Sending:`, isLongMessage ? message.slice(0,256) + '...' : message);
    ws.send(message);
  };

  ws.on('open', function() {
    log('wsOpen');
  });
  ws.on('close', function() {
    log('wsClose');
  });
  ws.on('message', async function(message) {
    log(`Received: ${message} (${typeof message})`);
    const handlers = {
      // TODO: write handlers (button, LED, LCD, ...)
    };
    try {
      const { command, ...params } = typeof message === 'string' ? JSON.parse(message) : message;
      if (typeof handlers[command] === 'function') {
        const result = await handlers[command](params);
        send(result);
      } else {
        warn(`Unrecognized command/message:`, command, params);
      }
    } catch(e) {
      warn(`Caught exception while trying to process`, message, e);
    }
  });
});

// Periodically issue "ping" frames to all clients to see which are still alive and keep them from being closed due to inactivity
const pingIntervalTimer = setInterval(function ping() {
//log(`time to periodically send a ping`);
wss.clients.forEach(function each(ws, i) {
  if (ws.isAlive === false) {
    log(`terminating dead client (${i})`);
    return ws.terminate();
  }

  ws.isAlive = false;
  //log('sending ping');
  ws.ping(() => {});
});
}, wsPingInterval);
