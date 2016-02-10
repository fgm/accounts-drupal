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
    this.userDep = new Tracker.Dependency();
    this.user = this.getDefaultUser();
    
    // - Merge public settings to instance.
    Object.assign(this.settings.client, meteor.settings.public);
  }

  getDefaultUser() {
    return {
      uid: 0,
      name: 'undefined name',
      roles: ['anonymous user']
    };
  }

  getUserId() {
    this.userDep.depend();
    return this.user.uid;
  }

  getUserName() {
    this.userDep.depend();
    return this.user.name;
  };

  getUserRoles() {
    this.userDep.depend();
    return this.user.roles;
  };

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
      this.logger.warn(Object.assign(logArg, { message: "No cookie found, not trying to login." }));
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
        if (err) {
          console.log(err);
          this.logger.warn(Object.assign(logArg, { message: "Drupal login failed." }));
        }
        else {
          console.log(res);
          this.logger.info(Object.assign(logArg, { message: "Drupal login succeeded." }));
        }
        if (_.isFunction(callback)) {
          callback(err, res);
        }
      }
    });
  };

  /**
   * Update the user information from the Drupal server based on the cookies.
   *
   * @param {string} cookies
   */
  updateUser(cookies) {
    // XXX why do we do this (previously testin Meteor.isClient) ?
    if (true) {
      Meteor._debug('Setting up once on ' + this.STREAM_NAME);
      // Just listen once, since we rearm immediately.
      this.stream.once(this.EVENT_NAME, (e) => {
        // In fat-arrow functions, "this" is not redefined.
        this.updateUser(document.cookie);
      });
    }

    this.call('drupal-sso.whoami', cookies, (err, res) => {
      if (err) {
        throw new Meteor.Error('whoami', err);
      }

      Object.assign(this.user, res);
      this.userDep.changed();
    });
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
