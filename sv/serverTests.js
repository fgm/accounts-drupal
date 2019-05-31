import { expect } from 'chai';
import sinon from 'sinon';

import { Accounts } from 'meteor/accounts-base';
import { Match } from 'meteor/check';
import { Log } from 'meteor/logging';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { WebApp } from 'meteor/webapp';

import { DrupalBase } from "../shared/DrupalBase";
import { DrupalConfiguration } from './DrupalConfiguration';
import { DrupalServer } from "./DrupalServer";

const SERVICE_NAME = 'mock-service';

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

function mockServer(getContent, fail = false) {
  let mockHttp = {
    get: sinon.fake.returns({
      "content": JSON.stringify(getContent),
    }),
  };
  const meteor = {
    Collection: sinon.fake(),
    settings: {
      [SERVICE_NAME]: {},
      public: {
        [SERVICE_NAME]: {},
      },
    },
    users: null,
  };
  const server =  new DrupalServer(null, meteor, Log, null, null, null, null, mockHttp, JSON);
  expect(server).not.to.be.null;
  expect(server).to.be.an.instanceOf(DrupalServer);
  if (fail) {
    server.http.get = sinon.fake.returns({
      "content": {},
    })
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
  const whoami = server.whoamiMethod('', '');
  expect(whoami).not.to.be.null;
  expect(whoami).to.have.nested.property('uid', uid);
  done();
};

const testWhoamiSad = function(done) {
  const uid = 1;
  const server = mockServer({ online: true }, true);
  const whoami = server.whoamiMethod('', '');
  expect(whoami).not.to.be.null;
  expect(whoami).to.have.nested.property('uid', uid);
  done();
};

export {
  testCorrectConfiguration,
  testIncorrectConfiguration,
  testWhoamiHappy,
  testWhoamiSad,
};
