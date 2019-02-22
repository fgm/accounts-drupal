import { DrupalConfiguration } from './DrupalConfiguration';

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

Tinytest.add('Testing correct configuration', function (test) {
  const settings = mockSettings(SERVICE_NAME);
  settings.public[SERVICE_NAME] = { backgroundLogin: 60 };

  let f = new DrupalConfiguration(Meteor, ServiceConfiguration, Log, settings, SERVICE_NAME);

  test.equal('DrupalConfiguration', f.constructor.name);
});

Tinytest.add('Testing incorrect configuration', function (test) {
  let configuration = { configurations: null };
  let settings = {};
  let instantiation;

  // Null settings.
  instantiation = function () {
    return new DrupalConfiguration(Meteor, configuration, Log, null, SERVICE_NAME);
  };
  test.throws(instantiation, function (e) {
    return e.errorType === 'Meteor.Error' && e.name === 'Error' && e.error === 'drupal-configuration';
  });

  // Empty non-null settings.
  instantiation = function () {
    return new DrupalConfiguration(Meteor, configuration, Log, settings, SERVICE_NAME);
  };
  test.throws(instantiation, function (e) {
    return e.errorType === 'Meteor.Error' && e.name === 'Error' && e.error === 'drupal-configuration';
  });

  // Non-boolean autoLogin.
  settings[SERVICE_NAME] = {};
  settings.public = {};
  settings.public[SERVICE_NAME] = { autoLogin: true };
  instantiation = function () {
    return new DrupalConfiguration(Meteor, configuration, Log, settings, SERVICE_NAME);
  };
  test.throws(instantiation, function (e) {
    return e.errorType === 'Meteor.Error' && e.name === 'Error' && e.error === 'drupal-configuration';
  });

  // Missing ConfigError method on configuration service.
  settings[SERVICE_NAME] = {};
  settings.public = {};
  instantiation = function () {
    return new DrupalConfiguration(Meteor, configuration, Log, settings, SERVICE_NAME);
  };
  test.throws(instantiation, function (e) {
    return e.errorType === 'Meteor.Error' && e.name === 'Error' && e.error === 'drupal-configuration';
  });

  // Missing configurations on configuration service.
  settings[SERVICE_NAME] = {};
  settings.public = {};
  settings.public[SERVICE_NAME] = { backgroundLogin: 60 };
  configuration = _.clone(ServiceConfiguration);
  configuration.configurations = null;
  test.throws(instantiation, function (e) {
    return e.name === 'ServiceConfiguration.ConfigError';
  });
});
