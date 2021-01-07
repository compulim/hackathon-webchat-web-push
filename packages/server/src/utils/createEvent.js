module.exports = function createEvent(type, eventInitDict) {
  return { type, ...eventInitDict };
};
