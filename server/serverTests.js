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
  let mockConfiguration =  { public: {}};
  mockConfiguration[serviceName] = {
    secret: "any"
  };
  mockConfiguration.public[serviceName] = {};
  return mockConfiguration;
}

Tinytest.add("Testing correct configuration", function (test) {
  const settings = mockSettings(SERVICE_NAME);
  settings.public[SERVICE_NAME]["not-secret"] = "any";

  var f = new DrupalConfiguration(SERVICE_NAME, settings, ServiceConfiguration);

  test.equal("DrupalConfiguration", f.constructor.name);
});

Tinytest.add("Testing incorrect configuration", function (test) {
  const settings = mockSettings(SERVICE_NAME);
  settings.public[SERVICE_NAME]["not-secret"] = "other";

  var instantiation = function () {
    new DrupalConfiguration(SERVICE_NAME, settings, ServiceConfiguration);
  };

  test.throws(instantiation, function (e) {
    return e.name === "ServiceConfiguration.ConfigError";
  });
});
