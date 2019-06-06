/**
 * @file
 *   The configuration of accounts-drupal.
 */
import { _ } from 'meteor/underscore';

/**
 * Configure the service from its settings.
 */
class DrupalConfiguration {

  /**
   * Constructor.
   *
   * @param {Meteor} meteor
   *   The Meteor global.
   * @param {Object} serviceConfiguration
   *   The ServiceConfiguration service.
   * @param {Log} logger
   *   The Meteor Log service.
   * @param {Object} settings
   *   Meteor settings.
   * @param {string} name
   *   The name of the service.
   *
   * @returns {DrupalConfiguration}
   *   A memory-only configuration instance.
   */
  constructor(meteor, serviceConfiguration, logger, settings, name) {
    this.service = name;
    this.logger = logger;

    if (_.isEmpty(settings)) {
      throw new meteor.Error('drupal-configuration', 'Settings are empty.');
    }

    if (settings.public && settings.public[name] && typeof settings.public[name].autoLogin !== 'undefined') {
      throw new meteor.Error('drupal-configuration', 'Settings contain obsolete autoLogin field.');
    }

    const serverSettings = settings[this.service];
    if (typeof serverSettings === 'undefined') {
      throw new meteor.Error('drupal-configuration', `Settings are missing a ${name} root key.`);
    }

    const clientSettings = settings.public[this.service];
    if (typeof clientSettings === 'undefined') {
      throw new meteor.Error('drupal-configuration', `Settings are missing a ${name} public key.`);
    }
    let backgroundLogin = clientSettings.backgroundLogin;
    if (typeof backgroundLogin === 'undefined') {
      throw new meteor.Error('drupal-configuration', `Settings are missing a ${name}/backgroundLogin public key.`);
    }

    this.site = serverSettings.site || 'http://localhost';
    this.appToken = serverSettings.appToken || 'invalid-token';
    this.rootFields = serverSettings.rootFields || ['profile'];

    this.configurations = serviceConfiguration.configurations;

    if (!serviceConfiguration.ConfigError || serviceConfiguration.ConfigError.prototype.name !== 'ServiceConfiguration.ConfigError') {
      throw new meteor.Error('drupal-configuration', 'Invalid service-configuration: invalid ConfigError.');
    }

    // Ensure configurations looks usable.
    if (typeof this.configurations !== 'object' || _.isEmpty(this.configurations)) {
      throw new serviceConfiguration.ConfigError(name);
    }
  }

  /**
   * Update the stored configuration from the current instance.
   *
   * @param {string} name
   *   The name of the Drupal login service.
   *
   * @returns {undefined}
   */
  persist(name) {
    const selector = { service: name };
    const serviceConfig = { ...selector,
      appToken: this.appToken,
      rootFields: this.rootFields,
      site: this.site
    };

    this.configurations.upsert(selector, serviceConfig);
  }

}

export {
  DrupalConfiguration,
};
