const fetch = require('node-fetch');

module.exports = async function fetchJSON(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { accept: 'application/json', ...(options.headers || {}) } });

  if (!res.ok) {
    throw new Error(`Server returned ${res.status}`);
  }

  return await res.json();
};
