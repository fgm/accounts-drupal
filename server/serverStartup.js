/**
 * @file
 *   Server-side startup code.
 */

Meteor.startup(function () {
  Meteor._debug("server startup", arguments);
  DrupalShared.server = new DrupalServer();
});
