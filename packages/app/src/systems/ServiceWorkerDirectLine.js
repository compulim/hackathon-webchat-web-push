import Observable from 'core-js/features/observable';

import createDeferredObservable from '../utils/createDeferredObservable';
import fetchJSON from '../utils/fetchJSON';

export default class ServiceWorkerDirectLine {
  constructor({ conversationID, registration, token }) {
    const { active: activeWorker } = registration;

    const { port1, port2 } = new MessageChannel();

    activeWorker.postMessage('directline', [port1]);

    port2.addEventListener('message', ({ data }) => {
      console.log(data);

      if (data.activity$) {
        for (let activity of data.activity$) {
          this.activityDeferred.next(activity);
        }
      } else if (data.connectionStatus$) {
        this.connectionStatusDeferred.next(data.connectionStatus$);
      }
    });

    port2.start();

    this.conversationID = conversationID;
    this.registration = registration;
    this.token = token;

    this.activityDeferred = createDeferredObservable();
    this.connectionStatusDeferred = createDeferredObservable();

    console.log({
      activityDeferred: this.activityDeferred,
      connectionStatusDeferred: this.connectionStatusDeferred
    });

    this.activity$ = this.activityDeferred.observable;
    this.connectionStatus$ = this.connectionStatusDeferred.observable;

    this.connectionStatusDeferred.next(0);
  }

  postActivity(activity) {
    return new Observable(observer => {
      (async () => {
        const { id } = await fetchJSON(
          `https://directline.botframework.com/v3/directline/conversations/${encodeURI(
            this.conversationID
          )}/activities`,
          {
            body: JSON.stringify(activity),
            headers: {
              authorization: `Bearer ${this.token}`,
              'content-type': 'application/json'
            },
            method: 'POST'
          }
        );

        observer.next(id);
        observer.complete();
      })();
    });
  }
}
