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
   * Client constructor.
   *
   * @param {AccountsClient} accounts
   *   The AccountsClient service.
   * @param {Meteor} meteor
   *   The Meteor global.
   * @param {Log} logger
   *   The Meteor Log service.
   * @param {Match} match
   *   The Meteor check matcher service.
   * @param {Streamer} stream
   *   The stream used by the package.
   * @param {Template} template
   *   The Meteor Template service.
   *
   * @constructor
   */
  constructor(accounts, meteor, logger, match, stream, template) {
    super(accounts, meteor, logger, match, stream);
    this.call = (...args) => (meteor.call(...args));
    this.template = template;
    this.user = meteor.user.bind(this);

    // - Merge public settings to instance.
    Object.assign(this.settings.client, meteor.settings.public[this.SERVICE_NAME]);

    meteor.call("accounts-drupal.initState", (err, res) => {
      if (err) {
        return;
      }
      this.state = res;
    });

    if (this.isAutologinEnabled()) {
      this.stream.on(this.EVENT_NAME, (changeType, docs) => {
        this.logger.info("Automatic login status update.", { changeType, docs });
        this.login(document.cookie);
      });
    }

    this.registerHelpers();
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
      let [name, value] = v.trim().split("=");
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
      name: "undefined name",
      roles: ["anonymous user"]
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
  login(cookie, callback = null) {
    let logArg = { app: this.SERVICE_NAME };
    const cookies = this.cookies(cookie);

    if (_.isEmpty(cookies)) {
      if (this.accounts.userId()) {
        this.logger.info("No cookie found: logging out.");
        this.logout();
      }
      else {
        this.logger.warn(Object.assign(logArg, { message: "No cookie found, not trying to login." }));
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
  }

  /**
   * An optional helper to log out.
   *
   * @returns {void}
   */
  logout() {
    this.accounts.logout();
  }

  initStateMethod() {
    Log.info("Client stub for initStateMethod, doing nothing.");
    return this.getDefaultUser();
  }

  registerHelpers() {
    const helpers = [
      { name: "accountsDrupalUserId", code: () => client.uid },
      { name: "accountsDrupalUsername", code: () => client.name },
      { name: "accountsDrupalRoles", code: () => client.roles }
    ];

    helpers.forEach(({ name, code }) => this.template.registerHelper(name, code));
  }

  /**
   * Call the Drupal whoami service.
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
    this.logger.info(`Client stub for whoamiMehod(${cookieName}, ${cookieValue}), returning default user.`);
    return this.getDefaultUser();
  }

  get uid() {
    const user = this.user();
    const uid = user ? user.profile[client.SERVICE_NAME].uid : 0;
    return uid;
  }

  get name() {
    const user = this.user();
    const name = user ? user.username : this.state.anonymousName;
    return name;
  }

  get roles() {
    const user = this.user();
    const roles = user ? this.user().profile[this.SERVICE_NAME].roles : ["anonymous user"];
    return roles;
  }
};
