import {expect} from 'chai';
import sinon from 'sinon';
import {Log} from 'meteor/logging';
import {Meteor} from 'meteor/meteor';
import {ServiceConfiguration} from 'meteor/service-configuration';
import {DrupalConfiguration} from './DrupalConfiguration';
import {DrupalServer} from "./DrupalServer";

const SERVICE_NAME = 'mock-service';

function mockLog() {
  const log = {};
  log.debug = log.info = log.warn = log.error = () => {};
  return log;
}

function mockMeteor() {
  const meteor = new sinon.fake(Meteor.constructor);
  meteor.Collection = sinon.fake();
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
      "content": JSON.stringify(getContent),
    }),
  };
  return mock;
}

function mockServer(getContent, fail = false) {
  const meteor = mockMeteor();

  const server = {
    http: mockHttp(getContent),
    logger: mockLog(),
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
      "content": {},
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

const testWhoamiHappy = function(done) {
  const uid = 1;
  const server = mockServer({
    online: true,
    uid,
    name: "admin",
    roles: [],
  });
  expect(server).not.to.be.a('null');
  const whoami = server.whoamiMethod('', '');
  expect(whoami).not.to.be.a('null');
  expect(whoami).to.have.nested.property('uid', uid);
  done();
};

const testWhoamiSad = function(done) {
  const server = mockServer({ online: true }, true);
  expect(server).not.to.be.null;
  const whoami = server.whoamiMethod('', '');
  expect(whoami).not.to.be.null;
  expect(whoami).to.have.nested.property('uid', 0);
  done();
};

export {
  testCorrectConfiguration,
  testIncorrectConfiguration,
  testWhoamiHappy,
  testWhoamiSad,
};
