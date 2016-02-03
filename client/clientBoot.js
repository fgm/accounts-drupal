/**
 * @file
 *   Contains accounts-drupal client code.
 *
 * - Meteor.loginWithDrupal([options, ]callback)
 */

drupal.client = new DrupalClient(Accounts);

Meteor.loginWithDrupal = drupal.client.login;
