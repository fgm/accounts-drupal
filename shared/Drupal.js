/**
 * @file
 *   Contains the Drupal composite class.
 */

Log.info('Defining shared/Drupal');

/**
 * The shared class composing DrupalClient and DrupalServer.
 *
 * @type {Drupal}
 */
Drupal = class Drupal extends DrupalBase {
  constructor(...args) {
    super(...args);
    this.props = {};
  }

  get accounts() {
    if (this.location === "client") {
      return this.client.accounts;
    } else if (this.location === "server") {
      return this.server.accounts;
    } else {
      return null;
    }
  }

  get client() {
    this.logger.debug("getting client");
    return this.props.client;
  }

  set client(client) {
    this.logger.info("setting client to " + (client ? client.constructor.name : 'null'));
    this.props.client = client;
  }

  get server() {
    this.logger.debug("getting server");
    return this.props.server;
  }

  set server(server) {
    this.logger.info("setting server to " + (server ? server.constructor.name : 'null'));
    this.props.server = server;
  }
};
