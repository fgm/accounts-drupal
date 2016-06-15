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

    Log.info("Storing refresh request.");

    // Ensure a zero integer delay.
    req.query = req.query || {};
    req.query.delay = 0;
    drupal.server.storeUpdateRequest(req.query);
  });

  WebApp.connectHandlers.use("/updateUserDeferred", function (req, res) {
    const DEFAULT_DELAY = 1000;

    res.writeHead(200);
    res.end("Send deferred refresh request");

    // Ensure a non-zero integer delay, using default if needed.
    req.query = req.query || {};
    req.query.delay = parseInt(req.query.delay, 10) || DEFAULT_DELAY;

    Meteor.setTimeout(function () {
      Log.info("Storing deferred refresh request.");
      drupal.server.storeUpdateRequest(req.query);
    }, req.query.delay);
  });

  Log.debug("HTTP routes bound.");
});
