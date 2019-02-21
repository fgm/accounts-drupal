/**
 * @file
 *   Main client-side module for accounts-drupal.
 *
 * On the client side, this accounts package basically performs these tasks:
 *
 * - it registers a "loginWithDrupal" method on the Meteor global
 * - it stores a Drupal instance as the "drupal" global.
 */

import { Accounts } from "meteor/accounts-base";
import { Match } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";

import { Drupal } from "../shared/Drupal";
import { makeClient } from "./makeClient";

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
      logger.debug("Cookies exist, attempting Drupal login");
      // Attempt login if a cookie exists, logout otherwise.
      // XXX Consider taking a callback from the application here.
      client.login(document.cookie, callback);
    } else if (_.isFunction(callback)) {
      callback(new Meteor.Error("No cookie: cannot login"), null);
    }
  };

  return onLogin;
};

/**
 * A Meteor.startup() argument function
 *
 * That function builds a client instance and exposes it as the "drupal" global.
 *
 * @param {Log} logger
 *   A Log-compatible logger.
 * @param {Object} settings
 *   The public portion of Meteor.settings.
 * @param {Template|null} template
 *   The Template service, or null when not using Blaze.
 *
 * @return {void}
 */
const onStartup = (logger, settings, template = null) => {
  logger.debug('Client startup');

  const client = makeClient(Accounts, Match, Meteor, Random, template, logger, settings);
  window.drupal = new Drupal(Meteor, logger, client, null);

  /**
   * Need to wrap client.login in a closure to avoid overwriting this in
   * login().
   *
   * @param {function} callback
   *   Optional. A callback to be called at the end of login, with (err, res).
   *
   * @return {void}
   */
  Meteor.loginWithDrupal = onLoginFactory(logger, client);
};

export {
  Drupal,
  onStartup,
};
