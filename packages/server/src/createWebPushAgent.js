const EventTarget = require('event-target-shim');
const WebPush = require('web-push');

const createEvent = require('./utils/createEvent');
const DirectLineClient = require('./createDirectLineClient');

const { defineEventAttribute } = EventTarget;

const { WEB_PUSH_VAPID_PRIVATE_KEY, WEB_PUSH_VAPID_PUBLIC_KEY } = process.env;

WebPush.setVapidDetails('https://botframework.com/', WEB_PUSH_VAPID_PUBLIC_KEY, WEB_PUSH_VAPID_PRIVATE_KEY);

class WebPushAgent extends EventTarget {
  constructor(subscription) {
    super();

    this.directLineClient = new DirectLineClient();
    this.subscription = subscription;

    this.handleClose = this.handleClose.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleOpen = this.handleOpen.bind(this);

    this.sendWebPush({ connectionStatus$: 1 });

    this.directLineClient.addEventListener('close', this.handleClose);
    this.directLineClient.addEventListener('message', this.handleMessage);
    this.directLineClient.addEventListener('open', this.handleOpen);
  }

  close() {
    this.directLineClient.close();

    this.directLineClient.removeEventListener('close', this.handleClose);
    this.directLineClient.removeEventListener('message', this.handleMessage);
    this.directLineClient.removeEventListener('open', this.handleOpen);
  }

  handleClose() {
    this.sendWebPush({ connectionStatus$: 4 });
  }

  handleMessage({ data }) {
    this.sendWebPush({ activity$: data });
  }

  handleOpen({ data }) {
    this.dispatchEvent(createEvent('open', { data }));
    this.sendWebPush({ connectionStatus$: 2 });
  }

  sendWebPush(obj) {
    WebPush.sendNotification(this.subscription, JSON.stringify(obj, null, 2));
  }
}

defineEventAttribute(WebPushAgent.prototype, 'open');

module.exports = function createWebPushAgent(subscription) {
  return new WebPushAgent(subscription);
};
