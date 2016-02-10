/**
 * @file
 *   Client-side startup code.
 */

Meteor.startup(() => {
  Log.info("Client startup");
  if (client.isAutologinEnabled()) {
    if (document.cookie) {
      Log.info("Cookies exist, trying to login");
      client.login(document.cookie);
    }
    else {
      Log.warn("No cookie: necessarily anonymous.");
    }
  }
  else {
    Log.info("Auto-login not enabled in settings.");
  }
});
