/**
 * @file
 *   Server-side non-object code
 */

Meteor._debug('Server boot');

// Server is package-global, but not exported.
server = new DrupalServer(
  Accounts,
  new DrupalConfiguration(DrupalBase.SERVICE_NAME, Meteor.settings, ServiceConfiguration)
);

// Store configuration in database.
server.configuration.persist();

// Declare automatic publications.
server.registerAutopublish();

// Register the package as an accounts service.
server.register();
