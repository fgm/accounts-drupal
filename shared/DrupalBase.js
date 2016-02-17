/**
 * @file
 *   Contains the DrupalBase class.
 */

Log.debug("Defining shared/DrupalBase");

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
   * @param {Match} match
   *   The Meteor check matcher service.
   * @param {Stream} stream
   *   The stream used by the package.
   *
   * Notice that the returned instance has asynchronous behavior: its state
   * component will only be initialized once the server callback has returned,
   * which will almost always be some milliseconds after the instance itself is
   * returned: check this.state.online to ensure the connection attempts is done:
   * - undefined -> null
   * - false -> failed, values are defaults,
   * - true -> succeeded,valuers are those provided by the server.
   *
   * @returns {DrupalBase}
   *   An unconfigured base instance, meant for child use.
   *
   * @constructor
   */
  constructor(accounts, meteor, logger, match, stream) {
    this.accounts = accounts || null;
    this.logger = logger || null;
    this.match = match || null;
    this.stream = stream || null;
    this.settings = { client: {} };

    this.state = {
      anonymousName: "anome",
      cookieName: "SESS___4___8__12__16__20__24__28__32",
      // Online is only set once the initialization has completed.
      online: "construction"
    };

    if (meteor.isClient) {
      this.location = "client";
    }
    else if (meteor.isServer) {
      this.location = "server";
    }
    else {
      // XXX What about Cordova ?
      this.location = null;
    }
  }

  /**
   * Perform a check() on a cookie for Drupal 8 plausibility.
   *
   * Where checks like this should throw instead of returning false: in Meteor
   * 1.2.* and 1.3 <= beta5, testSubtree() runs the check a second time if it
   * returned instead of throwing. Look for "if (pattern instanceof Where) {" in
   * match.js#testSubtree() for details.
   *
   * @see testSubtree()
   *
   * @see \Drupal\Component\Utility\Crypt::randomBytesBase64().
   *
   * @param {String} name
   *   The cookie name.
   * @param {String} value
   *   The cookie value (id).
   *
   * @returns {Boolean}
   *   Did plausibility checks pass ?
   */
  checkCookie(name, value) {
    // Unlike a fat arrow function, Match.Where redefines this.
    let that = this;
    const plausibleCookie = this.match.Where(function ({ name: checkedName, value: checkedValue }) {
      check(checkedName, String);
      check(checkedValue, String);
      const NAME_REGEXP = /^SESS[0-9A-F]{32}$/i;
      if (!NAME_REGEXP.exec(checkedName)) {
        const message = `Checked invalid cookie name ${checkedName}.`;
        that.logger.info(message);
        throw new this.match.Error(message);
      }
      const VALUE_REGEXP = /^[\w_-]{32,128}$/i;
      if (!VALUE_REGEXP.exec(checkedValue)) {
        const message = `Checked invalid cookie value ${checkedValue}.`;
        that.logger.info(message);
        throw new this.match.Error(message);
      }
      return true;
    });

    check({ name, value }, plausibleCookie);
  }

  /**
   * Abstract base method for "accounts-drupal:initState".
   *
   * @returns {void}
   */
  initStateMethod() {
    throw new Meteor.Error("abstract-method", "initStateMethod is abstract: use a concrete implementation instead.");
  }

  /**
   * Abstract base method for "accounts-drupal:whoami".
   *
   * @param {String} cookieName
   *   The cookie name.
   * @param {String} cookieValue
   *   The cookie value.
   *
   * @returns {Object}
   *   - uid: a Drupal user id, 0 if not logged on Drupal
   *   - name: a Drupal user name, defaulting to the settings-defined anonymous.
   *   - roles: an array of role names, possibly empty.
   */
  whoamiMethod(cookieName, cookieValue) {
    throw new Meteor.Error("abstract-method", `whoamiMehod(${cookieName}, ${cookieValue}) is abstract: use a concrete implementation instead.`);
  }

  /**
   * The name of the stream used by the package.
   *
   * - Upper-cased to hint the result is constant.
   * - JS static methods/accessors are not usable on instances, hence this
   *   duplication.
   *
   * @returns {string}
   *   The stream name.
   */
  get STREAM_NAME() {
    return "accounts-drupal:refresh";
  }

  /**
   * The name of the stream used by the package.
   *
   * - Upper-cased to hint the result is constant.
   * - JS static methods/accessors are not usable on instances, hence this
   *   duplication.
   *
   * @returns {string}
   *   The stream name.
   */
  static get STREAM_NAME() {
    return "accounts-drupal:refresh";
  }

  /**
   * The name of the event used by the package on its stream.
   *
   * - Upper-cased to hint the result is constant.
   * - JS static methods/accessors are not usable on instances, hence this
   *   duplication.
   *
   * @returns {string}
   *   The event name.
   */
  get EVENT_NAME() {
    return "accounts-drupal:refresh:event";
  }

  /**
   * The name of the event used by the package on its stream.
   *
   * - Upper-cased to hint the result is constant.
   * - JS static methods/accessors are not usable on instances, hence this
   *   duplication.
   *
   * @returns {string}
   *   The event name.
   */
  static get EVENT_NAME() {
    return "accounts-drupal:refresh:event";
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
    return "accounts-drupal";
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
  static get SERVICE_NAME() {
    return "accounts-drupal";
  }
};
