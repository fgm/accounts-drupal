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
   * @param {String} streamName
   *   The name of the stream used for SSO notifications.
   */
  constructor(accounts, meteor, logger, streamName) {
    super(accounts, meteor, logger, streamName);
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
};
