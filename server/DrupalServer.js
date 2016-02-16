
/**
 * @file
 *   Contains the DrupalServer class.
 */

Log.debug("Defining server/DrupalServer");

/**
 * A class providing the mechanisms for the "drupal" accounts service.
 *
 * @type {DrupalServer}
 */
DrupalServer = class DrupalServer extends DrupalBase {
  /**
   * Constructor.
   *
   * @param {AccountsServer} accounts
   *   The AccountsServer service.
   * @param {Meteor} meteor
   *   The Meteor global.
   * @param {Log} logger
   *   the Meteor Log service.
   * @param {Stream} stream
   *   The stream used by the package.
   * @param {ServiceConfiguration} configuration
   *   The ServiceConfiguration service.
   *
   * @returns {DrupalServer}
   *   An unconfigured service instance.
   */
  constructor(accounts, meteor, logger, stream, configuration) {
    super(accounts, meteor, logger, stream);
    this.configuration = configuration;
    this.settings.server = {};

    // - Merge Meteor settings to instance.
    Object.assign(this.settings.server, meteor.settings[DrupalBase.SERVICE_NAME]);
    Object.assign(this.settings.client, meteor.settings.public[DrupalBase.SERVICE_NAME]);

    // - Initialize Drupal-dependent state.
    this.state = this.initStateMethod(true);
    if (this.state.online === true) {
      Log.info("Retrieved Drupal site information.");
    }
    else {
      throw new meteor.Error('init-state', "Could not reach Drupal server.");
    }
  }

  /**
   * Check a condition and if it fails, build a loginResult failure.
   *
   * @param {Boolean} condition
   *   The condition to check.
   * @param {String} message
   *   The message for failure cases.
   * @param {Boolean} notify
   *   Log a fail result.
   *
   * @returns {Object|false}
   *   - If the condition is false, a failing login result object.
   *   - Otherwise, false.
   */
  loginCheck(condition, message, notify = true) {
    let loginFailure = false;
    if (!condition) {
      loginFailure = {
        app: this.SERVICE_NAME,
        error: new Meteor.Error(message)
      };
      notify && this.logger.warn(loginFailure);
    }

  return loginFailure;
}

  /**
   * Return the list of onProfile fields available on Meteor.user().
   *
   * This is invoked only if autopublish is enabled.
   *
   * @return {Object}
   *   An object with up to two keys:
   *   - forLoggedInUsers: an array of fields published to the current user
   *   - forOtherUsers: an array of fields published to other users
   */
  autopublishFields() {
    const rootFields = this.getRootFields();

    const allFields = ["services." + this.SERVICE_NAME];
    const publicFields = [allFields + ".public"];

    const fields = {
      forLoggedInUser: rootFields.concat(allFields),
      forOtherUsers: rootFields.concat(publicFields)
    };

    return fields;
  }

  /**
   * Emit a SSO event on the SSO stream.
   *
   * @returns {void}
   */
  emit() {
    this.stream.emit(this.EVENT_NAME);
  }

  /**
   * Provides the sanitized list of fields to expose at the root of a user object.
   *
   * Needs configuration.
   *
   * @returns {Array}
   *   An array of field names.
   */
  getRootFields() {
    if (!this.configuration) {
      throw new Meteor.Error("service-unconfigured", "The service needs to be configured");
    }
    const defaultRootFields = [
      // From accounts-base.
      "profile",

      // From accounts-password with accounts-base support.
      "username", "emails"

      // Any other names would only appear with autopublish enabled.
    ];
    const result = _.intersection(defaultRootFields, this.configuration.rootFields);
    return result;
  }

  /**
   * Parse a cookie blob for value of the relevant session cookie.
   *
   * @param {string} cookieBlob
   * @returns {undefined}
   */
  getSessionCookie(cookieBlob) {
    cookieBlob = '; ' + cookieBlob;

    var cookieName = this.state.cookieName;
    var cookieValue;
    var cookies = cookieBlob.split('; ' + cookieName + "=");

    if (cookies.length == 2) {
      cookieValue = cookies.pop().split(';').shift();
    }

    return cookieValue;
  };

  /**
   * A replacement for the default user creation hook.
   *
   * @param {Object} options
   *   A hash of properties to inject into the raw user object to complete it.
   * @param {Object} user
   *   A raw user object from the login process.
   *
   * @returns {Object}
   *   A full user object.
   */
  hookUserCreate(options, user) {
    /* Inject our custom fields:
     * - profile from the accounts-base default
     * - username and emails from accounts-password with builtin support in -base
     * - our own extra fields, which will be saved, but only exposed with autopublish
     */
    const rootFields = this.getRootFields();
    rootFields.forEach(function (property) {
      if (options[property]) {
        user[property] = options[property];
      }
    });
    return user;
  }

  /**
   * The drupal login handler.
   *
   * @param {Object} loginRequest
   *   The login request passed by Meteor. It will be of interest to the package
   *   only if it contains a key named after the package.
   *
   * @return {Object} The result of a login request
   *   - Undefined if the package does not handle this request.
   *   - False if the package rejects the request.
   *   - A result object containing the user information in case of login success.
   */
  loginHandler(loginRequest) {
    let loginResult;
    const NAME = this.SERVICE_NAME;

    // A login request goes through all these handlers to find its login handler.
    // So in our login handler, we only consider login requests which have an
    // field matching our service name, i.e. "fake". To avoid false positives,
    // any login package will only look for login request information under its
    // own service name, returning undefined otherwise.
    const cookies = loginRequest[NAME];
    if (loginResult = this.loginCheck(cookies, "Login not handled.", false)) {
      return loginResult;
    }

    this.logger.info({
      app: NAME,
      message: "Drupal login attempt",
      cookies
    });

    // Shortcut: avoid WS call if Drupal is not available.
    if (loginResult = this.loginCheck(this.state.online, "Drupal server is not online.")) {
      return loginResult;
    }

    // Shortcut: avoid WS call if cookie name is not the expected one.
    const cookieName = this.state.cookieName;
    const cookieValue = cookies[cookieName];
    if (loginResult = this.loginCheck(cookieValue, "No cookie matches Drupal session name.")) {
      return loginResult;
    }

    // Shortcut: avoid WS call if cookie value is malformed.
    try {
      // Never forget to check tainted data like these.
      this.checkCookie(cookieName, cookieValue);
    }
    catch (e) {
      let expectedException = e instanceof Match.Error;
      if (loginResult = this.loginCheck(expectedException, "Malformed session cookie")) {
        return loginResult;
      }
      throw e;
    }

    // Perform the actual web service call. Exceptions are caught and return
    // an anonymous user information.
    const userInfo = this.whoamiMethod(cookieName, cookieValue);

    // Use our ever-so-sophisticated authentication logic.
    if (loginResult = this.loginCheck(userInfo.uid, "Session was not logged on Drupal.")) {
      return loginResult;
    }

    this.logger.info({
      app: NAME,
      message: `Login succeeded for user "${userInfo.name} (${userInfo.uid}). Roles: ` + JSON.stringify(userInfo.roles)
    });

    // In case of success, normalize the user id to lower case: MongoDB does not
    // support an efficient case-insensitive find().
    const submittedUserId = userInfo.name.toLocaleLowerCase();

    // Return a user
    // TODO configure what goes to public/onProfile/offProfile in settings.
    const serviceData = {
      id: submittedUserId,
      public: userInfo,
      onProfile: userInfo,
      offProfile: userInfo
    };

    // Publish part of the package-specific user information.
    const userOptions = {
      // Profile, username, and emails are published by _initServerPublications(,
      // so we can inject them if we so desire.
      profile: {},
      username: submittedUserId,
      emails: [],
      // But no other field is published unless autopublish is on.
      onlyWithAutopublish: "only with autopublish"
    };
    userOptions.profile[NAME] = serviceData.onProfile;

    return this.accounts.updateOrCreateUserFromExternalService(NAME, serviceData, userOptions);
  }

  /**
   * Register service as an accounts service.
   *
   * - Register service as a login handler.
   * - Override the default user creation hook.
   *
   * @see AccountsServer._initServerPublications()
   *
   * @returns {void}
   */
  register() {
    let that = this;
    that.accounts.registerLoginHandler(that.SERVICE_NAME, function (loginRequest) {
      return that.loginHandler(loginRequest);
    });
    that.accounts.onCreateUser(function (options, user) {
      return that.hookUserCreate(options, user);
    });
  }

  /**
   * Autopublish custom fields on startup, based on configuration.
   *
   * @returns {void}
   */
  registerAutopublish() {
    this.accounts.addAutopublishFields(this.autopublishFields());
  }

  /**
   * Update Drupal-side information.
   *
   * This method can be used as a Drupal method (hence its name), but the
   * default logic does not require it.
   *
   * @param {Boolean} refresh
   *   Perform a Drupal WS call if true, otherwise use the instance information.
   *
   * @returns {Object}
   *   - cookieName: the name of the session cookie used by the site.
   *   - anonymousName: the name of the anonymous user to use when not logged in.
   *   - online: site was available at last check.
   */
  initStateMethod(refresh = false) {
    if (!refresh) {
      return this.state;
    }

    var site = this.settings.server.site;

    var options = {
      params: {
        appToken: this.settings.server.appToken
      }
    };

    let info;
    try {
      var ret = HTTP.get(site + "/meteor/siteInfo", options);
      info = JSON.parse(ret.content);
      info.online = true;
    }
    catch (err) {
      info = {
        anonymousName: this.settings.server.anonymousName,
        cookieName: undefined,
        online: false
      };
      this.logger.error(err);
    }

    return info;
  }

  /**
   * Call the Drupal whoami service.
   *
   * @param {String} cookieName
   * @param {String} cookieValue
   *
   * @returns {Object}
   *   - uid: a Drupal user id, 0 if not logged on Drupal
   *   - name: a Drupal user name, defaulting to the settings-defined anonymous.
   *   - roles: an array of role names, possibly empty.
   */
  whoamiMethod(cookieName, cookieValue) {
    var url = this.settings.server.site + "/meteor/whoami";
    var options = {
      headers: {
        'accept': 'application/json',
        'cookie': cookieName + '=' + cookieValue
      },
      timeout: 10000,
      time: true
    };
    this.logger.info('Checking ' + cookieName + "=" + cookieValue + ' on ' + url);
    let t0 = + new Date();
    let t1 = t0;
    try {
      var ret = HTTP.get(url, options);
      t1 = + new Date();
      info = JSON.parse(ret.content);
      this.logger.info("Success: " + (t1 - t0) + " msec later: " + JSON.stringify(info));
    }
    catch (err) {
      info = {
        'uid': 0,
        'name': this.state.anonymousName,
        'roles': []
      };
      t1 = + new Date();
      this.logger.error("Error: " + err.message + " in " + (t1 - t0) + " msec");
    }

    return info;
  }
};
