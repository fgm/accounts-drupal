const SERVICE_NAME = "mock-service";

/**
 * Setup helper for tests: create a mock settings document.
 *
 * @param {String} serviceName
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

Tinytest.add("Testing correct configuration", function (test) {
  const settings = mockSettings(SERVICE_NAME);
  settings.public[SERVICE_NAME].autoLogin = true;

  let f = new DrupalConfiguration(SERVICE_NAME, settings, Log, ServiceConfiguration);

  test.equal("DrupalConfiguration", f.constructor.name);
});

Tinytest.add("Testing incorrect configuration", function (test) {
  let configuration = { configurations: null };
  let settings = {};
  let instantiation;

  // Null settings.
  instantiation = function () {
    return new DrupalConfiguration(SERVICE_NAME, null, Log, configuration);
  };
  test.throws(instantiation, function (e) {
    return e.errorType === "Meteor.Error" && e.name === "Error" && e.error === "drupal-configuration";
  });

  // Empty non-null settings.
  instantiation = function () {
    return new DrupalConfiguration(SERVICE_NAME, settings, Log, configuration);
  };
  test.throws(instantiation, function (e) {
    return e.errorType === "Meteor.Error" && e.name === "Error" && e.error === "drupal-configuration";
  });

  // Non-boolean autoLogin.
  settings = { public: {} };
  settings.public[SERVICE_NAME] = { autoLogin: 69 };
  instantiation = function () {
    return new DrupalConfiguration(SERVICE_NAME, settings, Log, configuration);
  };
  test.throws(instantiation, function (e) {
    return e.errorType === "Meteor.Error" && e.name === "Error" && e.error === "drupal-configuration";
  });

  // Missing ConfigError method on configuration service.
  settings[SERVICE_NAME] = {};
  instantiation = function () {
    return new DrupalConfiguration(SERVICE_NAME, settings, Log, configuration);
  };
  test.throws(instantiation, function (e) {
    return e.errorType === "Meteor.Error" && e.name === "Error" && e.error === "drupal-configuration";
  });

  // Missing configurations on configuration service.
  configuration = _.clone(ServiceConfiguration);
  configuration.configurations = null;
  test.throws(instantiation, function (e) {
    return e.name === "ServiceConfiguration.ConfigError";
  });
});
