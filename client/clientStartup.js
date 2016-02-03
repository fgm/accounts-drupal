/**
 * @file
 *   Client-side startup code.
 */

Meteor.startup(function () {
  Meteor._debug("client startup", arguments);
  DrupalShared.client = new DrupalClient();
});
