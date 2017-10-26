/**
 * @file
 *   Shared non-object initial code.
 *
 * On the server side, an accounts package basically performs these tasks:
 *
 * - it exposes additional fields on Meteor.user() for autopublish
 * - it registers as a login handler with a given service name
 * - it publishes its runtime service configuration
 */

Log.debug('Shared post-boot');

if (typeof client === 'undefined') {
  client = null;
}
if (typeof server === 'undefined') {
  server = null;
}

drupal = new Drupal(Meteor, Log, client, server);
