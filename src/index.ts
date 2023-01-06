// @ts-ignore
import home from './home.html';
import { makeStatusResponse } from './utils';

export interface Env {
  DB: KVNamespace;

  CHAT: DurableObjectNamespace;
}

const statusCodes = {
  METHOD_NOT_ALLOWED: 405,
  BAD_REQUEST: 400,
  NOT_FOUND: 404
};

export class ChatRoom {
  state: DurableObjectState;
  users: WebSocket[];
  messages: string[];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.users = [];
    this.messages = [];
  }

  async fetch(request: Request) {
    const { url, method } = request;

    if (method !== 'GET')
      return makeStatusResponse(statusCodes.METHOD_NOT_ALLOWED);

    const { pathname } = new URL(url);

    const handleHome = () => {
      return new Response(home, {
        headers: {
          'Content-Type': 'text/html;charset=utf-8'
        }
      });
    };

    const handleNotFound = () => {
      return makeStatusResponse(statusCodes.NOT_FOUND);
    };

    const handleConnect = (request: Request) => {
      const pairs = new WebSocketPair();
      handleWebSocket(pairs[1]);

      return new Response(null, { status: 101, webSocket: pairs[0] });
    };

    const handleWebSocket = (webSocket: WebSocket) => {
      webSocket.accept();
      this.users.push(webSocket);
      webSocket.send(JSON.stringify({ message: 'hello world from backend!' }));
      this.messages.forEach(messages => webSocket.send(messages));

      webSocket.addEventListener('message', event => {
        this.messages.push(event.data.toString());
        this.users.forEach(user => user.send(event.data));
      });
    };

    switch (pathname) {
      case '/':
        return handleHome();

      case '/connect':
        return handleConnect(request);

      default:
        return handleNotFound();
    }
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const id = env.CHAT.idFromName('CHAT');
    const durableObject = env.CHAT.get(id);
    const response = await durableObject.fetch(request);

    return response;
  }
};
