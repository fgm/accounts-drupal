/**
 * @file
 *   Contains the DrupalClient class.
 */

Log.debug('Defining client/DrupalClient');

/**
 * The client-side class for the package.
 *
 * @type {DrupalClient}
 */
DrupalClient = class DrupalClient extends DrupalBase {
  /**
   * Client constructor.
   *
   * @param {AccountsClient} accounts
   *   The AccountsClient service.
   * @param {Meteor} meteor
   *   The Meteor global.
   * @param {Log} logger
   *   A Meteor logger service.
   * @param {IMatch} match
   *   The Meteor check matcher service.
   * @param {Streamer} stream
   *   The stream used by the package.
   * @param {ITemplate} template
   *   The Meteor Template service.
   *
   * @constructor
   */
  constructor(accounts, meteor, logger, match, stream, template) {
    super(accounts, meteor, logger, match, stream);
    this.call = (...args) => (meteor.call(...args));

    /**
     * The result of a this.setInterval() call.
     * @type {Any}
     */
    this.backgroundLoginInterval = null;

    /**
     * @param {Any} id
     */
    this.clearInterval = meteor.clearInterval.bind(this);
    /**
     * The Meteor.setInterval() function, bound to this.
     *
     * @param {Function} func
     * @param {Number} delay
     *
     * @return {Any} id
     */
    this.setInterval = meteor.setInterval.bind(this);
    /**
     * The Meteor.setTimeout() function, bound to this.
     *
     * @param {Function} func
     * @param {Number} delay
     */
    this.setTimeout = meteor.setTimeout.bind(this);
    this.template = template;
    this.user = meteor.user.bind(this);

    // - Merge public settings to instance.
    Object.assign(this.settings.client, meteor.settings.public[this.SERVICE_NAME]);

    meteor.call('accounts-drupal.initState', (err, res) => {
      if (err) {
        return;
      }
      this.state = res;
    });

    this.stream.on(this.EVENT_NAME, this.onRefresh.bind(this));
    this.registerHelpers();
  }

  /**
   * Enable the background login check if it is not already active.
   *
   * Do nothing if it is already active.
   *
   * @return {void}
   */
  backgroundLoginEnable() {
    if (!this.backgroundLoginInterval) {
      // Value of this setting was validated in server-side DrupalConfiguration.
      const backgroundLogin = 1000 * parseInt(this.settings.client.backgroundLogin, 10);
      this.backgroundLoginInterval = this.setInterval(() => {
        this.onBackgroundLogin();
      }, backgroundLogin);
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
    let asArray = cookie.split(';');
    let result = {};
    asArray.forEach((v) => {
      let [name, value] = v.trim().split('=');
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
   * Attempt login after a pseudo-random delay.
   *
   * @return {void}
   */
  deferredLogin() {
    // TODO use settings and/or an automatic retry with exponential backoff.
    const min = 1000;
    const max = 5000;
    const delay = Math.round(Math.random() * (max - min) + min);
    this.logger.debug('Deferred login in ' + delay + ' msec');
    this.setTimeout(() => {
      this.login(document.cookie);
    }, delay);
  }

  getDefaultUser() {
    return {
      uid: 0,
      name: 'undefined name',
      roles: ['anonymous user']
    };
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
  login(cookie, callback = null) {
    let logArg = { app: this.SERVICE_NAME };
    const cookies = this.cookies(cookie);

    if (_.isEmpty(cookies)) {
      let message;
      if (this.accounts.userId()) {
        message = 'No cookie found: logging out.';
        this.logger.info(message);
        this.logout();
      }
      else {
        message = 'No cookie found, not trying to login.';
        this.logger.warn(Object.assign(logArg, { message }));
      }
      if (_.isFunction(callback)) {
        callback(new Meteor.Error(message));
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
      // Spurious ESLint complaint about unused property: it does not detect use
      // because it happens in a loop. Do NOT remove that property.
      userCallback: (err, res) => {
        if (err) {
          this.logger.warn(Object.assign(logArg, { message: 'Not logged-in on Drupal.' }));
          this.logout();
        }
        else {
          this.backgroundLoginEnable();
          this.logger.debug(Object.assign(logArg, { message: 'Logged-in on Drupal.' }));
        }
        if (_.isFunction(callback)) {
          callback(err, res);
        }
      }
    });
  }

  /**
   * An optional helper to log out.
   *
   * @returns {void}
   */
  logout() {
    this.accounts.logout();
  }

  /**
   * @inheritDoc
   */
  initStateMethod() {
    this.logger.debug('Client stub for initStateMethod, doing nothing.');
    return this.getDefaultUser();
  }

  /**
   * Perform a login check only for an authenticated user.
   *
   * If invoked for an anonymous user, disable the background process.
   *
   * @return {void}
   */
  onBackgroundLogin() {
    this.logger.debug('Background login check');
    if (this.user()) {
      this.login(document.cookie);
    }
    else if (typeof this.backgroundLoginInterval !== 'undefined') {
      this.clearInterval(this.backgroundLoginInterval);
    }
  }

  onRefresh(event, userId) {
    this.logger.info('Automatic login status update: ' + event + '(' + userId + ')');
    // this.login(document.cookie);
    switch (event) {
      case 'anonymous':
        if (!this.user()) {
          this.deferredLogin();
        }
        break;

      case 'authenticated':
        if (this.user()) {
          this.deferredLogin();
        }
        break;

      case 'userId':
        if (this.uid === userId) {
          this.login(document.cookie);
        }
        break;

      default:
        this.logger.info(`Received unknown event ${event}(${userId}): ignored`);
        break;
    }
  }

  /**
   * Register template helpers for Blaze.
   *
   * @returns {void}
   */
  registerHelpers() {
    const helpers = [
      { name: 'accountsDrupalUserId', code: () => client.uid },
      { name: 'accountsDrupalUsername', code: () => client.name },
      { name: 'accountsDrupalRoles', code: () => client.roles }
    ];

    helpers.forEach(({ name, code }) => this.template.registerHelper(name, code));
  }

  /**
   * @inheritDoc
   */
  whoamiMethod(cookieName, cookieValue) {
    this.logger.info(`Client stub for whoamiMethod(${cookieName}, ${cookieValue}), returning default user.`);
    return this.getDefaultUser();
  }

  get uid() {
    const user = this.user();
    const uid = user ? parseInt(user.profile[client.SERVICE_NAME].uid, 10) : 0;
    return uid;
  }

  get name() {
    const user = this.user();
    const name = user ? user.username : this.state.anonymousName;
    return name;
  }

  get roles() {
    const user = this.user();
    const roles = user ? this.user().profile[this.SERVICE_NAME].roles : ['anonymous user'];
    return roles;
  }
};
