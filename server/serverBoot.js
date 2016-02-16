/**
 * @file
 *   Server-side non-object code
 */
Log.debug('Server boot');

try {
  // Configure stream to allow anyone to read.
  stream.permissions.read(() => true);

  // Configure Authentifier.
  let drupalConfiguration = new DrupalConfiguration(DrupalBase.SERVICE_NAME, Meteor.settings, Log, ServiceConfiguration);
  Log.info("Loaded configuration.");

  // Server is package-global, but not exported.
  server = new DrupalServer(
    // Upstream services.
    Accounts, Meteor, Log,
    // Package global.
    stream,
    // Package services.
    drupalConfiguration
  );
  Log.info("Created server instance.");

  // Store configuration in database.
  server.configuration.persist();
  Log.info("Server configuration persisted to accounts service.");

  // Declare automatic publications.
  server.registerAutopublish();
  Log.info("Automatic user fields published.");

  // Register the package as an accounts service.
  server.register();
  Log.info("Drupal registered as an accounts service.");

}
catch (e) {Log.error(e);
  //process.exit(1);
}
