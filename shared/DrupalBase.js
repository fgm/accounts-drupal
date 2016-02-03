/**
 * @file
 *   Contains the DrupalBase class.
 */

Meteor._debug('Defining DrupalBase');

/**
 * A class providing the mechanisms for the "drupal" accounts service.
 *
 * @type {DrupalServer}
 */
DrupalBase = class DrupalBase {
  constructor(accounts) {
    this.accounts = accounts ? accounts : null;
  }

  /**
   * The name of the login service implemented by the package.
   *
   * Uppercased to hint the result is constant.
   *
   * @returns {string}
   *   The service name.
   */
  get SERVICE_NAME() {
    return "drupal";
  }

};

