/**
 * @file
 *   Contains accounts-drupal client code.
 *
 * - Meteor.loginWithDrupal([options, ]callback)
 */

Log.debug("Client boot");

// Client is package-global but not exported.
client = new DrupalClient(Accounts, Meteor, Log, Match, stream, Template);

/**
 * Need to wrap client.login in a closure to avoid overwriting this in login().
 *
 * @return {void}
 */
Meteor.loginWithDrupal = function () {
  client.login(document.cookie);
};
