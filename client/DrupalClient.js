/**
 * @file
 *   Contains the DrupalClient class.
 */

Meteor._debug("Defining DrupalClient");

/**
 * The client-side class for the package.
 *
 * @type {DrupalClient}
 */
DrupalClient = class DrupalClient extends DrupalBase {
  constructor(accounts) {
    super(accounts);
  }

  login (arg1, arg2) {
    let options;
    let callback;
    // Support a callback without options.
    if (!arg2 && typeof arg1 === "function") {
      callback = arg1;
      options = [];
    }
    else {
      options = arg1;
      callback = arg2;
    }

    // Other options:
    // - methodName: "login"
    // - suppressLoggingIn: false
    this.accounts.callLoginMethod({
      methodArguments: [{ "drupal": options }],
      userCallback: callback
    });
  };
};
