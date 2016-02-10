/**
 * @file
 *   Server-side non-object code
 */

Log.info('Server boot');

// Server is package-global, but not exported.
server = new DrupalServer(
  Accounts,
  Meteor,
  Log,
  new DrupalConfiguration(DrupalBase.SERVICE_NAME, Meteor.settings, ServiceConfiguration),
  DrupalSSO.CHANNEL_NAME
);

// Store configuration in database.
server.configuration.persist();

// Declare automatic publications.
server.registerAutopublish();

// Register the package as an accounts service.
server.register();
