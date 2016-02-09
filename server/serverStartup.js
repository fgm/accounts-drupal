/**
 * @file
 *   Server-side startup code.
 */

Log.info("Loading server/startup");

Meteor.startup(function () {
  Log.info("Startup server/sso:" +  DrupalSSO.CHANNEL_NAME + " / " + DrupalSSO.EVENT_NAME);
  var stream = new Meteor.Stream(DrupalSSO.CHANNEL_NAME);

  WebApp.connectHandlers.use('/updateUser', function (req, res, next) {
    res.writeHead(200);
    res.end('Send refresh request');
    Meteor._debug('Emitting refresh request.');
    stream.emit(DrupalSSO.EVENT_NAME);
  });

  WebApp.connectHandlers.use('/updateUserDeferred', function (req, res, next) {
    res.writeHead(200);
    res.end('Send refresh request');
    Meteor.setTimeout(function () {
      Meteor._debug('Emitting refresh request.');
      stream.emit(DrupalSSO.EVENT_NAME);
    }, 1000);
  });
});
