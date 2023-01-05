import { home } from './pages/home';
import { makeBadge, makeStatusResponse } from './utils';

export interface Env {
  DB: KVNamespace;

  COUNTER: DurableObjectNamespace;
}

const statusCodes = {
  METHOD_NOT_ALLOWED: 405,
  BAD_REQUEST: 400,
  NOT_FOUND: 404
};

export class CounterObject {
  counter: number;

  constructor() {
    this.counter = 0;
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

    switch (pathname) {
      case '/':
        return new Response(this.counter);

      case '/+':
        this.counter++;
        return new Response(this.counter);

      case '/-':
        this.counter--;
        return new Response(this.counter);

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
    const id = env.COUNTER.idFromName('counter');
    const durableObject = env.COUNTER.get(id);
    const response = await durableObject.fetch(request);

    return response;
  }
};
