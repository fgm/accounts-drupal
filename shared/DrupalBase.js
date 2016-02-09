/**
 * @file
 *   Contains the DrupalBase class.
 */

Log.info('Defining shared/DrupalBase');

/**
 * A class providing the mechanisms for the "drupal" accounts service.
 *
 * @type {DrupalServer}
 */
DrupalBase = class DrupalBase {
  /**
   * Constructor.
   *
   * @param {AccountsClient} accounts
   *   The AccountsClient service.
   * @param {Meteor} meteor
   *   The Meteor global.
   * @param {Log} logger
   *   The Meteor logging service.
   */
  constructor(accounts, meteor, logger) {
    this.accounts = accounts ? accounts : null;
    this.logger = logger ? logger : null;
    if (meteor.isClient) {
      this.location = "client";
    } else if (meteor.isServer) {
      this.location = "server";
    } else {
      this.location = null;
    }
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
