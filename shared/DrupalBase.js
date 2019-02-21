/**
 * @file
 *   Contains the DrupalBase class.
 */

/**
 * A class providing the mechanisms for the "drupal" accounts service.
 *
 * @type {DrupalServer}
 */
class DrupalBase {
  /**
   * Constructor.
   *
   * @param {Meteor} meteor
   *   The Meteor global.
   * @param {Log} logger
   *   The Meteor logging service.
   * @param {Match} match
   *   The Meteor check matcher service.
   * @param {Streamer} stream
   *   The stream used by the package.
   *
   * Notice that the returned instance has asynchronous behavior: its state
   * component will only be initialized once the server callback has returned,
   * which will almost always be some milliseconds after the instance itself is
   * returned: check this.state.online to ensure the connection attempts is
   *   done:
   * - undefined -> null
   * - false -> failed, values are defaults,
   * - true -> succeeded,valuers are those provided by the server.
   *
   * @returns {DrupalBase}
   *   An unconfigured base instance, meant for child use.
   */
  constructor(meteor, logger, match, stream) {
    this.logger = logger || null;
    this.match = match || null;
    this.stream = stream || null;
    this.settings = { client: {} };

    this.state = {
      anonymousName: 'anome',
      cookieName: 'SESS___4___8__12__16__20__24__28__32'
      // "online" is only set once the initialization has completed.
    };

    if (meteor.isClient) {
      this.location = 'client';
    }
    else if (meteor.isServer) {
      this.location = 'server';
    }
    else {
      // XXX What about Cordova ?
      this.location = null;
    }
  }

  /**
   * Perform a check() on a cookie for Drupal 8 plausibility.
   *
   * Unlike versions < 0.4.2, this is no longer a Match.Where function.
   *
   * @see \Drupal\Component\Utility\Crypt::randomBytesBase64()
   *
   * @param {string} name
   *   The cookie name.
   * @param {string} value
   *   The cookie value (id).
   *
   * @returns {boolean}
   *   Did plausibility checks pass ?
   */
  checkCookie(name, value) {
    if (typeof name !== 'string' || typeof value !== 'string') {
      return false;
    }
    const NAME_REGEXP = /^SESS[0-9A-F]{32}$/i;
    if (!NAME_REGEXP.exec(name)) {
      return false;
    }
    // @FIXME Temporary fix for SF4 handler emitting possibly short values.
    const VALUE_REGEXP = /^[\w_-]{1,128}$/i;
    if (!VALUE_REGEXP.exec(value)) {
      this.logger.warn(`Checked invalid cookie value ${value}.`);
      return false;
    }

    return true;
  }

  /**
   * Abstract base method for "accounts-drupal:initState".
   *
   * @param {boolean} refresh
   *   On server, perform a Drupal WS call if true, otherwise use the instance
   *   information. Ignored on client.
   *
   * @returns {Object}
   *   - Key cookieName: the name of the session cookie used by the site.
   *   - Key anonymousName: the name of the anonymous user to use when not
   *     logged in.
   *   - Key online: site was available at last check.
   */
  initStateMethod(refresh = false) {
    throw new Meteor.Error('abstract-method', 'initStateMethod is abstract: use a concrete implementation instead.');
  }

  /**
   * Abstract base method for "accounts-drupal:whoami".
   *
   * @param {string} cookieName
   *   The cookie name.
   * @param {string} cookieValue
   *   The cookie value.
   *
   * @returns {Object}
   *   - Key uid: a Drupal user id, 0 if not logged on Drupal.
   *   - Key name: a Drupal user name, defaulting to the settings-defined anonymous.
   *   - Key roles: an array of role names, possibly empty.
   */
  whoamiMethod(cookieName, cookieValue) {
    throw new Meteor.Error('abstract-method', `whoamiMehod(${cookieName}, ${cookieValue}) is abstract: use a concrete implementation instead.`);
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
    return 'accounts-drupal:refresh';
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
    return 'accounts-drupal:refresh';
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
    return 'accounts-drupal:refresh:event';
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
    return 'accounts-drupal:refresh:event';
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
    return 'accounts-drupal';
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
    return 'accounts-drupal';
  }
}

export {
  DrupalBase,
};
