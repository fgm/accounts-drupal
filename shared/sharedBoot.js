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

Log.info('Shared post-boot');

drupal = new Drupal(Accounts, Meteor, Log);
drupal.client = Meteor.isClient ? client : null;
drupal.server = Meteor.isServer ? server : null;
