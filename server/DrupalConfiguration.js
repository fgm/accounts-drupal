/**
 * @file
 *   The configuration of accounts-drupal.
 */

Log.debug("Defining server/DrupalConfiguration");

/**
 * Configure the service from its settings.
 */
DrupalConfiguration = class DrupalConfiguration {
  /**
   * Constructor.
   *
   * @param {String} name
   *   The name of the service.
   * @param {Object} settings
   *   Meteor settings.
   * @param {Log} logger
   *   The Log service.
   * @param {Object} serviceConfiguration
   *   The ServiceConfiguration service, from the service-configuration package.
   *
   * @returns {DrupalConfiguration}
   *   A memory-only configuration instance.
   */
  constructor(name, settings, logger, serviceConfiguration) {
    this.service = name;
    this.logger = logger;

    if (_.isEmpty(settings)) {
      throw new Meteor.Error("drupal-configuration", "Settings are empty.");
    }

    if (settings.public && settings.public[name] && typeof settings.public[name].autoLogin !== "undefined") {
      throw new Meteor.Error("drupal-configuration", "Settings contain obsolete autoLogin field.");
    }

    const serverSettings = settings[this.service];
    if (typeof serverSettings === "undefined") {
      throw new Meteor.Error("drupal-configuration", `Settings are missing a ${name} root key.`);
    }

    const clientSettings = settings.public[this.service];
    if (typeof clientSettings === "undefined") {
      throw new Meteor.Error("drupal-configuration", `Settings are missing a ${name} public key.`);
    }
    let backgroundLogin = clientSettings.backgroundLogin;
    if (typeof backgroundLogin === "undefined") {
      throw new Meteor.Error("drupal-configuration", `Settings are missing a ${name}/backgroundLogin public key.`);
    }

    this.site = serverSettings.site || "http://d8.fibo.dev";
    this.appToken = serverSettings.appToken || "invalid-token";
    this.rootFields = serverSettings.rootFields || ["profile"];

    this.configurations = serviceConfiguration.configurations;

    if (!serviceConfiguration.ConfigError || serviceConfiguration.ConfigError.prototype.name !== "ServiceConfiguration.ConfigError") {
      throw new Meteor.Error("drupal-configuration", "Invalid service-configuration: invalid ConfigError.");
    }

    // Ensure configurations looks usable.
    if (!typeof this.configurations === "object" || _.isEmpty(this.configurations)) {
      throw new ServiceConfiguration.ConfigError(name);
    }
  }

  /**
   * Update the stored configuration from the current instance.
   *
   * @param {String} name
   *   The name of the Drupa login service.
   *
   * @return {void}
   */
  persist(name) {
    const selector = { service: name };
    const serviceConfig = _.extend(_.clone(selector), {
      appToken: this.appToken,
      rootFields: this.rootFields,
      site: this.site
    });

    this.configurations.upsert(selector, serviceConfig);
  }
};
