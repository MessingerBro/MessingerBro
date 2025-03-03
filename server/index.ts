import express from 'express';
import http from 'http';
import livereload from 'livereload';
import connectLiveReload from 'connect-livereload';
import { Request, Response } from 'express';
import { initializeWebsocketServer } from './websocketserver';
import { WebSocket } from 'ws';

// Create the express server
const app = express();
const server = http.createServer(app);

// Removed unused variable `myVar`

// Create a livereload server
const env = process.env.NODE_ENV || 'development';
if (env !== 'production' && env !== 'test') {
  const liveReloadServer = livereload.createServer();
  liveReloadServer.server.once('connection', () => {
    setTimeout(() => {
      liveReloadServer.refresh('/');
    }, 100);
  });
  // Use livereload middleware
  app.use(connectLiveReload());
}

// Deliver static files from the client folder like CSS, JS, images
app.use(express.static('client'));

// Route for the homepage
app.get('/', (req: Request, res: Response) => {
  res.sendFile(__dirname + '/client/index.html');
});

// Initialize the websocket server
initializeWebsocketServer(server);

// Start the web server
const startServer = (serverPort: number) => {
  server.listen(serverPort, () => {
    console.log(`Express Server started on port ${serverPort} as '${env}' Environment`);
  });
  return server;
};

if (env !== 'test') {
  const serverPort = parseInt(process.env.PORT || '3000', 10);
  startServer(serverPort);
}

// Explicitly type `state` as `number` instead of `any`
const waitForSocketState = (socket: WebSocket, state: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (socket.readyState === state) {
        resolve();
      } else {
        waitForSocketState(socket, state).then(resolve);
      }
    }, 5);
  });
};

export { startServer, waitForSocketState };
