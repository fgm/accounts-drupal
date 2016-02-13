/**
 * @file
 *   Contains accounts-drupal client code.
 *
 * - Meteor.loginWithDrupal([options, ]callback)
 */

Log.debug('Client boot');

// Client is package-global but not exported.
client = new DrupalClient(Accounts, Meteor, Log, stream);

/**
 * Need to wrap client.login in a closure to avoid overwriting this in login().
 *
 * @param args
 */
Meteor.loginWithDrupal = function () {
  return client.login(document.cookie);
};
