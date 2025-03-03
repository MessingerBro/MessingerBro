import { Server } from 'http';
import { RawData, WebSocket } from 'ws';
import { startServer, waitForSocketState } from './index';
import { Message, User } from './interfaces';

const port = 3000;

describe('WebSocket Server', () => {
  let server: Server;
  let user: User;

  // Removed unused `client` variable

  beforeAll(async () => {
    user = {
      id: '1',
      name: 'Test User',
    };
    server = await startServer(port);
  });

  afterAll(() => server.close());

  test('Send "New User" from Client', async () => {
    const testMessage: Message = {
      type: 'newUser',
      user: user,
    };

    // Create test client
    const client = new WebSocket(`ws://localhost:${port}`);
    await waitForSocketState(client, client.OPEN);

    let responseMessage: Message | undefined;
    client.on('message', (data: RawData) => {
      responseMessage = JSON.parse(data.toString());
      client.close(); // Close the client after receiving the response
    });

    // Send client message
    client.send(JSON.stringify(testMessage));

    // Perform assertions on the response
    await waitForSocketState(client, client.CLOSED);

    const expectedMessage: Message = {
      type: 'activeUsers',
      users: [user],
    };
    expect(responseMessage).toEqual(expectedMessage);
  });

  test('Send "Message" from Client', async () => {
    const testMessage: Message = {
      type: 'message',
      user: user,
      message: 'Test Message',
    };

    const client = new WebSocket(`ws://localhost:${port}`);
    await waitForSocketState(client, client.OPEN);

    let responseMessage: Message | undefined;
    client.on('message', (data: RawData) => {
      responseMessage = JSON.parse(data.toString());
      client.close();
    });

    client.send(JSON.stringify(testMessage));

    await waitForSocketState(client, client.CLOSED);
    expect(responseMessage).toEqual(testMessage);
  });

  test('Send "typing" from Client and wait until not typing timeout', async () => {
    const testMessage: Message = {
      type: 'typing',
      user: user,
    };

    const client = new WebSocket(`ws://localhost:${port}`);
    await waitForSocketState(client, client.OPEN);

    const responseMessages: Message[] = [];
    let messageCounter = 0;

    client.on('message', (data: RawData) => {
      responseMessages.push(JSON.parse(data.toString()));
      messageCounter++;
      if (messageCounter >= 2) {
        client.close();
      }
    });

    client.send(JSON.stringify(testMessage));

    await waitForSocketState(client, client.CLOSED);

    const expectedMessage: Message = {
      type: 'typing',
      users: [user],
    };

    expect(responseMessages[0]).toEqual(expectedMessage);
    expect(responseMessages[1]).toEqual({ type: 'typing', users: [] });
  });
});
