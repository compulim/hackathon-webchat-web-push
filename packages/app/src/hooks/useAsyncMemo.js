import { useState } from 'react';

import useAsyncEffect from './useAsyncEffect';

export default function useAsyncMemo(fn, deps) {
  const [value, setValue] = useState();

  useAsyncEffect(async signal => {
    const nextValue = await fn();

    signal.aborted || setValue(nextValue);

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, deps);

  return value;
}
