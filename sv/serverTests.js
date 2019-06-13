import { expect } from 'chai';
import sinon from 'sinon';
import { Log } from 'meteor/logging';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { DrupalConfiguration } from './DrupalConfiguration';
import { DrupalServer } from './DrupalServer';

const SERVICE_NAME = 'mock-service';

class TestLogger {

  constructor() {
    this.reset();
  }

  log(level, ...args) {
    this.data[level].push(...args);
  }

  debug(...args) {
    this.log('debug', args);
  }
  info(...args) {
    this.log('info', args);
  }
  warn(...args) {
    this.log('warn', args);
  }
  error(...args) {
    this.log('error', args);
  }

  reset() {
    this.data = {
      debug: [],
      info: [],
      warn: [],
      error: [],
    };
  }

}

function mockMeteor() {
  const Fake = sinon.fake;
  const meteor = new Fake(Meteor.constructor);
  meteor.Collection = Fake();
  meteor.settings = {
    [SERVICE_NAME]: {},
    public: {
      [SERVICE_NAME]: {},
    },
  };
  return meteor;
}

/**
 * Setup helper for tests: create a mock settings document.
 *
 * @param {string} serviceName
 *   The name of the login service.
 *
 * @returns {{public: {}}}
 *   A basic settings object.
 */
function mockSettings(serviceName) {
  let mockConfiguration = { public: {} };
  mockConfiguration[serviceName] = {};
  mockConfiguration.public[serviceName] = {};
  return mockConfiguration;
}

function mockHttp(getContent) {
  let mock = {
    get: sinon.fake.returns({
      'content': JSON.stringify(getContent),
    }),
  };
  return mock;
}

function mockServer(getContent, fail = false) {
  const meteor = mockMeteor();

  const server = {
    http: mockHttp(getContent),
    logger: new TestLogger(),
    json: JSON,
    meteor,
    settings: {
      client: meteor.settings.public[SERVICE_NAME],
      server: meteor.settings[SERVICE_NAME],
    },
    state: {
      anonymousName: meteor.settings[SERVICE_NAME].anonymousName,
      cookieName: null,
      online: false
    },
  };
  server.whoamiMethod = DrupalServer.prototype.whoamiMethod.bind(server);

  if (fail) {
    server.http.get = sinon.fake.returns({
      'content': {},
    });
  }
  return server;
}

const testCorrectConfiguration = function () {
  const settings = mockSettings(SERVICE_NAME);
  settings.public[SERVICE_NAME] = { backgroundLogin: 60 };

  let f = new DrupalConfiguration(Meteor, ServiceConfiguration, Log, settings, SERVICE_NAME);

  expect(f.constructor.name).to.equal('DrupalConfiguration');
};

const testIncorrectConfiguration = function () {
  let configuration = { configurations: null };
  let settings = {};
  let instantiation;

  // Null settings.
  instantiation = function () {
    return new DrupalConfiguration(Meteor, configuration, Log, null, SERVICE_NAME);
  };
  expect(instantiation).to.throw(Meteor.Error, 'drupal-configuration');

  // Empty non-null settings.
  instantiation = function () {
    return new DrupalConfiguration(Meteor, configuration, Log, settings, SERVICE_NAME);
  };
  expect(instantiation).to.throw(Meteor.Error, 'drupal-configuration');

  // Non-boolean autoLogin.
  settings[SERVICE_NAME] = {};
  settings.public = {};
  settings.public[SERVICE_NAME] = { autoLogin: true };
  instantiation = function () {
    return new DrupalConfiguration(Meteor, configuration, Log, settings, SERVICE_NAME);
  };
  expect(instantiation).to.throw(Meteor.Error, 'drupal-configuration');

  // Missing ConfigError method on configuration service.
  settings[SERVICE_NAME] = {};
  settings.public = {};
  instantiation = function () {
    return new DrupalConfiguration(Meteor, configuration, Log, settings, SERVICE_NAME);
  };
  expect(instantiation).to.throw(Meteor.Error, 'drupal-configuration');

  // Missing configurations on configuration service.
  settings[SERVICE_NAME] = {};
  settings.public = {};
  settings.public[SERVICE_NAME] = { backgroundLogin: 60 };
  configuration = _.clone(ServiceConfiguration);
  configuration.configurations = null;
  expect(instantiation).to.throw(ServiceConfiguration.ConfigError, `Service ${SERVICE_NAME} not configured`);
};

