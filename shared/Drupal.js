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
  constructor(accounts, meteor, log, client, server) {
    super(accounts, meteor, log);
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
      let method = this.location === "client" ? client[name] : server[name];
      methods[DrupalBase.SERVICE_NAME + "." + v] = () => {
        return method;
      };
    });
    meteor.methods(methods);

    // - Initialize server-dependent state.
    meteor.call('accounts-drupal.initState', (err, res) => {
      if (err) {
        throw new meteor.Error('init-state', err);
      }
      Object.assign(this.state, res);
      if (this.location === "client") {
        this.updateUser(document.cookie);
      }
    });
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
