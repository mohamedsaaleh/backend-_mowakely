const request = require('supertest');

let app = null;

try {
  app = require('../../src/app');
} catch (e) {
  console.error('Failed to load app:', e.message);
  throw e;
}

class TestApp {
  constructor() {
    this.app = app;
    this.agent = request.agent(this.app);
    this.requestCount = 0;
  }

  async get(path, options = {}) {
    this.requestCount++;
    return this.agent.get(path).set(options.headers || {}).send();
  }

  async post(path, data, options = {}) {
    this.requestCount++;
    return this.agent.post(path).set(options.headers || {}).send(data);
  }

  async put(path, data, options = {}) {
    this.requestCount++;
    return this.agent.put(path).set(options.headers || {}).send(data);
  }

  async patch(path, data, options = {}) {
    this.requestCount++;
    return this.agent.patch(path).set(options.headers || {}).send(data);
  }

  async delete(path, options = {}) {
    this.requestCount++;
    return this.agent.delete(path).set(options.headers || {}).send();
  }

  withAuth(token) {
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  resetCount() {
    this.requestCount = 0;
  }
}

function createTestApp() {
  return new TestApp();
}

module.exports = {
  TestApp,
  createTestApp,
  app
};