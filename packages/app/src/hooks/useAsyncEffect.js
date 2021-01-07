import { useEffect } from 'react';
import AbortController from 'abort-controller';

export default function useAsyncEffect(fn, deps) {
  useEffect(() => {
    const controller = new AbortController();

    (async function () {
      await fn(controller.signal);
    })();

    return () => controller.abort();

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, deps);
}
