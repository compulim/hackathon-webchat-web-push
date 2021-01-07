const AbortController = require('abort-controller');
const EventTarget = require('event-target-shim');
const WebSocket = require('ws');

const createEvent = require('./utils/createEvent');
const eventsToAsyncIterable = require('./utils/eventsToAsyncIterable');
const fetchDirectLineToken = require('./utils/fetchDirectLineToken');
const fetchJSON = require('./utils/fetchJSON');
const sleep = require('./utils/sleep');

const { defineEventAttribute } = EventTarget;
const ABORT_CONTROLLER = Symbol('abortController');
const INIT = Symbol('init');

class DirectLineClient extends EventTarget {
  constructor() {
    super();

    const abortController = new AbortController();

    this[ABORT_CONTROLLER] = abortController;
    this.signal = abortController.signal;

    this[INIT]();
  }

  close() {
    this[ABORT_CONTROLLER].abort();
  }

  async [INIT]() {
    console.log('DirectLineClient: init');

    let token;

    try {
      token = await fetchDirectLineToken();
    } catch (err) {
      console.log(err);

      return this.dispatchEvent(createEvent('error', { error: new Error(`Failed to fetch token`) }));
    }

    console.log('DirectLineClient: got token');

    const { conversationId: conversationID, streamUrl: streamURL } = await fetchJSON(
      'https://directline.botframework.com/v3/directline/conversations',
      {
        headers: {
          authorization: `Bearer ${token}`
        },
        method: 'POST'
      }
    );

    this.conversationID = conversationID;

    console.log('DirectLineClient: conversation created', conversationID);

    for (; !this.signal.aborted; ) {
      console.log(`Connecting to ${streamURL}`);

      const socket = new WebSocket(streamURL);
      const events = eventsToAsyncIterable(socket, 'close', 'error', 'message', 'open');

      this.signal.addEventListener('abort', () => events.cancel());

      for await (let event of events) {
        const { type } = event;

        if (type === 'close') {
          break;
        } else if (type === 'error') {
          this.dispatchEvent(createEvent('error', { error: event.error }));
        } else if (type === 'message') {
          this.dispatchEvent(createEvent('message', { data: JSON.parse(event.data).activities }));
        } else if (type === 'open') {
          this.dispatchEvent(
            createEvent('open', {
              data: {
                conversationID,
                token
              }
            })
          );
        }
      }

      socket.close();

      await sleep(1000);
    }
  }

  async post(activity) {
    const { id } = await fetchJSON(
      `https://directline.botframework.com/v3/directline/conversations/${encodeURI(this.conversationID)}/activities`,
      {
        body: JSON.stringify(activity),
        headers: {
          'content-type': 'application/json'
        },
        method: 'POST'
      }
    );

    return id;
  }
}

defineEventAttribute(DirectLineClient.prototype, 'close');
defineEventAttribute(DirectLineClient.prototype, 'error');
defineEventAttribute(DirectLineClient.prototype, 'message');
defineEventAttribute(DirectLineClient.prototype, 'open');

module.exports = DirectLineClient;
