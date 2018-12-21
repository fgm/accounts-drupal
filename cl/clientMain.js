/**
 * @file
 *   Main client-side module for accounts-drupal.
 *
 * On the client side, this accounts package basically performs these tasks:
 *
 * - it registers a "loginWithDrupal" method on the Meteor global
 * - it stores a Drupal instance as the "drupal" global.
 */

import {Drupal} from "../shared/Drupal";
import {makeClient}from "./makeClient";

/**
 * onStartupFactory returns a Meteor.startup() argument function.
 *
 * That function builds a client instance and exposes it as the "drupal" global.
 *
 * @param {Accounts} accounts
 * @param {Match} match
 * @param {Meteor} meteor
 * @param {Random} random
 * @param {Template|null} template
 * @param {Log} logger
 *   A Log-compatible logger.
 *
 * @return {onStartup}
 *   A function suitable to pass Meteor.startup().
 */
const onStartupFactory = (accounts, match, meteor, random, template, logger) => {
  /**
   * A Meteor.startup() argument function
   *
   * @return {void}
   */
  const onStartup = () => {
    logger.debug('Client startup');

    const client = makeClient(accounts, match, meteor, random, template, logger);
    window.drupal = new Drupal(meteor, logger, client, null);

    /**
     * Need to wrap client.login in a closure to avoid overwriting this in
     * login().
     *
     * @param {function} callback
     *   Optional. A callback to be called at the end of login, with (err, res).
     *
     * @return {void}
     */
    meteor.loginWithDrupal = onLoginFactory(logger, client);
  };

  return onStartup;
};

/**
 * onLoginFactory returns a Meteor login function.
 *
 * @param {Log} logger
 * @param {DrupalClient} client
 *
 * @return {onLogin}
 */
const onLoginFactory = (logger, client) => {
  const onLogin = (callback) => {
    if (document.cookie) {
      logger.info("Cookies exist, attempting Drupal login");
      // Attempt login if a cookie exists, logout otherwise.
      // XXX Consider taking a callback from the application here.
      client.login(document.cookie, callback);
    }
  };

  return onLogin;
};

export {
  Drupal,
  onStartupFactory,
}
