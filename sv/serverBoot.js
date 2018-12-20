/**
 * @file
 *   Server-side non-object code
 */

import { DrupalBase } from "../shared/DrupalBase";
import { DrupalConfiguration } from "./DrupalConfiguration";
import { DrupalServer } from "./DrupalServer";

Log.debug('Server boot');

/**
 *
 * @param stream
 * @param logger
 * @param serviceConfiguration
 * @param settings
 * @return {DrupalServer}
 */
const serverBoot = (stream, logger, serviceConfiguration, accounts, meteor, match, http, json, settings) => {
  let server;

  try {
    // Configure stream to allow anyone to read.
    stream.allowRead('all');
    stream.allowWrite('none');

    // Configure Authentifier.
    let drupalConfiguration = new DrupalConfiguration(
      DrupalBase.SERVICE_NAME,
      settings,
      logger,
      serviceConfiguration,
    );
    logger.debug('Loaded configuration.');

    server = new DrupalServer(
      // Upstream services.
      accounts, meteor, logger, match,
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
  }
  catch (e) {
    logger.error(e);
  }

  return server;
};

export {
  serverBoot,
}
