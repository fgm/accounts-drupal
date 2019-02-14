/**
 * @file
 *   Contains accounts-drupal server-side non-object code.
 */

import { DrupalBase } from "../shared/DrupalBase";
import { DrupalConfiguration } from "./DrupalConfiguration";
import { DrupalServer } from "./DrupalServer";

/**
 * Build and completely initialize a "Drupal" server instance.
 *
 * @param json
 * @param accounts
 * @param http
 * @param match
 * @param meteor
 * @param serviceConfiguration
 * @param logger
 * @param settings
 * @param webapp
 *
 * @return {DrupalServer|null}
 *   Will return null if the stream is unavailable or the instance creation or
 *   initialization fails.
 */
const makeServer = (json, accounts, http, match, meteor, serviceConfiguration, webapp, logger, settings) => {
  let server;

  try {
    // This service is located from the Meteor instance to avoid exposing the
    // internal rocketchat:streamer dependency at the application level.
    const stream = new meteor.Streamer(DrupalBase.STREAM_NAME);

    // Configure stream to allow anyone to read.
    stream.allowRead('all');
    stream.allowWrite('none');

    // Configure Authentifier.
    let drupalConfiguration = new DrupalConfiguration(meteor, serviceConfiguration, logger, settings, DrupalBase.SERVICE_NAME);
    logger.debug('Loaded configuration.');

    server = new DrupalServer(
      // Upstream services.
      accounts, meteor, logger, match, webapp,
      // Package global.
      stream,
      // Package services.
      drupalConfiguration,
      http,
      json
    );
    logger.debug('Created server instance.');

    // Store configuration in database.
    server.configuration.persist();
    logger.debug('Server configuration persisted to accounts service.');

    // Declare automatic publications.
    server.registerAutopublish();
    logger.debug('Automatic user fields published.');

    // Register the package as an accounts service.
    server.register();
    logger.debug('Drupal registered as an accounts service.');

    // Register the package web route.
    server.registerWebRoute();
    logger.debug('HTTP routes bound.');

    logger.debug(`${DrupalBase.SERVICE_NAME} login service configured`);
  }
  catch (e) {
    // Do not return an apparently usable instance if an exception occurred.
    server = null;
    logger.error(e);
  }

  return server;
};

export {
  makeServer,
}
