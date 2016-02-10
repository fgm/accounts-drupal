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
   * @param {String} streamName
   *   The name of the stream used for SSO notifications.
   */
  constructor(accounts, meteor, logger, streamName) {
    this.accounts = accounts || null;
    this.logger = logger || null;
    this.stream = new meteor.Stream(streamName);

    if (meteor.isClient) {
      this.location = "client";
    } else if (meteor.isServer) {
      this.location = "server";
    } else {
      // XXX What about Cordova ?
      this.location = null;
    }
  }

  /**
   * Perform a check() on a cookie for Drupal 8 plausibility.
   *
   * @param {String} name
   *   The cookie name.
   * @param {String} value
   *   The cookie value (id).
   *
   * Where checks like this should throw instead of returning false: in Meteor
   * 1.2.* and 1.3 <= beta5, testSubtree() runs the check a second time if it
   * returned instead of throwing. Look for "if (pattern instanceof Where) {" in
   * match.js#testSubtree() for details.
   *
   * @see testSubtree()

   * @see \Drupal\Component\Utility\Crypt::randomBytesBase64().
   */
  checkCookie(name, value) {
    // Unlike a fat arrow function, Match.Where redefines this.
    let that = this;
    const plausibleCookie = Match.Where(function ({ name, value }) {
      check(name, String);
      check(value, String);
      const NAME_REGEXP = /^SESS[0-9A-F]{32}$/i;
      if (!NAME_REGEXP.exec(name)) {
        const message = `Checked invalid cookie name ${name}.`;
        that.logger.info(message)
        throw new Match.Error(message);
      }
      const VALUE_REGEXP = /^[\w]{32,128}$/i;
      if (!VALUE_REGEXP.exec(value)) {
        const message = `Checked invalid cookie value ${value}.`;
        that.logger.info(message)
        throw new Match.Error(message);
      }
      return true;
    });

    check({ name, value }, plausibleCookie);
  }

  /**
   * Convert a JS-style cookie string to a hash of Drupal-plausible cookies.
   *
   * @param {String} cookie
   *   The cookie string in JS semicolon-separated format.
   *
   * @returns {Object}
   *   A cookie-name:cookie-value hash.
   */
  cookies(cookie) {
    check(cookie, String);

    let asArray = cookie.split(";");
    let result = {};
    asArray.forEach((v) => {
      let [ name, value ] = v.split("=");
      try {
        this.checkCookie(name, value);
        result[name] = value;
      }
      catch (e) {
        if (!(e instanceof Match.Error)) {
          throw e;
        }
      }
    });
    return result;
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
