/**
 * @file
 *   Contains the DrupalServer class.
 */

import nodeUrl from 'url';
import util from 'util';

import { DrupalBase } from '../shared/DrupalBase';

/**
 * A class providing the mechanisms for the "drupal" accounts service.
 *
 * @type {DrupalServer}
 */
class DrupalServer extends DrupalBase {

  /**
   * Constructor.
   *
   * @param {AccountsServer} accounts
   *   The AccountsServer service.
   * @param {Meteor} meteor
   *   The Meteor global.
   * @param {Log} logger
   *   The Meteor Log service.
   * @param {IMatch} match
   *   The Meteor check matcher service.
   * @param {WebApp} webapp
   *   The Meteor webapp service.
   * @param {Streamer} stream
   *   The stream used by the package.
   * @param {ServiceConfiguration} configuration
   *   The ServiceConfiguration service.
   * @param {IHTTP} http
   *   The HTTP service.
   * @param {JSON} json
   *   The JSON service.
   *
   * @returns {DrupalServer}
   *   An unconfigured service instance.
   */
  constructor(accounts, meteor, logger, match, webapp, stream, configuration, http, json) {
    super(meteor, logger, match, stream);
    this.accounts = accounts;
    this.webapp = webapp;
    this.updatesCollection = this.getCollection(meteor);
    this.usersCollection = meteor.users;
    this.configuration = configuration;
    this.http = http;
    this.json = json;
    this.settings.server = {};

    this.setupUpdatesObserver();

    // - Merge Meteor settings to instance.
    Object.assign(this.settings.server, meteor.settings[this.SERVICE_NAME]);
    Object.assign(this.settings.client, meteor.settings.public[this.SERVICE_NAME]);

    // - Initialize Drupal-dependent state.
    this.state = this.initStateMethod(true);
    if (this.state.online === true) {
      logger.debug('Retrieved Drupal site information.');
    }
    else {
      throw new meteor.Error('init-state', `Could not reach Drupal server at ${this.settings.server.site}.`);
    }
  }

  /**
   * Check a condition and if it fails, build a loginResult failure.
   *
   * @param {boolean} condition
   *   The condition to check.
   * @param {string} message
   *   The message for failure cases.
   * @param {boolean} notify
   *   Log a fail result.
   *
   * @returns {Object|boolean}
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
      if (notify) {
        this.logger.warn(`${this.SERVICE_NAME}: ${message}`);
      }
    }

    return loginFailure;
  }

  /**
   * Return the list of onProfile fields available on Meteor.user().
   *
   * This is invoked only if autopublish is enabled.
   *
   * @returns {Object}
   *   An object with up to two keys:
   *   - Key forLoggedInUsers: an array of fields published to the current user.
   *   - Key forOtherUsers: an array of fields published to other users.
   */
  autopublishFields() {
    const allFields = `services.${this.SERVICE_NAME}`;
    const publicFields = `${allFields}.public`;

    const fields = {
      forLoggedInUser: [allFields],
      forOtherUsers: [publicFields]
    };

    return fields;
  }

  /**
   * Emit a SSO event on the SSO stream.
   *
   * @param {string} action
   *   The action to perform. Currently only valid value is "login".
   * @param {number} userId
   *   The integer user id to filter on, or 0 for any user.
   *
   * @returns {undefined}
   */
  emit(action, userId = 0) {
    const totalSubscriptionCount = this.stream.subscriptions.length;
    const eventSubscriptions = this.stream.subscriptionsByEventName[this.EVENT_NAME];
    const eventSubscriptionCount = eventSubscriptions ? eventSubscriptions.length : 0;
    this.logger.info(`Emitting ${action}(${userId}) to ${eventSubscriptionCount} subscription for ${this.EVENT_NAME}, out of ${totalSubscriptionCount} overall subscriptions\n`);
    this.stream.emit(this.EVENT_NAME, action, userId);
  }

