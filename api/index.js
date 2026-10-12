'use strict';
const { requestHandler } = require('../server/index.js');

module.exports = (req, res) => {
  return requestHandler(req, res);
};
