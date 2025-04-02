'use strict';

class Session {
  constructor(token, data) {
    this.token = token;
    this.state = { ...data };
  }
}

module.exports = { Session };