  /**
   * Return the collection used for updates.
   *
   * @param {Meteor} meteor
   *   The Meteor service.
   *
   * @returns {Mongo.Collection|Meteor.Collection|*}
   *   The updates collection.
   */
  getCollection(meteor) {
    const rawName = `${DrupalServer.SERVICE_NAME}_updates`;
    const name = rawName.replace('-', '_');
    const collection = new meteor.Collection(name);
    return collection;
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
      throw new Meteor.Error('service-unconfigured', 'The service needs to be configured');
    }
    const defaultRootFields = [
      // From accounts-base.
      'profile',

      // From accounts-password with accounts-base support.
      'username', 'emails'

      // Any other names would only appear with autopublish enabled.
    ];
    const result = _.intersection(defaultRootFields, this.configuration.rootFields);
    return result;
  }

  /**
   * Parse a cookie blob for value of the relevant session cookie.
   *
   * @param {string} cookieBlob
   *   A JavaScript standard cookie string.
   *
   * @returns {undefined}
   */
  getSessionCookie(cookieBlob) {
    let homogeneousCookieBlob = '; ' + cookieBlob;

    let cookieName = this.state.cookieName;
    let cookieValue;
    let cookies = homogeneousCookieBlob.split(`; ${cookieName}=`);

    if (cookies.length === 2) {
      cookieValue = cookies.pop().split(';').shift();
    }

    return cookieValue;
  }

  /**
   * The controller for the web route used to notify the package about changes.
   *
   * @param {IncomingMessage} req
   *   The request object.
   * @param {ServerResponse} res
   *   The response object.
   *
   * @returns {undefined}
   */
  handleUserEvent(req, res) {
    res.writeHead(200);
    res.end('Sent refresh request');

    const remote = req.socket.remoteAddress;
    // The url property on IncomingMessage only contains the unmatched part.
    const parsed = nodeUrl.parse(req.url, true);
    const query = util.inspect(parsed.query);
    this.logger.info(`Received user event from ${remote}: ${parsed.pathname} with query ${query}`);
    this.storeUpdateRequest(req.query, req.socket.remoteAddress);
  }

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
   * @returns {Object} The result of a login request
   *   - Undefined if the package does not handle this request.
   *   - False if the package rejects the request.
   *   - A result object containing the user information in case of login success.
   */
  loginHandler(loginRequest) {
    // A login request goes through all these handlers to find its login handler.
    // So in our login handler, we only consider login requests which have an
    // field matching our service name, i.e. "fake". To avoid false positives,
    // any login package will only look for login request information under its
    // own service name, returning undefined otherwise.
    const cookies = loginRequest[this.SERVICE_NAME];
    let loginResult = this.loginCheck(cookies, `Login not handled by ${this.SERVICE_NAME}.`, false);
    if (loginResult) {
      return loginResult;
    }

    this.logger.debug({
      app: this.SERVICE_NAME,
      message: `${this.SERVICE_NAME} login attempt`,
      cookies,
    });

    // Shortcut: avoid WS call if Drupal is not available.
    loginResult = this.loginCheck(this.state.online, 'Drupal server is not online.', true);
    if (loginResult) {
      return loginResult;
    }

    // Shortcut: avoid WS call if cookie name is not the expected one.
    const cookieName = this.state.cookieName;
    const cookieValue = cookies[cookieName];
    loginResult = this.loginCheck(cookieValue, 'No cookie matches Drupal session name.', false);
    if (loginResult) {
      return loginResult;
    }

    // Shortcut: avoid WS call if cookie value is malformed.
    // Never forget to check tainted data like these.
    const cookieIsPlausible = this.checkCookie(cookieName, cookieValue);
    loginResult = this.loginCheck(cookieIsPlausible, 'Malformed session cookie', false);
    if (loginResult) {
      return loginResult;
    }

    // Perform the actual web service call. Exceptions are caught and return
    // an anonymous user information.
    const userInfo = this.whoamiMethod(cookieName, cookieValue);

    // Use our ever-so-sophisticated authentication logic.
    loginResult = this.loginCheck(userInfo.uid, 'Session was not logged on Drupal.');
    if (loginResult) {
      return loginResult;
    }

    this.logger.debug({
      app: this.SERVICE_NAME,
      message: `Login succeeded for user "${userInfo.name} (${userInfo.uid}). Roles: ` + this.json.stringify(userInfo.roles)
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
      onlyWithAutopublish: 'only with autopublish'
    };
    userOptions.profile[this.SERVICE_NAME] = serviceData.onProfile;
    return this.accounts.updateOrCreateUserFromExternalService(this.SERVICE_NAME, serviceData, userOptions);
  }

  /**
   * Register service as an accounts service.
   *
   * - Register service as a login handler.
   * - Override the default user creation hook.
   *
   * @see AccountsServer._initServerPublications()
   *
   * @returns {undefined}
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
   * @returns {undefined}
   */
  registerAutopublish() {
    this.accounts.addAutopublishFields(this.autopublishFields());
  }

  registerWebRoute() {
    // This path must match the one in Drupal module at meteor/src/Notifier::PATH.
    this.webapp.connectHandlers.use('/drupalUserEvent', this.handleUserEvent.bind(this));
  }

  /**
   * Update Drupal-side information.
   *
   * This method can be used as a Drupal method (hence its name), but the
   * default logic does not require it.
   *
   * @param {boolean} refresh
   *   Perform a Drupal WS call if true, otherwise use the instance information.
   *
   * @returns {Object}
   *   - Key cookieName: the name of the session cookie used by the site.
   *   - Key anonymousName: the name of the anonymous user to use when not logged in.
   *   - Key online: site was available at last check.
   */
  initStateMethod(refresh = false) {
    if (!refresh) {
      return this.state;
    }

    let site = this.settings.server.site;

    const defaultOptions = {
      params: {
        appToken: this.settings.server.appToken
      }
    };
    const settingsOptions = this.settings.server.site_options;
    let options = Object.assign(defaultOptions, settingsOptions);

    let info = {};
    try {
      let ret = this.http.get(site + '/meteor/siteInfo', options);
      info = this.json.parse(ret.content);
      info.online = true;
    }
    catch (err) {
      info = {
        anonymousName: this.settings.server.anonymousName,
        cookieName: null,
        online: false
      };
      this.logger.error(err);
    }

    return info;
  }

  /**
   * Handle collection change events.
   *
   * @param {string} changeType
   *   The change type: added, changed.
   * @param {Object} doc
   *   An affected documents.
   *
   * @returns {undefined}
   */
  observe(changeType, doc) {
    if (changeType !== 'added') {
      return;
    }

    switch (doc.event) {
      case 'user_delete':
      case 'user_logout':
      case 'user_update':
        // Affected clients will logout automatically:
        // - On delete and logout, they will not be able to login again, so
        //   they do not need to be notified: any attempts at logging in because
        //   of auto-login would fail anyway.
        // - On updates, they will just re-login to update their profile.
        this.userDelete(doc.userId);
        break;

      case 'user_login':
        // Any not-yet logged-in user may be able to login if the browser is the
        // same as the one which just logged in. Logged-in users are not
        // affected, since Drupal does not re-log logged-in users.
        this.emit('anonymous');
        break;

      case 'field_delete':
      case 'field_insert':
      case 'field_update':
      case 'entity_field_update':
        // These are structural changes, so any logged-in user needs to refresh
        // its information. Non-logged-in users don't have any, so they are not
        // affected.
        this.emit('authenticated');
        break;

      default:
        this.logger.warn(`Observed unsupported event type ${doc.event}`);
        break;
    }
  }

  /**
   * Set up the updates notification mechanism.
   *
   * - Initialize the TTL index on the package updates collection
   * - Observe it.
   *
   * @returns {undefined}
   */
  setupUpdatesObserver() {
    this.updatesCollection._ensureIndex({ createdAt: 1 }, { expireAfterSeconds: 300 });
    this.updatesCollection.find({}).observe({
      added: (docs) => { this.observe('added', docs); },
      changed: (docs) => { this.observe('changed', docs); }
    });
  }

  /**
   * Store a user update request to the DB.
   *
   * @param {Object} rawQuery
   *   Used keys:
   *   - {int} userId: the Drupal user id
   *   - {string} eventName: the name of the event
   *     - "user_delete", "user_login", "user_logout", "user_update",
   *     - "field_delete", "field_insert", "field_update",
   *     - "entity_field_update"
   *   - {int} delay: the delay to wait before inserting the event, in msec.
   * @param {string} remoteAddress
   *   The address of the HTTP client (or proxy).
   *
   * @returns {undefined}
   *
   * @see \Drupal\meteor\IdentityListener::__destruct()
   *
   * TODO handle proxies.
   */
  storeUpdateRequest(rawQuery, remoteAddress) {
    const index = this.settings.server.updaters.indexOf(remoteAddress);
    if (index === -1) {
      this.logger.error('Update request from disallowed address, ignored.', {
        remoteAddress,
      });
      return;
    }

    const DEFAULT_DELAY = 1000;

    const query = rawQuery || {};
    const event = String(query.event);
    const userId = parseInt(query.userId, 10) || 0;

    // If there is any kind of delay ensure it is a strictly positive integer.
    let usDelay = query.delay;
    const delay = (typeof usDelay !== 'undefined')
      ? parseInt(usDelay, 10) || DEFAULT_DELAY
      : 0;

    const validEvents = [
      // Drupal 8 user hooks.
      'user_delete', 'user_login', 'user_logout', 'user_update',

      // Drupal 8 field hooks.
      'field_delete', 'field_insert', 'field_update',

      // A synthetic event for all entity_type and field_storage events
      // caught by the IdentityListener instead of the hooks.
      'entity_field_update'
    ];

    if (validEvents.indexOf(query.event) === -1) {
      this.logger.warn('Invalid update request, ignored.', {
        delay,
        event,
        userId
      });
      return;
    }
    const update = {
      createdAt: new Date(),
      delay,
      event,
      userId
    };
    this.logger.debug('Storing update', update);
    // Always use a timeout: it will be 0.
    Meteor.setTimeout(() => {
      update.insertedAt = new Date();
      this.updatesCollection.insert(update);
    }, delay);
  }

  /**
   * Delete user by id.
   *
   * @param {number} rawUserId
   *   The Drupal uid for the user.
   *
   * @returns {undefined}
   */
  userDelete(rawUserId) {
    const userId = parseInt(rawUserId, 10);
    this.usersCollection.remove({
      'services.accounts-drupal.public.uid': userId
    });
    this.logger.info(`User ${userId} was deleted.`);
  }

  /**
   * Call the Drupal whoami service.
   *
   * @param {string} cookieName
   *   The cookie name.
   * @param {string} cookieValue
   *   The cookie value. May be null.
   *
   * @returns {Object}
   *   - Key uid: a Drupal user id, 0 if not logged on Drupal
   *   - Key name: a Drupal user name, defaulting to the settings-defined anonymous.
   *   - Key roles: an array of role names, possibly empty.
   */
  whoamiMethod(cookieName, cookieValue) {
    const url = this.settings.server.site + '/meteor/whoami';
    const settingsOptions = this.settings.server.site_options;
    const defaultOptions = {
      headers: {
        'accept': 'application/json',
        'cookie': cookieName + '=' + cookieValue
      },
      timeout: 10000,
      time: true
    };
    let options = Object.assign(defaultOptions, settingsOptions);
    let info;

    this.logger.debug(`Checking ${cookieName}=${cookieValue} on ${url}.`);
    let t0 = +new Date();
    let t1 = t0;
    try {
      let ret = this.http.get(url, options);
      t1 = +new Date();
      info = this.json.parse(ret.content);
      info.uid = parseInt(info.uid, 10);
      this.logger.info(`Whoami success in ${t1 - t0} msec: ${this.json.stringify(info)}.`);
    }
    catch (err) {
      info = {
        'uid': 0,
        'name': this.state.anonymousName,
        'roles': []
      };
      t1 = +new Date();
      this.logger.error(`Whoami error in ${t1 - t0} msec: ${err.message}.`);
    }

    return info;
  }

}

export {
  DrupalServer,
};
