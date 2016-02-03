/**
 * @file
 *   Server-side non-object code
 */

Meteor._debug('Server boot');

// Server is package-global, but not exported.
server = new DrupalServer(
  Accounts,
  new DrupalConfiguration(Meteor.settings, ServiceConfiguration)
);

// Store configuration in database.
server.configuration.persist(server.SERVICE_NAME);

// Declare automatic publications.
server.registerAutopublish();

// Register the package as an accounts service.
server.register();
