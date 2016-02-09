
Log.info("Defining shared/DrupalSSO");

DrupalSSO = class DrupalSSO {
  /**
   * The SSO constructor.
   *
   * Notice that the returned SSO instance has asynchronous behavior: its state
   * component will only be initialized once the server callback has returned,
   * which will almost always be some milliseconds after the instance itself is
   * returned: check sso.state.online to ensure the connection attempts is done:
   * - undefined -> not yet
   * -> false -> failed, values are defaults,
   * -> true -> succeeded,valuers are those provided by the server.
   *
   * @returns {DrupalSSO}
   * @constructor
   */
  constructor(stream) {
    this.stream = stream;

    this.settings = {
      client: {}
    };

    this.state = {
      anonymousName: 'anome',
      cookieName: 'SESS___4___8__12__16__20__24__28__32',
      // Online is only set once the initialization has completed.
      online: undefined
    };

    this.user = {
      uid: 0,
      name: 'undefined name',
      roles: ['anonymous user']
    };

    this.userDep = new Tracker.Dependency();

    // - Merge public settings to instance.
    Object.assign(this.settings.client, Meteor.settings.public);

    // - Initialize server-dependent state.
    Meteor.call('drupal-sso.initState', function (err, res) {
      if (err) {
        throw new Meteor.Error('init-state', err);
      }
      Object.assign(this.state, res);
      if (Meteor.isClient) {
        this.updateUser(document.cookie);
      }
    });
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
   * Update the user information from the Drupal server based on the cookies.
   *
   * @param {string} cookies
   */
  updateUser(cookies) {
    if (Meteor.isClient) {
      Meteor._debug('Setting up once on ' + this.CHANNEL_NAME);
      // Just listen once, since we rearm immediately.
      this.stream.once(this.EVENT_NAME, (e) => {
        // In fat-arrow functions, "this" is not redefined.
        this.updateUser(document.cookie);
      });
    }
    Meteor.call('drupal-sso.whoami', cookies, function (err, res) {
      if (err) {
        throw new Meteor.Error('whoami', err);
      }

      _.extend(user, res);
      userDep.changed();11
    });
  };

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
   * Initialize the server-only part of the SSO settings.
   *
   * This method needs to be invoked on the server-side SSO instance: it cannot
   * be invoked during construction, because the instance is not yet ready.
   *
   * @param {Object} settings
   */
  initServerState(settings) {
    this.settings['drupal-sso'] = settings['drupal-sso'];
  };

  /**
   * Parse Meteor settings to initialize the SSO state from the server.
   */
  static initStateMethod() {
    var settings = Meteor.settings['drupal-sso'];
    var site = settings.site;
    var appToken = settings.appToken;

    if (!settings) {
      throw new Meteor.Error('invalid-settings', "Invalid settings: 'drupal-sso' key not found.");
    }
    if (!site) {
      throw new Meteor.Error('invalid-settings', "Invalid settings: 'drupal-sso.site' key not found.");
    }
    if (!appToken) {
      throw new Meteor.Error('invalid-settings', "Invalid settings: 'drupal-sso.appToken' key not found.");
    }

    var options = {
      params: {
        appToken: settings.appToken
      }
    };
    try {
      var ret = HTTP.get(site + "/meteor/siteInfo", options);
      info = JSON.parse(ret.content);
      info.online = true;
    }
    catch (err) {
      info = {
        cookieName: undefined,
        anonymousName: undefined,
        online: false
      };
      Meteor._debug("Error: ", err);
    }
    return info;
  }

  /**
   * Call the Drupal whoami service.
   *
   * @param {string} cookieBlob
   * @returns {*}
   */
  static whoamiMethod(cookieBlob) {
    // sso is a package global, initialized in server/sso.js Meteor.startup().
    var cookieName = sso.state.cookieName;
    var cookieValue = sso.getSessionCookie(cookieBlob);
    var url = sso.settings['drupal-sso'].site + "/meteor/whoami";
    var options = {
      headers: {
        'accept': 'application/json',
        'cookie': cookieName + '=' + cookieValue
      },
      timeout: 10000,
      time: true
    };
    Meteor._debug('Checking ' + cookieName + "=" + cookieValue + ' on ' + url);
    var t0, t1;
    try {
      t0 = (new Date()).getTime();
      var ret = HTTP.get(url, options);
      t1 = (new Date()).getTime();
      info = JSON.parse(ret.content);
      t2 = (new Date()).getTime();
      Meteor._debug("Success: ", t1 - t0, "msec later:", info);
    }
    catch (err) {
      info = {
        'uid': 0,
        'name': 'Unresolved',
        'roles': []
      };
      t1 = (new Date()).getTime();
      Meteor._debug("Error: ", err, " in ", t1 - t0, "msec");
    }

    return info;
  }

  get CHANNEL_NAME() {
    return "drupal-sso:refresh";
  }

  static get CHANNEL_NAME() {
    return "drupal-sso:refresh";
  }

  get EVENT_NAME() {
    return "drupal-sso:userRefresh";
  }

  static get EVENT_NAME() {
    return "drupal-sso:userRefresh";
  }
};
