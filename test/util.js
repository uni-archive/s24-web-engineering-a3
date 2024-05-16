import {
  test_,
  sendHttpRequest,
  expectStatus,
  expectBodyJSON,
  expectEquality,
  expectWSMessages, 
  closeSocket
} from './jest-tuwien';
import { rows, stringify, xrand, xuser } from './jest-tuwien/pretty';
import cookie from 'cookie';
import { calculatePrice } from '../server/utils/price';
import WebSocket from 'ws';
const fs = require('fs');


class WSQueue {
  data = [];
  polls = [];
  received = 0;

  enqueue(d) {
    this.received += 1;

    if(this.polls.length > 0) {
      let promiseResolve = this.polls.splice(0, 1)[0];
      promiseResolve(d)
    } else {
      this.data = [d, ...this.data]
    }
  }

  async poll(timeout = 1000) {
      return new Promise((resolve, reject) => {
        let received = this.received;
        if(this.data.length > 0) {
          let data = this.data.pop();
          resolve(data);
        } else {
          let d = setTimeout(() => {
            let now = this.received;
            this.polls.splice(now - received, 1);
            reject(new Error("Timeout: Expected Messages did not arrive within 1000ms"));
          }, timeout);

          this.polls = [(data) => {clearTimeout(d); resolve(data)}, ...this.polls]
        }
      });
  }
    
  }

export function testApp(testId, name, fn) {
  test_(testId, name, async (steps, chance) => {
    const artmartBaseUrl = 'https://' + chance.domain({ tld: 'test' });
    const blingApiKey = 'ak_' + chance.nanoid();
    const wsTimeout = chance.getWSTimeout();
    steps.push(
      'start app server',
      `<pre>` +
      `process.env.ARTMART_BASE_URL = '<x-rand>${artmartBaseUrl}</x-rand>';\n` +
      `process.env.BLING_API_KEY = '<x-rand>${blingApiKey}</x-rand>';\n` +
      `process.env.WS_TIMEOUT = '<x-rand>${wsTimeout}</x-rand>';\n` +
      `\n` +
      `const app = require('./app');\n` +
      `app.listen(0);` +
      '</pre>'
    )
    let app;
    jest.isolateModules(() => {
      process.env.ARTMART_BASE_URL = artmartBaseUrl;
      process.env.BLING_API_KEY = blingApiKey;
      process.env.WS_TIMEOUT = 5000;

      app = require('../server/app');
    });
    const server = app.listen(0)
    try {
      steps.port = server.address().port;
      await fn(steps, chance);
    } finally {
      server.close();
    }
  });
}

export function sendRequest(steps, opts) {
  return sendHttpRequest(steps, { port: steps.port, ...opts });
}

export async function createSession(steps, chance,  {host = 'localhost', port = 80} = {}) {
  steps.beginGroup("Starting new shared framing session");
  steps.push("Opening new websocket session");

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://${host}:${steps.port}/framing/shared/create`);

    let queue = new WSQueue();

    socket.onmessage = (event) => {
      queue.enqueue(event.data)
    }

    socket.onopen = () => {
      const artworkId = chance.artworkId();
      const initialState = {
        printSize: chance.printSize(),
        frameStyle: chance.frameStyle(),
        frameWidth: chance.frameWidth(),
        matWidth: chance.matWidth(),
        matColor: chance.matColor()
      }

      steps.endGroup();
      resolve({
        ws: socket,
        messages: queue,
        artworkId: artworkId,
        state: initialState
      });
    }

    socket.onerror = (e) => {
      throw new Error(`Websocket failed with error: ${e.target}`);
    };
  });
}

export async function joinSession(steps, chance, sessionId, {host = 'localhost', port = 80} = {}) {
  steps.beginGroup("Joining existing shared framing session");
  steps.push("Opening new websocket session");

  return new Promise((resolve, reject) => {
    let queue = new WSQueue();

    const socket = new WebSocket(`ws://${host}:${steps.port}/framing/shared/join/${sessionId}`);
    
    socket.onmessage = (event) => {
      queue.enqueue(event.data)
    }

    socket.onopen = () => {
      steps.endGroup();
      resolve({
        ws: socket,
        messages: queue,
        sessionId: sessionId
      });
    }

    socket.onerror = (e) => {
      throw new Error(`Websocket failed with error: ${e.target}`);
    };
  });
}

export function sendInit(session) {
  session.ws.send(JSON.stringify({
    op: "init",
    data: {
      artworkId: session.artworkId,
      state: session.state
    }
  }));
}

export function sendMessage(session, message) {
  session.ws.send(JSON.stringify(message));
}

export function expectSessionCookie(steps, res) {
  steps.push('expect response to contain session cookie');
  const cookies = Array.from(res.headers['set-cookie']);
  let sid = null;
  for (let c of cookies) {
    sid = cookie.parse(c)['sessionId'];
    if (sid != null) break;
  }
  if (sid == null) {
    throw Error(
      'Expected to find sessionId cookie.\n\n' +
      'Received Set-Cookie headers:\n' + rows(cookies.map(x => 'Set-Cookie: ' + x), 2)
    )
  }
  return sid;
}

export async function createNewCart(steps) {
  steps.beginGroup('create new cart');
  const res = await sendRequest(steps, { path: '/cart' });
  expectStatus(steps, res, 200);
  const sid = expectSessionCookie(steps, res);
  const cart = expectBodyJSON(steps, res);
  steps.push('expect JSON payload to be an empty cart');
  expectEquality(cart, []);  
  steps.endGroup()
  return sid;
}

export async function getCart(steps, sid) {
  steps.beginGroup('get cart');
  const res = await sendRequest(steps, {
    path: '/cart',
    cookie: 'sessionId=' + sid,
    cookieStr: 'sessionId=' + xuser(sid)
  });
  expectStatus(steps, res, 200);
  const cart = expectBodyJSON(steps, res);
  steps.endGroup();
  return cart;
}

export async function addCartItem(steps, sid, item, { rand = false } = {}) {
  steps.beginGroup('add item to cart');
  const res = await sendRequest(steps, {
    method: 'POST',
    path: '/cart',
    cookie: 'sessionId=' + sid,
    cookieStr: 'sessionId=' + xuser(sid),
    jsonBody: item,
    jsonBodyStr: stringify(item, { mark: (x) => rand ? xrand(x) : x })
  });
  expectStatus(steps, res, 201);
  steps.endGroup();
}

export async function addRandomCartItem(steps, chance, sid) {
  const item = chance.cartItemWithoutId();
  await addCartItem(steps, sid, item, { rand: true });
  return item;
}

export async function createRandomCart(steps, chance) {
  const sid = await createNewCart(steps);
  const n = chance.integer({ min: 1, max: 5 });
  let cart = [];
  let subtotal = 0;
  for (let i = 0; i < n; i++) {
    const item = await addRandomCartItem(steps, chance, sid);
    cart.push(item);
    subtotal += calculatePrice(item.printSize, item.frameStyle, item.frameWidth, item.matWidth);
  }
  return { sid, cart, subtotal }
}
