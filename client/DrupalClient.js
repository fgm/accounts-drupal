/**
 * @file
 *   Contains the DrupalClient class.
 */

Log.debug("Defining client/DrupalClient");

/**
 * The client-side class for the package.
 *
 * @type {DrupalClient}
 */
DrupalClient = class DrupalClient extends DrupalBase {
  /**
   *
   * @param {AccountsClient} accounts
   *   The AccountsClient service.
   * @param {Meteor} meteor
   *   The Meteor global.
   * @param {Log} logger
   *   The Meteor Log service.
   * @param {Stream} stream
   *   The stream used by the package.
   */
  constructor(accounts, meteor, logger, stream) {
    super(accounts, meteor, logger, stream);
    this.call = (...args) => (meteor.call(...args));

    // - Merge public settings to instance.
    Object.assign(this.settings.client, meteor.settings.public[DrupalBase.SERVICE_NAME]);

    if (this.isAutologinEnabled()) {
      this.stream.on(this.EVENT_NAME, () => {
        this.logger.info("Automatic login status update.");
        this.login(document.cookie);
      });
    }
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

  getDefaultUser() {
    return {
      uid: 0,
      name: 'undefined name',
      roles: ['anonymous user']
    };
  }

  /**
   * Is the auto-login feature enabled in settings.json ?
   *
   * @returns {boolean}
   *   True if it is truthy, false otherwise.
   */
  isAutologinEnabled() {
    return !!this.settings.client.autoLogin;
  }

  /**
   * The method to use to perform login.
   *
   * @param {String} cookie
   *   JS semicolon-separated cookie string.
   * @param {function} callback
   *   Optional. Callback after login, as userCallback(err, res).
   *
   * @return {void}
   */
  login (cookie, callback = null) {
    let logArg = { app: this.SERVICE_NAME };
    const cookies = this.cookies(cookie);

    if (_.isEmpty(cookies)) {
      if (this.accounts.userId()) {
        this.logger.info("No cookie found: logging out.");
        this.logout();
      }
      else {
        this.logger.warn(Object.assign(logArg, {message: "No cookie found, not trying to login."}));
      }
      return;
    }
    let methodArgument = {};

    methodArgument[this.SERVICE_NAME] = cookies;

    // Other available arguments:
    // - methodName: default = "login"
    // - suppressLoggingIn: default = false
    let methodArguments = [methodArgument];
    this.accounts.callLoginMethod({
      methodArguments,
      userCallback: (err, res) => {
        let reArm;
        if (err) {
          this.logger.warn(Object.assign(logArg, { message: "Not logged-in on Drupal." }));
          this.logout();
          reArm = false;
        }
        else {
          this.logger.info(Object.assign(logArg, { message: "Logged-in on Drupal." }));
          reArm = true;
        }
        // With auto-login enabled, listening is constant, so do not arm once.
        if (!this.isAutologinEnabled() && reArm) {
          this.stream.once(this.EVENT_NAME, () => {
            this.logger.info("Updating logged-in user.");
            this.login(document.cookie);
          });
        }
        if (_.isFunction(callback)) {
          callback(err, res);
        }
      }
    });
  };

  /**
   * An optional helper to log out.
   *
   * @returns {void}
   */
  logout() {
    this.accounts.logout();
  }

  /**
   * Update the user information from the Drupal server based on the cookies.
   *
   * @param {string} cookies
   */
  updateUser(cookies) {
    // XXX why do we do this (previously testing Meteor.isClient) ?
    if (true) {
      Meteor._debug('Setting up once on ' + this.STREAM_NAME);
      // Just listen once, since we rearm immediately.
      this.stream.once(this.EVENT_NAME, (e) => {
        // In fat-arrow functions, "this" is not redefined.
        this.updateUser(document.cookie);
      });
    }
  };

  initStateMethod() {
    Log.info("Client stub for initStateMethod, doing nothing.");
  }

  whoamiMethod(cookieBlob) {
    Log.info("Client stub for whoamiMehod, returning default user.");
    Meteor._debug("whoami this", this);
    return this.getDefaultUser();
  }

};
