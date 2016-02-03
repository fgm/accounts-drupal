/**
 * @file
 *   Contains accounts-drupal client code.
 *
 * - Meteor.loginWithDrupal([options, ]callback)
 */

Meteor._debug('Client boot');

// Client is package-global but not exported.
client = new DrupalClient(Accounts);

/**
 * Need to wrap client.login in a closure to avoid overwriting this in login().
 *
 * @param args
 */
Meteor.loginWithDrupal = function (...args) {
  return client.login(...args);
};
