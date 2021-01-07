module.exports = function (durationInMS) {
  return new Promise(resolve => setTimeout(resolve, durationInMS));
};
