const createDeferred = require('p-defer');

const ABORT = Symbol('abort');

module.exports = function eventsToAsyncIterable(eventTarget, ...names) {
  const backlog = [];
  let nextDeferred = createDeferred();

  const handleEvent = event => {
    backlog.push(event);

    const resolve = nextDeferred.resolve.bind(nextDeferred);

    nextDeferred = createDeferred();
    resolve();
  };

  return {
    [Symbol.asyncIterator]: async function* () {
      for (let name of names) {
        eventTarget.addEventListener(name, handleEvent);
      }

      for (let aborted; !aborted; ) {
        while (backlog.length) {
          const element = backlog.shift();

          if (element === ABORT) {
            aborted = true;
            break;
          }

          yield element;
        }

        await nextDeferred.promise;
      }
    },
    cancel() {
      backlog.unshift(ABORT);
      nextDeferred.resolve();

      for (let name of names) {
        eventTarget.removeEventListener(name, handleEvent);
      }
    }
  };
};
