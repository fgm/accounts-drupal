/**
 * @file
 *   Main server-side module for accounts-drupal.
 *
 *  On the server side, an accounts package basically performs these tasks:
 *
 * - it exposes additional fields on Meteor.user() for autopublish
 * - it registers as a login handler with a given service name
 * - it publishes its runtime service configuration
 */

import {DrupalBase} from "../shared/DrupalBase";
import {Drupal} from "../shared/Drupal";
import {serverBoot} from "./serverBoot";

Log.debug('Loading sv/startup');

/**
 *
 * @param logger
 *   A Log-compatible logger.
 * @param serviceConfiguration
 * @param accounts
 * @param meteor
 * @param match
 * @param http
 * @param json
 * @param webapp
 *   A WebApp-compatible service instance
 * @param settings
 * @return {function(): Drupal}
 */
const onStartupFactory = (logger, serviceConfiguration, accounts, meteor, match, http, json, webapp, settings) => {
  return () => {
    const stream = new Meteor.Streamer(DrupalBase.STREAM_NAME);

    const server = serverBoot(
      // rocketchat:streamer
      stream,
      // A Log-compatible logger
      logger,

      // Meteor runtime.
      serviceConfiguration,
      accounts,
      meteor,
      match,
      http,

      // Language builtin.
      json,

      // Configuration data.
      settings,
    );

    logger.debug('Startup sv/web');

    // This path must match the one in Drupal module at meteor/src/Notifier::PATH.
    webapp.connectHandlers.use('/drupalUserEvent', function (req, res) {
      res.writeHead(200);
      res.end('Sent refresh request');

      const remote = req.socket.remoteAddress;
      logger.info(`Storing refresh request sent from ${remote}`);
      server.storeUpdateRequest(req.query, req.socket.remoteAddress);
    });

    logger.debug('HTTP routes bound.');

    const drupal = new Drupal(meteor, logger, null, server);
    return drupal;
  };
};

export {
  Drupal,
  onStartupFactory,
}
