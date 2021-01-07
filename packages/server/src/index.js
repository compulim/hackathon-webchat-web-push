require('dotenv/config');

const app = require('express')();
const bodyParser = require('body-parser');
const http = require('http');

const createWebPushAgent = require('./createWebPushAgent');

const { PORT = 3001, WEB_PUSH_VAPID_PUBLIC_KEY } = process.env;

app.use(bodyParser.json());

app.get('/api/health.txt', (_, res) => res.send('ok'));
app.get('/api/webpush/key', (_, res) => res.json({ applicationServerKey: WEB_PUSH_VAPID_PUBLIC_KEY }));

let agent;

app.post('/api/webpush/subscribe', (req, res) => {
  agent && agent.close();

  agent = createWebPushAgent(req.body.subscription);

  agent.addEventListener(
    'open',
    ({ data: { conversationID, token } }) => {
      res.send({ conversationID, token });
    },
    { once: true }
  );
});

http.createServer(app).listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
