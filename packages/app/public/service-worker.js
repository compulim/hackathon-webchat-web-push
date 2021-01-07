console.log('Hello, World!', self);

let directLinePort;

self.addEventListener('message', event => {
  console.log('got directline port', event.ports);

  if (event.data === 'directline') {
    directLinePort = event.ports[0]
  }
});

self.addEventListener('push', event => {
  const json = event.data.json();

  console.log(json);

  directLinePort.postMessage(json);
});
