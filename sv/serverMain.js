/**
 * @file
 *   Main server-side module for accounts-drupal.
 *
 *  On the server side, this accounts package basically performs these tasks:
 *
 * - it exposes additional fields on Meteor.user() for autopublish
 * - it registers as a login handler with a given service name
 * - it publishes its runtime service configuration
 * - it stores a Drupal instance as the "drupal" global.
 */

import { Drupal } from "../shared/Drupal";
import { makeServer } from "./makeServer";

/**
 * A Meteor.startup() argument function.
 *
 * That function builds a server instance and exposes it as the "drupal" global.
 *
 * @param {JSON} json
 * @param {Accounts} accounts
 * @param {HTTP} http
 * @param {Match} match
 * @param {Meteor} meteor
 * @param {ServiceConfiguration} serviceConfiguration
 * @param {WebApp} webapp
 * @param {Log} logger
 *   A Log-compatible logger.
 * @param {object} settings
 *   Meteor settings containing configuration for accounts-drupal.
 *
 * @return {void}
 */
const onStartup = (json, accounts, http, match, meteor, serviceConfiguration, webapp, logger, settings) => {
  logger.debug('Server startup');

  const server = makeServer(json, accounts, http, match, meteor, serviceConfiguration, webapp, logger, settings);
  global.drupal = new Drupal(meteor, logger, null, server);
};

export {
  Drupal,
  onStartup,
};
