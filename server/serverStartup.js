/**
 * @file
 *   Server-side startup code.
 */

Log.debug("Loading server/startup");

Meteor.startup(function () {
  Log.debug("Startup server/web");

  // This path must match the one in Drupal module at meteor/src/Notifier::PATH.
  WebApp.connectHandlers.use("/drupalUserEvent", function (req, res) {
    res.writeHead(200);
    res.end("Send refresh request");

    Log.info("Storing refresh request.");
    drupal.server.storeUpdateRequest(req.query);
  });

  Log.debug("HTTP routes bound.");
});
