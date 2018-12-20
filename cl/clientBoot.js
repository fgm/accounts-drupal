/**
 * @file
 *   Contains accounts-drupal client code.
 *
 * - Meteor.loginWithDrupal([options, ]callback)
 */

import { DrupalClient } from "./DrupalClient";

Log.debug('Client boot');

const clientBoot = (
  template,
  accounts,
  meteor,
  logger,
  match,
  stream,
  random,
) => new DrupalClient(
  // Meteor runtime.
  accounts,
  meteor,
  logger,
  match,

  // rocketchat:streamer
  stream,

  template,
  random,
);

const onLoginFactory = (client) => {
  return callback => client.login(document.cookie, callback);
};

export {
  clientBoot,
  onLoginFactory,
}
