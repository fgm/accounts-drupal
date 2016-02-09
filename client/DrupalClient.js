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
   *   the Meteor Log service.
   */
  constructor(accounts, meteor, logger) {
    super(accounts, meteor, logger);
  }

  /**
   * The method to use to perform login.
   *
   * @param arg1
   * @param arg2
   *
   * @return {void}
   */
  login (arg1, arg2) {
    let options;
    let userCallback;
    // Support login(callback).
    if (!arg2 && typeof arg1 === "function") {
      userCallback = arg1;
      options = [];
    }
    // Support login(options, callback).
    else {
      options = arg1;
      userCallback = arg2;
    }

    let methodArgument = {};
    methodArgument[this.SERVICE_NAME] = options;

    // Other available arguments:
    // - methodName: default = "login"
    // - suppressLoggingIn: default = false
    let methodArguments = [methodArgument];
    this.accounts.callLoginMethod({
      methodArguments,
      userCallback: (err, res) => {
        if (err) {
          this.logger.warn({
            app: this.SERVICE_NAME,
            message: `Login failed for user "${options.user}.`
          });
        }
        else {
          this.logger.info({
            app: this.SERVICE_NAME,
            message: `Login succeeded for user "${options.user}.`
          });
        }
        if (_.isFunction(userCallback)) {
          userCallback(err, res);
        }
      }
    });
  };
};
