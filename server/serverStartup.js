/**
 * @file
 *   Server-side startup code.
 */

Log.info("Loading server/startup");

Meteor.startup(function () {
  Log.info("Startup server/sso");

  WebApp.connectHandlers.use('/updateUser', function (req, res, next) {
    res.writeHead(200);
    res.end('Send refresh request');
    Log.info("Emitting refresh request.");
    drupal.server.emit();
  });

  WebApp.connectHandlers.use('/updateUserDeferred', function (req, res, next) {
    res.writeHead(200);
    res.end('Send refresh request');
    Meteor.setTimeout(function () {
      Log.info("Emitting refresh request.");
      drupal.server.emit();
    }, 1000);
  });
});
