/**
 * @file
 *   Server-side non-object code
 */

Meteor._debug('server boot');

drupal.server = new DrupalServer();

Meteor.methods({
  "drupal.login": drupal.server.login
});
