import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import requestPermission from '../utils/notificationRequestPermission';

const SubscribeCheckbox = ({ applicationServerKey, onSubscribe, onUnsubscribe, serviceWorkerRegistration }) => {
  const abortController = useMemo(() => new AbortController(), []);

  useEffect(() => () => abortController.abort(), [abortController]);

  const [busy, setBusy] = useState();
  const [subscription, setSubscription] = useState();

  const handleSubscriptionUpdate = useCallback(() => {
    serviceWorkerRegistration &&
      (async function () {
        const subscription = await serviceWorkerRegistration.pushManager.getSubscription();

        abortController.signal.aborted || setSubscription(subscription);
      })();
  }, [abortController, serviceWorkerRegistration, setSubscription]);

  useEffect(handleSubscriptionUpdate, [handleSubscriptionUpdate]);

  const handleSubscribeClick = useCallback(
    async ({ target: { checked } }) => {
      setBusy(true);

      try {
        if (checked) {
          await requestPermission();

          const subscription = await serviceWorkerRegistration.pushManager.subscribe({
            applicationServerKey,
            userVisibleOnly: true
          });

          onSubscribe && onSubscribe(new CustomEvent('subscribe', { detail: subscription }));

          await handleSubscriptionUpdate();
        } else {
          await subscription.unsubscribe();

          onUnsubscribe && onUnsubscribe();

          await handleSubscriptionUpdate();
        }
      } finally {
        setBusy(false);
      }
    },
    [
      applicationServerKey,
      handleSubscriptionUpdate,
      onSubscribe,
      onUnsubscribe,
      serviceWorkerRegistration,
      subscription
    ]
  );

  const ready = applicationServerKey && serviceWorkerRegistration && !busy;

  return (
    <label>
      <input checked={!!subscription || false} disabled={!ready} onChange={handleSubscribeClick} type="checkbox" />
      Subscribe
    </label>
  );
};

SubscribeCheckbox.defaultProps = {
  applicationServerKey: undefined,
  onSubscribe: undefined,
  onUnsubscribe: undefined,
  serviceWorkerRegistration: undefined
};

SubscribeCheckbox.propTypes = {
  applicationServerKey: PropTypes.string,
  onSubscribe: PropTypes.func,
  onUnsubscribe: PropTypes.func,
  serviceWorkerRegistration: PropTypes.instanceOf(ServiceWorkerRegistration)
};

export default SubscribeCheckbox;
