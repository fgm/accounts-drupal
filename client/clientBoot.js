/**
 * @file
 *   Contains accounts-drupal client code.
 *
 * - Meteor.loginWithDrupal([options, ]callback)
 */

Log.info('Client boot');

// Client is package-global but not exported.
client = new DrupalClient(Accounts, Meteor, Log, DrupalSSO.CHANNEL_NAME);

/**
 * Need to wrap client.login in a closure to avoid overwriting this in login().
 *
 * @param args
 */
Meteor.loginWithDrupal = function (...args) {
  return client.login(...args);
};
