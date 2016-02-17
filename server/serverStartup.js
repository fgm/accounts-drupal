/**
 * @file
 *   Server-side startup code.
 */

Log.debug("Loading server/startup");

Meteor.startup(function () {
  Log.debug("Startup server/web");

  WebApp.connectHandlers.use("/updateUser", function (req, res) {
    res.writeHead(200);
    res.end("Send refresh request");
    Log.info("Emitting refresh request.");
    drupal.server.emit();
  });

  WebApp.connectHandlers.use("/updateUserDeferred", function (req, res) {
    res.writeHead(200);
    res.end("Send refresh request");
    Meteor.setTimeout(function () {
      Log.info("Emitting deferred refresh request.");
      drupal.server.emit();
    }, 1000);
  });
  Log.debug("HTTP routes bound.");
});
