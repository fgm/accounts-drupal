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
  /**
   *
   * @param {AccountsClient} accounts
   *   The AccountsClient service.
   */
  constructor(accounts) {
    this.accounts = accounts ? accounts : null;
  }

  /**
   * The name of the login service implemented by the package.
   *
   * - Upper-cased to hint the result is constant.
   * - JS static methods/accessors are not usable on instances, hence this
   *   duplication.
   *
   * @returns {string}
   *   The service name.
   */
  get SERVICE_NAME() {
    return "drupal";
  }

  /**
   * The name of the login service implemented by the package.
   *
   */
  static get SERVICE_NAME() {
    return "drupal";
  }
};
