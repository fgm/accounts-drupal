/**
 * @file
 *   Contains the Drupal composite class.
 */

Meteor._debug('Defining Drupal');

/**
 * The shared class composing DrupalClient and DrupalServer.
 *
 * @type {Drupal}
 */
Drupal = class Drupal extends DrupalBase {
  constructor() {
    super()
  }

  get client() {
    Meteor._debug("getting client");
    return this.props.client;
  }

  set client(client) {
    Meteor._debug("setting client to", client ? client.constructor.name : 'null');
    if (!this.props) {
      this.props = {};
    }
    this.props.client = client;
  }

  get server() {
    Meteor._debug("getting server");
    return this.props.server;
  }

  set server(server) {
    Meteor._debug("setting server to", server ? server.constructor.name : 'null');
    if (!this.props) {
      this.props = {};
    }
    this.props.server = server;
  }

};

