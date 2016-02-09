/**
 * @file
 *   The configuration of accounts-drupal.
 */

Log.info("Defining server/DrupalConfiguration");

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
   * @param {Object} serviceConfiguration
   *   The ServiceConfiguration service, from the service-configuration package.
   *
   * @returns {DrupalConfiguration}
   *   A memory-only configuration instance.
   */
  constructor(name, settings, serviceConfiguration) {
    this.service = name;
    this.secret = settings[this.service].secret;
    this.rootFields = settings[this.service].rootFields || ["profile"];
    this.notSecret = settings.public[this.service]["not-secret"];
    this.configurations = serviceConfiguration.configurations;

    if (typeof this.secret === "undefined" || this.secret !== this.notSecret) {
      throw new serviceConfiguration.ConfigError(this.service);
    }
  }

  /**
   * Update the stored configuration from the current instance.
   *
   * @return {void}
   */
  persist(name) {
    const selector = { service: name };
    const serviceConfig = _.extend(_.clone(selector), {
      notSecret: this.notSecret,
      rootFields: this.rootFields,
      secret: this.secret
    });

    this.configurations.upsert(selector, serviceConfig);
  }
};
