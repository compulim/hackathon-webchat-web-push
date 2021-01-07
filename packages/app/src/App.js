import { useCallback, useState } from 'react';
import WebChat from 'botframework-webchat';

// import logo from './logo.svg';
// import './App.css';

import fetchJSON from './utils/fetchJSON';
import ServiceWorkerDirectLine from './systems/ServiceWorkerDirectLine';
import SubscribeCheckbox from './ui/SubscribeCheckbox';
import useAsyncMemo from './hooks/useAsyncMemo';

const App = () => {
  const applicationServerKey = useAsyncMemo(async () => {
    const { applicationServerKey } = await fetchJSON('/api/webpush/key');

    return applicationServerKey;
  }, []);

  const serviceWorkerRegistration = useAsyncMemo(
    () => window.navigator.serviceWorker.register('service-worker.js'),
    []
  );

  const [directLine, setDirectLine] = useState();

  const handleSubscribe = useCallback(
    async ({ detail: subscription }) => {
      const res = await fetch('/api/webpush/subscribe', {
        body: JSON.stringify({ subscription: subscription.toJSON() }),
        headers: {
          'content-type': 'application/json'
        },
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Failed to subscribe to Web Push');
      }

      const { conversationID, token } = await res.json();

      setDirectLine(new ServiceWorkerDirectLine({ conversationID, registration: serviceWorkerRegistration, token }));
    },
    [serviceWorkerRegistration, setDirectLine]
  );

  console.log(directLine);

  return (
    <div>
      <SubscribeCheckbox
        applicationServerKey={applicationServerKey}
        onSubscribe={handleSubscribe}
        serviceWorkerRegistration={serviceWorkerRegistration}
      />
      {directLine && <WebChat className="webchat" directLine={directLine} />}
    </div>
  );
};

export default App;
