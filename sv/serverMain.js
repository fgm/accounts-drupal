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

import { Accounts } from "meteor/accounts-base";
import { HTTP } from "meteor/http";
import { Match } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { ServiceConfiguration } from "meteor/service-configuration";
import { WebApp } from "meteor/webapp";

import { Drupal } from "../shared/Drupal";
import { makeServer } from "./makeServer";

/**
 * A Meteor.startup() argument function.
 *
 * That function builds a server instance and exposes it as the "drupal" global.
 *
 * @param {Log} logger
 *   A Log-compatible logger.
 * @param {object} settings
 *   Meteor settings containing configuration for accounts-drupal.
 *
 * @return {void}
 */
const onStartup = (logger, settings) => {
  logger.debug('Server startup');

  const server = makeServer(JSON, Accounts, HTTP, Match, Meteor, ServiceConfiguration, WebApp, logger, settings);
  global.drupal = new Drupal(Meteor, logger, null, server);
};

export {
  Drupal,
  onStartup,
};
