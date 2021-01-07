const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = app => {
  app.use(
    createProxyMiddleware('/api', {
      changeOrigin: true,
      target: 'http://localhost:3001',
      ws: true
    })
  );
};