const testWhoamiHappy = function (done) {
  const uid = 1;
  const server = mockServer({
    online: true,
    uid,
    name: 'admin',
    roles: [],
  });
  expect(server).not.to.be.a('null');
  const whoami = server.whoamiMethod('', '');
  expect(whoami).not.to.be.a('null');
  expect(whoami).to.have.nested.property('uid', uid);
  const debug = server.logger.data.debug;
  expect(debug).to.be.an('array');
  expect(debug.length).to.equal(2);
  // First message is about the cookie check. Second is about the result.
  const args = debug[1];
  expect(args).to.be.an('array');
  expect(args.length).to.equal(1);
  const message = args[0];
  expect(message).not.to.match(/:/);
  expect(message).to.match(/user/);
  done();
};

const testWhoamiSad = function (done) {
  const server = mockServer({ online: true }, true);
  expect(server).not.to.be.null;
  const whoami = server.whoamiMethod('', '');
  expect(whoami).not.to.be.null;
  expect(whoami).to.have.nested.property('uid', 0);
  done();
};

const testGetRootFieldsMapping = function () {
  // Each check is a pair of input / expected objects.
  const checks = [
    [
      // Normal situation.
      { profile: 'account', username: 'identity', emails: 'mel' },
      { profile: 'account', username: 'identity', emails: 'mel' },
    ],
    [
      // One field is null.
      { profile: 'account', username: null, emails: 'mel' },
      { profile: 'account', emails: 'mel' },
    ],
    [
      // One field is invalid.
      { profile: 'account', username: '', emails: 'mel' },
      { profile: 'account', emails: 'mel' },
    ],
    [
      // No fields.
      { },
      { },
    ],
    [
      // One extra field
      { profile: 'account', username: 'identity', emails: 'mel', foo: 'bar' },
      { profile: 'account', username: 'identity', emails: 'mel' },
    ],
  ];

  for (const check of checks) {
    const source = check[0];
    const expected = check[1];
    const t = {
      configuration: {
        rootFields: source,
      },
    };
    const g = DrupalServer.prototype.getRootFieldsMapping.bind(t);
    const actual = g();
    expect(actual).to.deep.equal(expected);
  }
};

const testHookUserCreate = function () {
  const t = {
    configuration: { rootFields: { profile: 'profile', username: 'username', emails: 'email' } },
    logger: new TestLogger(),
  };
  t.getRootFieldsMapping = DrupalServer.prototype.getRootFieldsMapping.bind(t);
  t.hookUserCreate = DrupalServer.prototype.hookUserCreate.bind(t);

  // Checks are arrays of [options, user, expected].
  const checks = [
    [
      // Empty options set nothing
      {},
      { username: 'u1', emails: ['e1', 'e2'], profile: { testService: { foo: 'bar' } } },
      { username: 'u1', emails: ['e1', 'e2'], profile: { testService: { foo: 'bar' } } }
    ],
    [
      // Ignored options set nothing
      { baz: 'quux' },
      { username: 'u1', emails: ['e1', 'e2'], profile: { testService: { foo: 'bar' } } },
      { username: 'u1', emails: ['e1', 'e2'], profile: { testService: { foo: 'bar' } } }
    ],
    [
      // Valid options overwrite existing properties
      { username: 'u2', emails: ['e20'], profile: { optionService: { baz: 'quux' } } },
      { username: 'u1', emails: ['e1', 'e2'], profile: { testService: { foo: 'bar' } } },
      { username: 'u2', emails: ['e20'], profile: { optionService: { baz: 'quux' } } }
    ],
  ];

  for (const check of checks) {
    const actual = t.hookUserCreate(check[0], check[1]);
    const expected = check[2];
    expect(actual).to.deep.equal(expected);
  }
};

export {
  testCorrectConfiguration,
  testIncorrectConfiguration,

  testGetRootFieldsMapping,
  testHookUserCreate,

  testWhoamiHappy,
  testWhoamiSad,
};
