'use strict';

const { node } = require('./dependencies.js');

class Context {
  constructor(client) {
    this.client = client;
    this.uuid = node.crypto.randomUUID();
    this.state = {};
    this.session = client?.session || null;
  }
}

module.exports = { Context };
