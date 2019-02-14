/**
 * @file
 *   Contains accounts-drupal client-side non-object code.
 *
 * - Meteor.loginWithDrupal([options, ]callback)
 */

import { DrupalClient } from "./DrupalClient";
import { DrupalBase } from "../shared/DrupalBase";

const makeClient = (accounts, match, meteor, random, template, logger, settings) => {
  let client;

  try {
    const stream = new meteor.Streamer(DrupalBase.STREAM_NAME);

    client = new DrupalClient(
      // Upstream services.
      accounts,
      match,
      meteor,
      random,
      template,

      // Package dependencies
      stream,

      // Configured services
      logger,

      // Data
      settings,
    );

    // Register the package ? Nothing to do client-side.
    logger.debug(`${DrupalBase.SERVICE_NAME} service configured`);
  }
  catch (e) {
    // Do not return an apparently usable instance if an exception occurred.
    client = null;
    logger.error(e);
  }

  return client;
};

export {
  makeClient,
}
