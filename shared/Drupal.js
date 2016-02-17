/**
 * @file
 *   Contains the Drupal composite class.
 */

Log.debug("Defining shared/Drupal");

/**
 * The shared class composing DrupalClient and DrupalServer.
 *
 * @type {Drupal}
 */
Drupal = class Drupal extends DrupalBase {
  constructor(accounts, meteor, log, client, server) {
    super(accounts, meteor, log);
    if (this.location === "client") {
      check(client, DrupalClient);
    }
    else if (this.location === "server") {
      check(server, DrupalServer);
    }
    else {
      throw new Meteor.Error("unknown-architecture", "Trying to create Drupal class not on client or server.");
    }

    this.props = {};
    this.client = client;
    this.server = server;

    const methodNames = [
      "initState",
      "whoami"
    ];
    let methods = {};

    methodNames.forEach((v) => {
      let name = v + "Method";
      let method = this.location === "client"
        ? client[name].bind(client)
        : server[name].bind(server);
      methods[DrupalBase.SERVICE_NAME + "." + v] = method;
    });
    meteor.methods(methods);
  }

  get accounts() {
    if (this.location === "client") {
      return this.client.accounts;
    }
    if (this.location === "server") {
      return this.server.accounts;
    }
    return null;
  }

  get client() {
    this.logger.debug("Getting client");
    return this.props.client;
  }

  set client(client) {
    this.logger.debug("Setting client to " + (client ? client.constructor.name : "null"));
    this.props.client = client;
  }

  get server() {
    this.logger.debug("Getting server");
    return this.props.server;
  }

  set server(server) {
    this.logger.debug("Setting server to " + (server ? server.constructor.name : "null"));
    this.props.server = server;
  }
};
