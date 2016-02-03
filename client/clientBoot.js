/**
 * @file
 *   Contains accounts-drupal client code.
 *
 * - Meteor.loginWithDrupal([options, ]callback)
 */

Meteor._debug('Client boot');

// Client is package-global but not exported.
client = new DrupalClient(Accounts);

Meteor.loginWithDrupal = client.login;
