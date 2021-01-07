const fetchJSON = require('./fetchJSON');

module.exports = async function fetchDirectLineToken() {
  return (await fetchJSON('https://webchat-mockbot.azurewebsites.net/directline/token', { method: 'POST' })).token;
};
