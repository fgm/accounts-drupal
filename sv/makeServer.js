/**
 * @file
 *   Contains accounts-drupal server-side non-object code.
 */

import { DrupalBase } from '../shared/DrupalBase';
import { DrupalConfiguration } from './DrupalConfiguration';
import { DrupalServer } from './DrupalServer';

/**
 * Build and completely initialize a "Drupal" server instance.
 *
 * @param {Object} json
 *   A service compatible with Meteor json.
 * @param {Object} accounts
 *   A service compatible with Meteor Accounts-base package.
 * @param {Object} http
 *   A service compatible with Meteor http package.
 * @param {Object} match
 *   A service compatible with Meteor check package.
 * @param {Object} meteor
 *   A service compatible with the Meteor global.
 * @param {Object} serviceConfiguration
 *   A service compatible with the Meteor ServiceConfiguration type.
 * @param {Object} webapp
 *   A service compatible with Meteor WebApp.
 * @param {Object} logger
 *   A service compatible with Meteor Log.
 * @param {Object} settings
 *   The Meteor settings for the application.
 *
 * @returns {DrupalServer|Object}
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
};
