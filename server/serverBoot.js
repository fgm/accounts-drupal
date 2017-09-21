/**
 * @file
 *   Server-side non-object code
 */
Log.debug('Server boot');

try {
  // Configure stream to allow anyone to read.
  stream.allowRead('all');
  stream.allowWrite('none');

  // Configure Authentifier.
  let drupalConfiguration = new DrupalConfiguration(DrupalBase.SERVICE_NAME, Meteor.settings, Log, ServiceConfiguration);
  Log.debug('Loaded configuration.');

  // Server is package-global, but not exported.
  server = new DrupalServer(
    // Upstream services.
    Accounts, Meteor, Log, Match,
    // Package global.
    stream,
    // Package services.
    drupalConfiguration,
    HTTP,
    JSON
  );
  Log.debug('Created server instance.');

  // Store configuration in database.
  server.configuration.persist();
  Log.debug('Server configuration persisted to accounts service.');

  // Declare automatic publications.
  server.registerAutopublish();
  Log.debug('Automatic user fields published.');

  // Register the package as an accounts service.
  server.register();
  Log.debug('Drupal registered as an accounts service.');
}
catch (e) {
  Log.error(e);
}
