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
    const serverSettings = settings[this.service];
    // const clientSettings = settings.public[this.service];

    this.site = serverSettings.site || "http://d8.fibo.dev";
    this.appToken = serverSettings.appToken || "invalid-token";
    this.rootFields = serverSettings.rootFields || ["profile"];

    this.configurations = serviceConfiguration.configurations;

    // This is how to signal an error: throw a ConfigError.
    if (false) {
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
      appToken: this.appToken,
      rootFields: this.rootFields,
      site: this.site
    });

    this.configurations.upsert(selector, serviceConfig);
  }
};
