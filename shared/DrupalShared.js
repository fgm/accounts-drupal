/**
 * @file
 *   Contains the DrupalShared base class.
 */

/**
 * The base class for DrupalClient and DrupalServer.
 *
 * @type {DrupalShared}
 */
DrupalShared = class DrupalShared {
  constructor() {
  }

  /**
   * The name of the login service implemented by the package.
   *
   * @returns {string}
   *   The service name.
   */
  get SERVICE_NAME() {
    return "drupal";
  }

  get client() {
    Meteor._debug("getting client");
    return this.props.client;
  }

  set client(client) {
    Meteor._debug("setting client to", client);
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
    Meteor._debug("setting server to", server);
    if (!this.props) {
      this.props = {};
    }
    this.props.server = server;
  }

};

Meteor._debug('D Shared');
